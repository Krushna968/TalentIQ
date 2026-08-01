import { prisma } from '../lib/prisma.js';
import { normalizeSkills, extractSkills, getSkill } from './skills.service.js';
import { embedFeatures, cosineSimilarity } from './knowledge-graph.service.js';
import { clamp, round, safeJsonParse, unique } from '../utils/helpers.js';

/**
 * AI Candidate Matching Engine.
 *
 * Matching is evidence-weighted rather than keyword-based: a skill the platform
 * has verified counts for more than the same skill merely claimed, and every
 * match returns the reasons behind its percentage so a recruiter can audit it.
 */

export interface MatchRequirement {
  role?: string;
  skills: string[];
  location?: string;
  seniority?: string;
  minTalentScore?: number;
  remote?: boolean;
  description?: string;
}

export interface MatchBreakdown {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface CandidateMatch {
  candidate: {
    id: string;
    name: string;
    title: string | null;
    location: string | null;
    avatar: string | null;
    talentScore: number | null;
    authenticityScore: number | null;
  };
  matchScore: number;
  breakdown: MatchBreakdown[];
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

const WEIGHTS = {
  skills: 40,
  evidence: 20,
  seniority: 12,
  location: 8,
  semantic: 12,
  authenticity: 8,
} as const;

const SENIORITY_RANK: Record<string, number> = { intern: 0, junior: 1, mid: 2, senior: 3, staff: 4, lead: 4, principal: 5 };

const seniorityOf = (value?: string | null) => {
  if (!value) return null;
  const key = Object.keys(SENIORITY_RANK).find((entry) => value.toLowerCase().includes(entry));
  return key ? SENIORITY_RANK[key] : null;
};

/** Turns a free-text role description plus explicit skills into one requirement set. */
export function buildRequirement(input: Partial<MatchRequirement>): MatchRequirement {
  const explicit = normalizeSkills(input.skills || []);
  const inferred = extractSkills(`${input.role || ''} ${input.description || ''}`);
  return {
    role: input.role,
    description: input.description,
    skills: unique([...explicit, ...inferred]),
    location: input.location,
    seniority: input.seniority,
    minTalentScore: input.minTalentScore,
    remote: input.remote,
  };
}

interface CandidateRow {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  avatar: string | null;
  talentScore: number | null;
  authenticityScore: number | null;
  skills: Array<{ slug: string; level: number; verified: boolean; sources: number }>;
  evidenceCount: number;
  verifiedEvidence: number;
  githubConnected: boolean;
}

async function loadCandidates(limit: number, minTalentScore?: number): Promise<CandidateRow[]> {
  const rows = await prisma.candidate.findMany({
    where: minTalentScore ? { talentScore: { gte: minTalentScore } } : undefined,
    include: {
      skills: { include: { skill: { select: { slug: true } } } },
      evidence: { select: { status: true } },
      githubConnection: { select: { id: true } },
    },
    take: Math.max(limit * 10, 200),
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    location: row.location,
    avatar: row.avatar,
    talentScore: row.talentScore,
    authenticityScore: row.authenticityScore,
    skills: row.skills.map((entry) => ({
      slug: entry.skill.slug,
      level: entry.level,
      verified: entry.verified,
      sources: safeJsonParse<string[]>(entry.sourcesJson, []).length,
    })),
    evidenceCount: row.evidence.length,
    verifiedEvidence: row.evidence.filter((entry) => String(entry.status) === 'VERIFIED').length,
    githubConnected: Boolean(row.githubConnection),
  }));
}

function scoreCandidate(candidate: CandidateRow, requirement: MatchRequirement, requirementVector: number[]): CandidateMatch {
  const owned = new Map(candidate.skills.map((skill) => [skill.slug, skill]));

  // Skill fit: a verified skill is worth materially more than a claimed one.
  const matched: string[] = [];
  const missing: string[] = [];
  let skillPoints = 0;

  for (const slug of requirement.skills) {
    const skill = owned.get(slug);
    if (!skill) {
      missing.push(slug);
      continue;
    }
    matched.push(slug);
    const strength = skill.level / 100;
    const verificationBonus = skill.verified ? 1.25 : skill.sources > 1 ? 1.1 : 1;
    skillPoints += Math.min(1.25, strength * verificationBonus);
  }

  const skillScore = requirement.skills.length ? clamp((skillPoints / requirement.skills.length) * 100) : 50;

  const evidenceScore = clamp(
    Math.min(100, candidate.verifiedEvidence * 18 + candidate.evidenceCount * 5 + (candidate.githubConnected ? 25 : 0)),
  );

  const wanted = seniorityOf(requirement.seniority);
  const actual = seniorityOf(candidate.title);
  const seniorityScore = wanted === null || actual === null ? 60 : clamp(100 - Math.abs(wanted - actual) * 28);

  const locationScore = !requirement.location
    ? 70
    : requirement.remote
      ? 100
      : candidate.location?.toLowerCase().includes(requirement.location.toLowerCase())
        ? 100
        : 25;

  const candidateVector = embedFeatures([
    ...candidate.skills.flatMap((skill) => Array(Math.max(1, Math.round(skill.level / 25))).fill(`skill:${skill.slug}`)),
    ...(candidate.title ? candidate.title.toLowerCase().split(/\s+/).map((word) => `title:${word}`) : []),
    ...(candidate.location ? [`location:${candidate.location.toLowerCase()}`] : []),
  ]);
  const semanticScore = clamp(((cosineSimilarity(requirementVector, candidateVector) + 1) / 2) * 100);

  const authenticityScore = candidate.authenticityScore ?? 70;

  const breakdown: MatchBreakdown[] = [
    {
      key: 'skills',
      label: 'Skill fit',
      score: skillScore,
      weight: WEIGHTS.skills,
      detail: `${matched.length} of ${requirement.skills.length} required skill(s) evidenced`,
    },
    {
      key: 'evidence',
      label: 'Evidence depth',
      score: evidenceScore,
      weight: WEIGHTS.evidence,
      detail: `${candidate.verifiedEvidence} verified record(s)${candidate.githubConnected ? ', GitHub connected' : ''}`,
    },
    {
      key: 'seniority',
      label: 'Seniority fit',
      score: seniorityScore,
      weight: WEIGHTS.seniority,
      detail: requirement.seniority
        ? `Wanted ${requirement.seniority}; profile reads as ${candidate.title || 'unspecified'}`
        : 'No seniority requirement given',
    },
    {
      key: 'location',
      label: 'Location fit',
      score: locationScore,
      weight: WEIGHTS.location,
      detail: requirement.location ? `${candidate.location || 'Unknown'} vs ${requirement.location}` : 'No location requirement given',
    },
    {
      key: 'semantic',
      label: 'Profile similarity',
      score: semanticScore,
      weight: WEIGHTS.semantic,
      detail: 'Vector similarity between the role and the candidate evidence profile',
    },
    {
      key: 'authenticity',
      label: 'Trust',
      score: authenticityScore,
      weight: WEIGHTS.authenticity,
      detail: `Authenticity ${Math.round(authenticityScore)}/100`,
    },
  ];

  const totalWeight = breakdown.reduce((total, item) => total + item.weight, 0);
  const matchScore = clamp(Math.round(breakdown.reduce((total, item) => total + item.score * item.weight, 0) / totalWeight));

  const reasons: string[] = [];
  if (matched.length) {
    const verified = matched.filter((slug) => owned.get(slug)?.verified);
    reasons.push(
      `Evidenced ${matched.length} required skill(s)${verified.length ? `, ${verified.length} of them verified` : ''}: ${matched
        .slice(0, 6)
        .map((slug) => getSkill(slug)?.name || slug)
        .join(', ')}.`,
    );
  }
  if (missing.length) {
    reasons.push(`No evidence for ${missing.slice(0, 5).map((slug) => getSkill(slug)?.name || slug).join(', ')}.`);
  }
  if (candidate.verifiedEvidence >= 3) reasons.push(`${candidate.verifiedEvidence} independently verified evidence records.`);
  if (authenticityScore < 70) reasons.push(`Authenticity is ${Math.round(authenticityScore)}/100 — review the trust report before shortlisting.`);

  return {
    candidate: {
      id: candidate.id,
      name: candidate.name,
      title: candidate.title,
      location: candidate.location,
      avatar: candidate.avatar,
      talentScore: candidate.talentScore,
      authenticityScore: candidate.authenticityScore,
    },
    matchScore,
    breakdown: breakdown.map((item) => ({ ...item, score: round(item.score, 1) })),
    matchedSkills: matched.map((slug) => getSkill(slug)?.name || slug),
    missingSkills: missing.map((slug) => getSkill(slug)?.name || slug),
    reasons,
  };
}

/** Ranks candidates against a requirement set. */
export async function matchCandidates(
  input: Partial<MatchRequirement>,
  limit = 20,
): Promise<{ requirement: MatchRequirement; matches: CandidateMatch[] }> {
  const requirement = buildRequirement(input);
  const candidates = await loadCandidates(limit, requirement.minTalentScore);

  const requirementVector = embedFeatures([
    ...requirement.skills.flatMap((slug) => [`skill:${slug}`, `skill:${slug}`]),
    ...(requirement.role ? requirement.role.toLowerCase().split(/\s+/).map((word) => `title:${word}`) : []),
    ...(requirement.location ? [`location:${requirement.location.toLowerCase()}`] : []),
  ]);

  const matches = candidates
    .map((candidate) => scoreCandidate(candidate, requirement, requirementVector))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return { requirement, matches };
}

/** Matches against a stored job posting. */
export async function matchForJob(jobId: string, limit = 20) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  return matchCandidates(
    {
      role: job.title,
      description: job.description || undefined,
      skills: safeJsonParse<string[]>(job.skillsJson, []),
      location: job.location || undefined,
      seniority: job.seniority || undefined,
      minTalentScore: job.minTalentScore ?? undefined,
      remote: job.remote,
    },
    limit,
  );
}

