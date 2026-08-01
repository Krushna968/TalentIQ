import { prisma } from '../lib/prisma.js';
import { extractSkills } from '../services/skills.service.js';
import { safeJsonParse, unique } from '../utils/helpers.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * Hackathon Agent — scores competitive delivery from hackathon evidence.
 *
 * Reads the candidate's hackathon evidence records and rewards placement,
 * event calibre, recency, and evidence of individual contribution within a team.
 */

const PLACEMENT_POINTS: Array<{ pattern: RegExp; label: string; points: number }> = [
  { pattern: /\b(winner|1st|first place|champion|gold)\b/i, label: 'Winner', points: 10 },
  { pattern: /\b(runner[- ]?up|2nd|second place|silver)\b/i, label: 'Runner-up', points: 8 },
  { pattern: /\b(3rd|third place|bronze)\b/i, label: 'Third place', points: 6 },
  { pattern: /\b(finalist|top\s*\d+|shortlist)\b/i, label: 'Finalist', points: 4 },
  { pattern: /\b(special|category|best\s+\w+)\s*(prize|award)?\b/i, label: 'Category award', points: 5 },
];

const MAJOR_EVENT = /\b(smart india hackathon|sih|mlh|major league hacking|ethglobal|hackmit|pennapps|nasa space apps|google solution challenge|icpc|kaggle|neurips|devpost)\b/i;

interface HackathonRecord {
  title: string;
  issuer: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  issuedAt: Date | null;
  verified: boolean;
  score: number | null;
}

function classify(record: HackathonRecord) {
  const haystack = [record.title, record.issuer, record.description, JSON.stringify(record.metadata)]
    .filter(Boolean)
    .join(' ');
  const placement = PLACEMENT_POINTS.find((entry) => entry.pattern.test(haystack));
  const teamSize = Number((record.metadata as { teamSize?: unknown }).teamSize) || null;
  const role = String((record.metadata as { role?: unknown }).role || '');

  return {
    placement: placement?.label || 'Participant',
    placementPoints: placement?.points ?? 2,
    majorEvent: MAJOR_EVENT.test(haystack),
    teamSize,
    role,
    // A named individual role is what separates a contributor from a passenger.
    ownership: /\b(lead|led|architect|owner|built|implemented|designed)\b/i.test(`${role} ${record.description || ''}`),
    skills: extractSkills(haystack),
  };
}

export async function runHackathonAgent(candidateId: string): Promise<AgentResult> {
  const rows = await prisma.evidence.findMany({
    where: { candidateId, source: 'hackathon', status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } },
    orderBy: { issuedAt: 'desc' },
  });

  if (!rows.length) {
    return {
      agent: 'hackathon',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No hackathon evidence has been submitted.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'no_evidence', events: [] },
    };
  }

  const records: HackathonRecord[] = rows.map((row) => ({
    title: row.title,
    issuer: row.issuer,
    description: row.description,
    metadata: safeJsonParse<Record<string, unknown>>(row.metadata, {}),
    issuedAt: row.issuedAt,
    verified: String(row.status) === 'VERIFIED',
    score: row.score,
  }));

  const classified = records.map((record) => ({ record, ...classify(record) }));
  const wins = classified.filter((entry) => entry.placementPoints >= 8).length;
  const podium = classified.filter((entry) => entry.placementPoints >= 6).length;
  const verified = classified.filter((entry) => entry.record.verified).length;
  const majors = classified.filter((entry) => entry.majorEvent).length;
  const withOwnership = classified.filter((entry) => entry.ownership).length;

  const twoYearsAgo = Date.now() - 2 * 365 * 86_400_000;
  const recent = classified.filter((entry) => (entry.record.issuedAt?.getTime() ?? 0) > twoYearsAgo).length;

  const components: AgentComponent[] = [
    {
      key: 'participation',
      label: 'Participation',
      score: Math.min(20, classified.length * 5),
      max: 20,
      evidence: `${classified.length} hackathon record(s)`,
    },
    {
      key: 'placement',
      label: 'Placement',
      score: Math.min(30, classified.reduce((total, entry) => total + entry.placementPoints, 0)),
      max: 30,
      evidence: `${wins} win(s), ${podium} podium finish(es)`,
    },
    {
      key: 'calibre',
      label: 'Event calibre',
      score: Math.min(15, majors * 7.5),
      max: 15,
      evidence: majors ? `${majors} nationally or globally recognised event(s)` : 'No major-circuit events recorded',
    },
    {
      key: 'contribution',
      label: 'Team contribution',
      score: Math.min(15, withOwnership * 5),
      max: 15,
      evidence: `${withOwnership} record(s) describe an individual ownership role`,
    },
    {
      key: 'recency',
      label: 'Recency',
      score: Math.min(10, recent * 5),
      max: 10,
      evidence: `${recent} event(s) within the last two years`,
    },
    {
      key: 'verification',
      label: 'Verification',
      score: Math.min(10, verified * 5),
      max: 10,
      evidence: `${verified} of ${classified.length} record(s) verified by a reviewer`,
    },
  ];

  const score = scoreFromComponents(components);
  const skills = unique(classified.flatMap((entry) => entry.skills)).map((slug) => ({
    slug,
    level: 50,
    source: 'hackathon',
  }));

  return {
    agent: 'hackathon',
    score,
    confidence: clampScore(classified.length * 18 + verified * 12),
    engine: 'deterministic',
    summary: `${classified.length} hackathon record(s): ${wins} win(s), ${podium} podium finish(es), ${verified} verified.`,
    components,
    skills,
    signals: {
      available: true,
      events: classified.map((entry) => ({
        title: entry.record.title,
        event: entry.record.issuer,
        placement: entry.placement,
        majorEvent: entry.majorEvent,
        teamSize: entry.teamSize,
        ownership: entry.ownership,
        verified: entry.record.verified,
        date: entry.record.issuedAt,
      })),
      wins,
      podium,
    },
  };
}
