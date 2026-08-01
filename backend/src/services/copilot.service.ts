import { prisma } from '../lib/prisma.js';
import { extractSkills, getSkill } from './skills.service.js';
import { completeJson, isLlmEnabled, engineName } from './llm.service.js';
import { matchCandidates, type CandidateMatch, type MatchRequirement } from './matching.service.js';
import { unique } from '../utils/helpers.js';

/**
 * Recruiter AI Copilot.
 *
 * Turns "Find React developers from Mumbai with hackathon experience" into a
 * structured query. A deterministic parser always runs; when an LLM is
 * configured its output is merged in, but only for fields the parser left
 * empty, so a provider can add recall without silently overriding a confident
 * local match.
 */

export interface ParsedQuery extends MatchRequirement {
  /** Evidence sources the recruiter asked to be present. */
  requiredEvidence: string[];
  limit?: number;
  interpretation: string;
  engine: string;
}

const LOCATION_HINTS = /\b(?:from|in|based in|located in|near)\s+([A-Z][\w.\- ]{2,30}?)(?=\s*(?:,|\.|$|\bwith\b|\bwho\b|\bthat\b|\band\b|\bhaving\b))/;

const SENIORITY_TERMS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\b(intern|internship)\b/i, value: 'intern' },
  { pattern: /\b(junior|entry[- ]level|fresher|graduate)\b/i, value: 'junior' },
  { pattern: /\b(mid[- ]level|intermediate)\b/i, value: 'mid' },
  { pattern: /\b(senior|sr\.?)\b/i, value: 'senior' },
  { pattern: /\b(staff|principal|architect)\b/i, value: 'staff' },
  { pattern: /\b(lead|team lead|tech lead)\b/i, value: 'lead' },
];

const EVIDENCE_TERMS: Array<{ pattern: RegExp; value: string }> = [
  { pattern: /\bhackathon/i, value: 'hackathon' },
  { pattern: /\b(certif|credential)/i, value: 'credential' },
  { pattern: /\b(open[- ]?source|oss|contribut)/i, value: 'opensource' },
  { pattern: /\b(github|repositor|commit)/i, value: 'github' },
  { pattern: /\b(present|talk|speaker|conference)/i, value: 'presentation' },
  { pattern: /\b(interview)/i, value: 'interview' },
  { pattern: /\b(blog|writ|article|publish)/i, value: 'social' },
];

const ROLE_TERMS = /\b(frontend|front[- ]end|backend|back[- ]end|full[- ]?stack|mobile|devops|sre|data|ml|machine learning|ai|security|qa|platform|infrastructure)\s+(?:engineer|developer|dev)\b/i;

/** Deterministic query parser — always runs, never needs a provider. */
export function parseQueryDeterministic(query: string): Omit<ParsedQuery, 'engine'> {
  const skills = extractSkills(query);

  const locationMatch = query.match(LOCATION_HINTS);
  const location = locationMatch?.[1]?.trim().replace(/\s+(with|who|that|and|having)$/i, '') || undefined;

  const seniority = SENIORITY_TERMS.find((entry) => entry.pattern.test(query))?.value;
  const requiredEvidence = unique(EVIDENCE_TERMS.filter((entry) => entry.pattern.test(query)).map((entry) => entry.value));
  const role = query.match(ROLE_TERMS)?.[0];

  const scoreMatch = query.match(/\b(?:score|rating)\s*(?:above|over|at least|>=?)\s*(\d{1,3})\b/i);
  const topMatch = query.match(/\b(?:top|first|best)\s+(\d{1,3})\b/i);

  const parts: string[] = [];
  if (role) parts.push(role);
  if (skills.length) parts.push(`skilled in ${skills.map((slug) => getSkill(slug)?.name || slug).join(', ')}`);
  if (location) parts.push(`located in ${location}`);
  if (seniority) parts.push(`at ${seniority} level`);
  if (requiredEvidence.length) parts.push(`with ${requiredEvidence.join(' and ')} evidence`);

  return {
    role,
    description: query,
    skills,
    location,
    seniority,
    remote: /\bremote\b/i.test(query),
    minTalentScore: scoreMatch ? Number(scoreMatch[1]) : undefined,
    requiredEvidence,
    limit: topMatch ? Number(topMatch[1]) : undefined,
    interpretation: parts.length ? `Searching for candidates ${parts.join(', ')}.` : `Searching across all candidates for: ${query}`,
  };
}