/** How well one candidate fits one role, including candidates outside the top ranks. */
export async function scoreCandidateAgainstJob(candidateId: string, jobId: string) {
  const { matches, requirement } = await matchForJob(jobId, 500);
  const ranked = matches.find((entry) => entry.candidate.id === candidateId);
  if (ranked) return { requirement, match: ranked };

  const rows = await loadCandidates(1);
  const candidate = rows.find((row) => row.id === candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const vector = embedFeatures(requirement.skills.flatMap((slug) => [`skill:${slug}`, `skill:${slug}`]));
  return { requirement, match: scoreCandidate(candidate, requirement, vector) };
}

/** Jobs ranked for one candidate — the candidate-side inverse of matchForJob. */
export async function recommendJobsForCandidate(candidateId: string, limit = 10) {
  const [candidate, jobs] = await Promise.all([
    prisma.candidate.findUniqueOrThrow({
      where: { id: candidateId },
      include: { skills: { include: { skill: { select: { slug: true } } } } },
    }),
    prisma.job.findMany({ where: { isActive: true }, include: { companyRef: true }, take: 200 }),
  ]);

  const owned = new Map(candidate.skills.map((entry) => [entry.skill.slug, entry]));

  return jobs
    .map((job) => {
      const required = safeJsonParse<string[]>(job.skillsJson, []);
      const matched = required.filter((slug) => owned.has(slug));
      const skillFit = required.length ? (matched.length / required.length) * 100 : 50;
      // A talent-score floor the candidate misses dampens rather than removes the match.
      const scoreGate = job.minTalentScore && (candidate.talentScore ?? 0) < job.minTalentScore ? 0.6 : 1;
      const locationFit =
        !job.location || job.remote || candidate.location?.toLowerCase().includes(job.location.toLowerCase()) ? 1 : 0.75;

      return {
        job: {
          id: job.id,
          title: job.title,
          company: job.companyRef?.name || job.company,
          location: job.location,
          remote: job.remote,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          seniority: job.seniority,
        },
        matchScore: clamp(Math.round(skillFit * scoreGate * locationFit)),
        matchedSkills: matched.map((slug) => getSkill(slug)?.name || slug),
        missingSkills: required.filter((slug) => !owned.has(slug)).map((slug) => getSkill(slug)?.name || slug),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
