import { prisma } from '../lib/prisma.js';
import { listCandidateSkills, getSkill } from './skills.service.js';
import { latestAgentResults } from '../agents/orchestrator.js';
import { complete } from './llm.service.js';
import { clamp, round, safeJsonParse, unique } from '../utils/helpers.js';

/**
 * Candidate-facing career intelligence.
 *
 * Everything here is derived from evidence the platform already holds, so a
 * generated resume or salary band can always be traced back to a source.
 */

// ---------------------------------------------------------------------------
// Resume builder
// ---------------------------------------------------------------------------

export interface ResumeDraft {
  headline: string;
  summary: string;
  skills: Array<{ name: string; level: number; verified: boolean }>;
  experience: Array<{ title: string; detail: string; source: string }>;
  projects: Array<{ name: string; detail: string; url?: string; stars?: number }>;
  credentials: Array<{ title: string; issuer: string | null; issuedAt: Date | null; verified: boolean }>;
  achievements: string[];
  evidenceBacked: number;
}

/** Assembles a resume draft entirely from verified evidence. */
export async function generateResumeDraft(candidateId: string, targetRole?: string): Promise<ResumeDraft> {
  const [candidate, skills, evidence, github, agents] = await Promise.all([
    prisma.candidate.findUniqueOrThrow({ where: { id: candidateId }, include: { profile: true } }),
    listCandidateSkills(candidateId),
    prisma.evidence.findMany({ where: { candidateId, status: 'VERIFIED' }, orderBy: { issuedAt: 'desc' } }),
    prisma.githubConnection.findUnique({ where: { candidateId }, include: { repos: { orderBy: { stars: 'desc' }, take: 6 } } }),
    latestAgentResults(candidateId),
  ]);

  const topSkills = skills.slice(0, 14);
  const credentials = evidence.filter((row) => row.source === 'credential');
  const hackathons = evidence.filter((row) => row.source === 'hackathon');

  const projects = (github?.repos || [])
    .filter((repo) => !repo.isFork)
    .map((repo) => ({
      name: repo.name,
      detail: repo.description || `${repo.language || 'Software'} project with ${repo.stars} star(s).`,
      url: repo.url,
      stars: repo.stars,
    }));

  const experience = [
    ...(candidate.profile ? safeJsonParse<Array<{ title?: string; detail?: string }>>(candidate.profile.workHistoryJson, []) : []).map(
      (entry) => ({ title: entry.title || 'Role', detail: entry.detail || '', source: 'profile' }),
    ),
    ...hackathons.map((row) => ({
      title: row.title,
      detail: row.description || `Hackathon entry${row.issuer ? ` at ${row.issuer}` : ''}.`,
      source: 'hackathon',
    })),
  ];

  const achievements = unique([
    ...hackathons.map((row) => row.title),
    ...(github ? [`${github.repos.reduce((total, repo) => total + repo.stars, 0)} GitHub stars across public projects`] : []),
    ...(agents.opensource?.signals as { mergeCommits?: number } | undefined)?.mergeCommits
      ? [`${(agents.opensource!.signals as { mergeCommits: number }).mergeCommits} merged pull requests`]
      : [],
  ]).slice(0, 8);

  const headline =
    targetRole?.trim() ||
    candidate.title ||
    (topSkills.length ? `${getSkill(topSkills[0].slug)?.name || topSkills[0].name} Engineer` : 'Software Engineer');

  const factual =
    `${candidate.name} — ${headline}. Verified across ${evidence.length} evidence record(s) and ${skills.length} tracked skill(s). ` +
    `Talent score ${candidate.talentScore ?? 'not yet calculated'}.`;

  const generated = await complete({
    system: 'You write a three-sentence resume summary from verified facts only. Never invent employers, dates, or titles.',
    prompt: `Target role: ${headline}\n\nVerified facts:\n${JSON.stringify(
      {
        skills: topSkills.map((skill) => skill.name),
        projects: projects.slice(0, 5),
        credentials: credentials.map((row) => ({ title: row.title, issuer: row.issuer })),
        achievements,
      },
      null,
      2,
    )}`,
    maxTokens: 300,
  });

  return {
    headline,
    summary: generated || factual,
    skills: topSkills.map((skill) => ({ name: skill.name, level: skill.level, verified: skill.verified })),
    experience,
    projects,
    credentials: credentials.map((row) => ({ title: row.title, issuer: row.issuer, issuedAt: row.issuedAt, verified: true })),
    achievements,
    evidenceBacked: evidence.length + projects.length,
  };
}