interface LlmQueryShape {
  role?: string;
  skills?: string[];
  location?: string;
  seniority?: string;
  requiredEvidence?: string[];
  minTalentScore?: number;
  remote?: boolean;
}

/** Parses the query, enriching the deterministic result with an LLM pass when available. */
export async function parseQuery(query: string): Promise<ParsedQuery> {
  const base = parseQueryDeterministic(query);
  if (!isLlmEnabled()) return { ...base, engine: 'deterministic' };

  const enriched = await completeJson<LlmQueryShape>({
    system:
      'You convert recruiter search phrases into a JSON filter. Keys: role, skills (array of technology names), ' +
      'location, seniority (intern|junior|mid|senior|staff|lead), requiredEvidence (subset of hackathon, credential, ' +
      'opensource, github, presentation, interview, social), minTalentScore (0-100), remote (boolean). Omit anything not stated.',
    prompt: query,
    maxTokens: 300,
  });

  if (!enriched) return { ...base, engine: 'deterministic' };

  // The deterministic parse wins wherever it found something; the model only fills gaps.
  const merged: Omit<ParsedQuery, 'engine'> = {
    ...base,
    role: base.role || enriched.role,
    skills: unique([...base.skills, ...extractSkills((enriched.skills || []).join(' '))]),
    location: base.location || enriched.location,
    seniority: base.seniority || enriched.seniority,
    requiredEvidence: unique([...base.requiredEvidence, ...(enriched.requiredEvidence || [])]),
    minTalentScore: base.minTalentScore ?? enriched.minTalentScore,
    remote: base.remote || Boolean(enriched.remote),
  };

  return { ...merged, engine: engineName() };
}

/**
 * Keeps only candidates that actually hold every requested evidence source.
 * `github` and `opensource` are satisfied by a synced GitHub connection;
 * `interview` by a completed session; the rest by an evidence record.
 */
async function filterByEvidence(matches: CandidateMatch[], required: string[]): Promise<CandidateMatch[]> {
  const ids = matches.map((match) => match.candidate.id);
  if (!ids.length) return matches;

  const [evidence, connections, interviews] = await Promise.all([
    prisma.evidence.findMany({
      where: { candidateId: { in: ids }, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } },
      select: { candidateId: true, source: true },
    }),
    prisma.githubConnection.findMany({ where: { candidateId: { in: ids } }, select: { candidateId: true } }),
    prisma.interviewSession.findMany({
      where: { candidateId: { in: ids }, status: 'COMPLETED' },
      select: { candidateId: true },
    }),
  ]);

  const held = new Map<string, Set<string>>();
  const add = (candidateId: string, source: string) => {
    const set = held.get(candidateId) || new Set<string>();
    set.add(source);
    held.set(candidateId, set);
  };

  for (const row of evidence) add(row.candidateId, row.source);
  for (const row of connections) {
    add(row.candidateId, 'github');
    add(row.candidateId, 'opensource');
  }
  for (const row of interviews) add(row.candidateId, 'interview');

  return matches.filter((match) => {
    const sources = held.get(match.candidate.id) || new Set<string>();
    return required.every((source) => sources.has(source));
  });
}

export interface CopilotResult {
  query: string;
  parsed: ParsedQuery;
  matches: CandidateMatch[];
  total: number;
  answer: string;
}

/** Runs a natural-language recruiter search end to end. */
export async function search(query: string, limit = 20): Promise<CopilotResult> {
  const parsed = await parseQuery(query);
  const effectiveLimit = Math.min(parsed.limit || limit, 100);

  const { matches } = await matchCandidates(parsed, Math.max(effectiveLimit * 3, 60));

  // Evidence requirements are a hard filter: asking for hackathon experience
  // should not surface candidates who have none, however strong otherwise.
  const filtered = parsed.requiredEvidence.length
    ? await filterByEvidence(matches, parsed.requiredEvidence)
    : matches;

  const top = filtered.slice(0, effectiveLimit);

  const answer = top.length
    ? `${parsed.interpretation} Found ${filtered.length} candidate(s); showing the top ${top.length}. ` +
      `Best fit is ${top[0].candidate.name} at ${top[0].matchScore}% — ${top[0].reasons[0] || 'evidence-backed match'}`
    : `${parsed.interpretation} No candidates currently match those requirements.`;

  return { query, parsed, matches: top, total: filtered.length, answer };
}