// ---------------------------------------------------------------------------
// Portfolio generator
// ---------------------------------------------------------------------------

export async function generatePortfolio(candidateId: string) {
  const [candidate, skills, github, evidence] = await Promise.all([
    prisma.candidate.findUniqueOrThrow({ where: { id: candidateId }, include: { profile: { include: { links: true } } } }),
    listCandidateSkills(candidateId),
    prisma.githubConnection.findUnique({ where: { candidateId }, include: { repos: { include: { languages: true } } } }),
    prisma.evidence.findMany({ where: { candidateId, status: 'VERIFIED' } }),
  ]);

  const showcase = (github?.repos || [])
    .filter((repo) => !repo.isFork && (repo.description || repo.stars > 0))
    .sort((a, b) => b.stars - a.stars || b.size - a.size)
    .slice(0, 6)
    .map((repo) => ({
      title: repo.name,
      description: repo.description || 'No description provided in the repository.',
      url: repo.url,
      homepage: repo.homepage,
      stars: repo.stars,
      forks: repo.forks,
      technologies: repo.languages.sort((a, b) => b.bytes - a.bytes).slice(0, 4).map((entry) => entry.language),
      lastUpdated: repo.pushedAt,
    }));

  return {
    candidate: { name: candidate.name, title: candidate.title, bio: candidate.bio, avatar: candidate.avatar, location: candidate.location },
    headline: candidate.title || 'Engineer',
    skillGroups: Object.entries(
      skills.reduce<Record<string, typeof skills>>((groups, skill) => {
        groups[skill.category] = [...(groups[skill.category] || []), skill];
        return groups;
      }, {}),
    ).map(([category, entries]) => ({ category, skills: entries.map((entry) => ({ name: entry.name, level: entry.level, verified: entry.verified })) })),
    projects: showcase,
    credentials: evidence.filter((row) => row.source === 'credential').map((row) => ({ title: row.title, issuer: row.issuer, url: row.referenceUrl })),
    links: candidate.profile?.links.filter((link) => link.isPublic).map((link) => ({ label: link.label, url: link.url })) || [],
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Salary prediction
// ---------------------------------------------------------------------------

/** Fallback bands (INR, annual) used when no benchmark row matches. */
const DEFAULT_BANDS: Record<string, { p25: number; p50: number; p75: number }> = {
  junior: { p25: 600_000, p50: 900_000, p75: 1_400_000 },
  mid: { p25: 1_400_000, p50: 2_200_000, p75: 3_200_000 },
  senior: { p25: 3_000_000, p50: 4_500_000, p75: 6_500_000 },
  staff: { p25: 5_500_000, p50: 8_000_000, p75: 12_000_000 },
};

const ROLE_FAMILIES: Array<{ family: string; pattern: RegExp; premium: number }> = [
  { family: 'ml-ai', pattern: /\b(ml|machine learning|ai|data scien|research)\b/i, premium: 1.2 },
  { family: 'infrastructure', pattern: /\b(devops|sre|platform|infra|cloud)\b/i, premium: 1.12 },
  { family: 'backend', pattern: /\b(backend|back-end|server|api)\b/i, premium: 1.05 },
  { family: 'fullstack', pattern: /\b(full[- ]?stack)\b/i, premium: 1.0 },
  { family: 'frontend', pattern: /\b(frontend|front-end|ui|web)\b/i, premium: 0.95 },
  { family: 'mobile', pattern: /\b(mobile|android|ios|flutter)\b/i, premium: 0.98 },
];

function seniorityFrom(experienceYears: number | null, talentScore: number) {
  const years = experienceYears ?? 0;
  if (years >= 8 || talentScore >= 90) return 'staff';
  if (years >= 4 || talentScore >= 78) return 'senior';
  if (years >= 2 || talentScore >= 60) return 'mid';
  return 'junior';
}

export async function predictSalary(candidateId: string) {
  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
    include: { user: { select: { experienceYears: true } } },
  });
  const skills = await listCandidateSkills(candidateId);

  const talentScore = candidate.talentScore ?? 0;
  const seniority = seniorityFrom(candidate.user?.experienceYears ?? null, talentScore);
  const roleText = `${candidate.title || ''} ${skills.slice(0, 8).map((skill) => skill.name).join(' ')}`;
  const family = ROLE_FAMILIES.find((entry) => entry.pattern.test(roleText)) || ROLE_FAMILIES[3];
  const region = candidate.location?.split(',')[0]?.trim() || 'India';

  const benchmark = await prisma.salaryBenchmark.findFirst({
    where: { roleFamily: family.family, seniority, region: { equals: region, mode: 'insensitive' } },
  });

  const band = benchmark
    ? { p25: benchmark.p25, p50: benchmark.p50, p75: benchmark.p75 }
    : DEFAULT_BANDS[seniority];

  // Talent score shifts a candidate within their band rather than out of it.
  const multiplier = family.premium * (0.85 + (talentScore / 100) * 0.35);
  const verifiedBoost = 1 + Math.min(0.08, skills.filter((skill) => skill.verified).length * 0.01);

  const scale = (value: number) => Math.round((value * multiplier * verifiedBoost) / 10_000) * 10_000;

  return {
    currency: benchmark?.currency || 'INR',
    seniority,
    roleFamily: family.family,
    region: benchmark?.region || region,
    range: { p25: scale(band.p25), p50: scale(band.p50), p75: scale(band.p75) },
    basis: benchmark ? 'benchmark' : 'model-default',
    confidence: clamp(Math.round((benchmark ? 60 : 35) + Math.min(30, skills.length * 2) + (talentScore ? 10 : 0))),
    drivers: [
      `Seniority assessed as ${seniority}`,
      `Role family ${family.family} (${round((family.premium - 1) * 100, 0)}% market premium)`,
      `Talent score ${talentScore || 'not calculated'}`,
      `${skills.filter((skill) => skill.verified).length} verified skill(s)`,
    ],
    caveat: 'An indicative band derived from platform evidence and reference data, not an offer or a market guarantee.',
  };
}

// ---------------------------------------------------------------------------
// Learning recommendations
// ---------------------------------------------------------------------------

/** Skills most in demand across active jobs but weak or missing for this candidate. */
export async function recommendLearning(candidateId: string) {
  const [skills, jobs] = await Promise.all([
    listCandidateSkills(candidateId),
    prisma.job.findMany({ where: { isActive: true }, select: { skillsJson: true, title: true } }),
  ]);

  const owned = new Map(skills.map((skill) => [skill.slug, skill.level]));
  const demand = new Map<string, number>();
  for (const job of jobs) {
    for (const slug of safeJsonParse<string[]>(job.skillsJson, [])) {
      demand.set(slug, (demand.get(slug) || 0) + 1);
    }
  }

  const gaps = [...demand.entries()]
    .map(([slug, count]) => ({ slug, demand: count, level: owned.get(slug) ?? 0 }))
    .filter((entry) => entry.level < 60)
    .sort((a, b) => b.demand - a.demand || a.level - b.level)
    .slice(0, 8);

  const resources = gaps.length
    ? await prisma.learningResource.findMany({ where: { skillSlug: { in: gaps.map((gap) => gap.slug) } } })
    : [];

  return {
    gaps: gaps.map((gap) => {
      const definition = getSkill(gap.slug);
      return {
        slug: gap.slug,
        name: definition?.name || gap.slug,
        category: definition?.category || 'general',
        currentLevel: gap.level,
        marketDemand: gap.demand,
        impact: gap.level === 0 ? 'missing' : 'developing',
        resources: resources
          .filter((resource) => resource.skillSlug === gap.slug)
          .map((resource) => ({ title: resource.title, provider: resource.provider, url: resource.url, level: resource.level, hours: resource.hours })),
      };
    }),
    strengths: skills.filter((skill) => skill.level >= 70).slice(0, 6).map((skill) => skill.name),
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Verified badges
// ---------------------------------------------------------------------------

interface BadgeRule {
  label: string;
  description: string;
  earned: (context: BadgeContext) => boolean;
}

interface BadgeContext {
  verifiedEvidence: number;
  credentials: number;
  hackathonWins: number;
  githubConnected: boolean;
  stars: number;
  authenticityScore: number;
  talentScore: number;
  verifiedSkills: number;
  interviewsCompleted: number;
}

const BADGE_RULES: BadgeRule[] = [
  { label: 'GitHub Verified', description: 'A GitHub account is connected and synced.', earned: (c) => c.githubConnected },
  { label: 'Credential Verified', description: 'At least one credential passed reviewer verification.', earned: (c) => c.credentials >= 1 },
  { label: 'Hackathon Winner', description: 'Placed first or runner-up in a verified hackathon.', earned: (c) => c.hackathonWins >= 1 },
  { label: 'Open Source Contributor', description: '50 or more stars earned across public projects.', earned: (c) => c.stars >= 50 },
  { label: 'Fully Authentic', description: 'Passed all six verification checks with no open concerns.', earned: (c) => c.authenticityScore >= 95 },
  { label: 'Top Talent', description: 'Talent score of 85 or above.', earned: (c) => c.talentScore >= 85 },
  { label: 'Interview Ready', description: 'Completed an AI interview end to end.', earned: (c) => c.interviewsCompleted >= 1 },
  { label: 'Deeply Verified', description: 'Five or more skills corroborated by verified evidence.', earned: (c) => c.verifiedSkills >= 5 },
];

/** Recomputes badges from current evidence and syncs the stored set. */
export async function listBadges(candidateId: string) {
  const [candidate, evidence, github, skills, interviews] = await Promise.all([
    prisma.candidate.findUniqueOrThrow({ where: { id: candidateId } }),
    prisma.evidence.findMany({ where: { candidateId, status: 'VERIFIED' }, select: { source: true, title: true } }),
    prisma.githubConnection.findUnique({ where: { candidateId }, include: { repos: { select: { stars: true } } } }),
    listCandidateSkills(candidateId),
    prisma.interviewSession.count({ where: { candidateId, status: 'COMPLETED' } }),
  ]);

  const context: BadgeContext = {
    verifiedEvidence: evidence.length,
    credentials: evidence.filter((row) => row.source === 'credential').length,
    hackathonWins: evidence.filter((row) => row.source === 'hackathon' && /\b(winner|1st|first|runner[- ]?up|2nd)\b/i.test(row.title)).length,
    githubConnected: Boolean(github),
    stars: github?.repos.reduce((total, repo) => total + repo.stars, 0) ?? 0,
    authenticityScore: candidate.authenticityScore ?? 0,
    talentScore: candidate.talentScore ?? 0,
    verifiedSkills: skills.filter((skill) => skill.verified).length,
    interviewsCompleted: interviews,
  };

  const earned = BADGE_RULES.filter((rule) => rule.earned(context));
  const existing = await prisma.badge.findMany({ where: { candidateId } });

  for (const rule of earned) {
    if (existing.some((badge) => badge.label === rule.label)) continue;
    await prisma.badge.create({ data: { candidateId, label: rule.label, description: rule.description } });
  }

  // Badges whose criteria no longer hold are withdrawn, so a badge always means
  // the evidence is still there.
  const revoked = existing.filter((badge) => !earned.some((rule) => rule.label === badge.label));
  if (revoked.length) await prisma.badge.deleteMany({ where: { id: { in: revoked.map((badge) => badge.id) } } });

  return BADGE_RULES.map((rule) => ({
    label: rule.label,
    description: rule.description,
    earned: earned.some((entry) => entry.label === rule.label),
  }));
}
