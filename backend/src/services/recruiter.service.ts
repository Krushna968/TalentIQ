import { prisma } from '../lib/prisma.js';
import { normalizeSkills, extractSkills, getSkill } from './skills.service.js';
import { matchForJob } from './matching.service.js';
import { clamp, round, average, safeJsonParse, unique } from '../utils/helpers.js';
import { notFound, badRequest, forbidden } from '../utils/http.js';

/**
 * Recruiter operations: company profile, job postings, hiring pipeline,
 * candidate comparison, and hiring analytics.
 *
 * Pipeline entries are scoped to the recruiter who created them, so two
 * recruiters working the same candidate keep independent views.
 */

export type PipelineStage =
  | 'DISCOVERED' | 'SCREENED' | 'SHORTLISTED' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'ON_HOLD';

export const PIPELINE_STAGES: PipelineStage[] = [
  'DISCOVERED', 'SCREENED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'ON_HOLD',
];

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export async function getCompany(recruiterId: string) {
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: recruiterId },
    include: { company: { include: { _count: { select: { jobs: true, recruiters: true } } } } },
  });
  if (!recruiter) throw notFound('Recruiter profile not found');
  return { recruiter: { id: recruiter.id, title: recruiter.title, phone: recruiter.phone }, company: recruiter.company };
}

export async function upsertCompany(recruiterId: string, input: Record<string, unknown>) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { id: recruiterId } });
  if (!recruiter) throw notFound('Recruiter profile not found');

  const name = String(input.name || '').trim();
  if (!name) throw badRequest('A company name is required');

  const data = {
    website: input.website ? String(input.website).trim() : null,
    industry: input.industry ? String(input.industry).trim() : null,
    size: input.size ? String(input.size).trim() : null,
    location: input.location ? String(input.location).trim() : null,
    about: input.about ? String(input.about).trim() : null,
    logoUrl: input.logoUrl ? String(input.logoUrl).trim() : null,
  };

  const company = await prisma.company.upsert({ where: { name }, create: { name, ...data }, update: data });
  await prisma.recruiterProfile.update({ where: { id: recruiterId }, data: { companyId: company.id } });
  return company;
}

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

export async function createJob(recruiterId: string, input: Record<string, unknown>) {
  const recruiter = await prisma.recruiterProfile.findUnique({ where: { id: recruiterId }, include: { company: true } });
  if (!recruiter) throw notFound('Recruiter profile not found');

  const title = String(input.title || '').trim();
  if (!title) throw badRequest('A job title is required');

  const description = input.description ? String(input.description) : '';
  // Requirements stated in prose still become structured skills for matching.
  const skills = unique([...normalizeSkills((input.skills as string[]) || []), ...extractSkills(`${title} ${description}`)]);

  return prisma.job.create({
    data: {
      title,
      company: recruiter.company?.name || 'Unspecified',
      companyId: recruiter.companyId,
      postedById: recruiterId,
      description: description || null,
      location: input.location ? String(input.location) : null,
      applyUrl: input.applyUrl ? String(input.applyUrl) : null,
      skillsJson: JSON.stringify(skills),
      responsibilitiesJson: JSON.stringify((input.responsibilities as string[]) || []),
      seniority: input.seniority ? String(input.seniority) : null,
      employmentType: input.employmentType ? String(input.employmentType) : null,
      remote: Boolean(input.remote),
      salaryMin: input.salaryMin === undefined ? null : Number(input.salaryMin),
      salaryMax: input.salaryMax === undefined ? null : Number(input.salaryMax),
      currency: input.currency ? String(input.currency).toUpperCase() : 'INR',
      minTalentScore: input.minTalentScore === undefined ? null : Number(input.minTalentScore),
      closesAt: input.closesAt ? new Date(String(input.closesAt)) : null,
      isActive: input.isActive === undefined ? true : Boolean(input.isActive),
    },
  });
}

export async function updateJob(recruiterId: string, jobId: string, input: Record<string, unknown>) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw notFound('Job not found');
  if (job.postedById && job.postedById !== recruiterId) throw forbidden('This job was posted by another recruiter');

  const description = input.description === undefined ? job.description || '' : String(input.description);
  const skills =
    input.skills || input.description !== undefined
      ? unique([
          ...normalizeSkills((input.skills as string[]) || safeJsonParse<string[]>(job.skillsJson, [])),
          ...extractSkills(`${input.title ?? job.title} ${description}`),
        ])
      : undefined;

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...(input.title !== undefined ? { title: String(input.title) } : {}),
      ...(input.description !== undefined ? { description: String(input.description) || null } : {}),
      ...(input.location !== undefined ? { location: String(input.location) || null } : {}),
      ...(skills ? { skillsJson: JSON.stringify(skills) } : {}),
      ...(input.responsibilities !== undefined ? { responsibilitiesJson: JSON.stringify(input.responsibilities) } : {}),
      ...(input.seniority !== undefined ? { seniority: String(input.seniority) || null } : {}),
      ...(input.employmentType !== undefined ? { employmentType: String(input.employmentType) || null } : {}),
      ...(input.remote !== undefined ? { remote: Boolean(input.remote) } : {}),
      ...(input.salaryMin !== undefined ? { salaryMin: Number(input.salaryMin) } : {}),
      ...(input.salaryMax !== undefined ? { salaryMax: Number(input.salaryMax) } : {}),
      ...(input.currency !== undefined ? { currency: String(input.currency).toUpperCase() } : {}),
      ...(input.minTalentScore !== undefined ? { minTalentScore: Number(input.minTalentScore) } : {}),
      ...(input.closesAt !== undefined ? { closesAt: input.closesAt ? new Date(String(input.closesAt)) : null } : {}),
      ...(input.isActive !== undefined ? { isActive: Boolean(input.isActive) } : {}),
    },
  });
}

export async function listJobs(recruiterId?: string) {
  const jobs = await prisma.job.findMany({
    where: recruiterId ? { postedById: recruiterId } : { isActive: true },
    include: {
      companyRef: true,
      _count: { select: { applications: true, pipelineEntries: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.companyRef?.name || job.company,
    location: job.location,
    remote: job.remote,
    seniority: job.seniority,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    minTalentScore: job.minTalentScore,
    isActive: job.isActive,
    createdAt: job.createdAt,
    closesAt: job.closesAt,
    skills: safeJsonParse<string[]>(job.skillsJson, []).map((slug) => getSkill(slug)?.name || slug),
    applications: job._count.applications,
    inPipeline: job._count.pipelineEntries,
  }));
}

export async function getJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { companyRef: true } });
  if (!job) throw notFound('Job not found');
  return {
    ...job,
    skills: safeJsonParse<string[]>(job.skillsJson, []).map((slug) => ({ slug, name: getSkill(slug)?.name || slug })),
    responsibilities: safeJsonParse<string[]>(job.responsibilitiesJson, []),
  };
}

export async function deleteJob(recruiterId: string, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw notFound('Job not found');
  if (job.postedById && job.postedById !== recruiterId) throw forbidden('This job was posted by another recruiter');
  // Closing rather than deleting preserves the pipeline history attached to it.
  return prisma.job.update({ where: { id: jobId }, data: { isActive: false } });
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function getPipeline(recruiterId: string, jobId?: string) {
  const entries = await prisma.pipelineEntry.findMany({
    where: { recruiterId, ...(jobId ? { jobId } : {}) },
    include: {
      candidate: {
        select: { id: true, name: true, title: true, avatar: true, location: true, talentScore: true, authenticityScore: true },
      },
      job: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const stages = PIPELINE_STAGES.map((stage) => ({
    name: stage,
    label: stage.charAt(0) + stage.slice(1).toLowerCase().replace('_', ' '),
    candidates: entries
      .filter((entry) => String(entry.stage) === stage)
      .map((entry) => ({
        entryId: entry.id,
        ...entry.candidate,
        job: entry.job,
        note: entry.note,
        rating: entry.rating,
        updatedAt: entry.updatedAt,
      })),
  }));

  return { stages: stages.map((stage) => ({ ...stage, count: stage.candidates.length })), total: entries.length };
}

export async function setPipelineStage(input: {
  recruiterId: string;
  candidateId: string;
  jobId?: string;
  stage: PipelineStage;
  note?: string;
  rating?: number;
}) {
  if (!PIPELINE_STAGES.includes(input.stage)) throw badRequest('Unknown pipeline stage');
  await prisma.candidate.findUniqueOrThrow({ where: { id: input.candidateId } });

  const existing = await prisma.pipelineEntry.findFirst({
    where: { recruiterId: input.recruiterId, candidateId: input.candidateId, jobId: input.jobId ?? null },
  });

  const historyEntry = { stage: input.stage, at: new Date().toISOString(), note: input.note || null };

  if (existing) {
    const history = [...safeJsonParse<unknown[]>(existing.historyJson, []), historyEntry];
    return prisma.pipelineEntry.update({
      where: { id: existing.id },
      data: {
        stage: input.stage as never,
        note: input.note ?? existing.note,
        rating: input.rating ?? existing.rating,
        historyJson: JSON.stringify(history),
      },
    });
  }

  return prisma.pipelineEntry.create({
    data: {
      recruiterId: input.recruiterId,
      candidateId: input.candidateId,
      jobId: input.jobId ?? null,
      stage: input.stage as never,
      note: input.note || null,
      rating: input.rating || null,
      historyJson: JSON.stringify([historyEntry]),
    },
  });
}

export async function removeFromPipeline(recruiterId: string, entryId: string) {
  const entry = await prisma.pipelineEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw notFound('Pipeline entry not found');
  if (entry.recruiterId !== recruiterId) throw forbidden('This pipeline entry belongs to another recruiter');
  return prisma.pipelineEntry.delete({ where: { id: entryId } });
}

// ---------------------------------------------------------------------------
// Candidate comparison
// ---------------------------------------------------------------------------

const COMPARISON_AXES = [
  { key: 'talentScore', label: 'Talent score' },
  { key: 'technicalScore', label: 'Technical' },
  { key: 'innovationScore', label: 'Innovation' },
  { key: 'leadershipScore', label: 'Leadership' },
  { key: 'growthScore', label: 'Growth potential' },
  { key: 'learningScore', label: 'Learning ability' },
  { key: 'authenticityScore', label: 'Authenticity' },
] as const;

export async function compareCandidates(candidateIds: string[], jobId?: string) {
  if (candidateIds.length < 2) throw badRequest('Select at least two candidates to compare');
  if (candidateIds.length > 6) throw badRequest('You can compare at most six candidates at once');

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: candidateIds } },
    include: { skills: { include: { skill: true }, orderBy: { level: 'desc' } }, evidence: { select: { status: true, source: true } } },
  });
  if (candidates.length !== candidateIds.length) throw notFound('One or more candidates could not be found');

  const jobMatches = jobId ? (await matchForJob(jobId, 500)).matches : [];
  const matchById = new Map(jobMatches.map((match) => [match.candidate.id, match]));

  const rows = candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    title: candidate.title,
    avatar: candidate.avatar,
    location: candidate.location,
    scores: Object.fromEntries(COMPARISON_AXES.map((axis) => [axis.key, candidate[axis.key] ?? 0])),
    matchScore: matchById.get(candidate.id)?.matchScore ?? null,
    topSkills: candidate.skills.slice(0, 8).map((entry) => ({ name: entry.skill.name, level: entry.level, verified: entry.verified })),
    verifiedEvidence: candidate.evidence.filter((entry) => String(entry.status) === 'VERIFIED').length,
    evidenceSources: unique(candidate.evidence.map((entry) => entry.source)),
  }));

  // A per-axis leader makes the table scannable rather than just numeric.
  const leaders = Object.fromEntries(
    COMPARISON_AXES.map((axis) => {
      const best = [...rows].sort((a, b) => (b.scores[axis.key] as number) - (a.scores[axis.key] as number))[0];
      return [axis.key, best?.id ?? null];
    }),
  );

  const allSkills = unique(rows.flatMap((row) => row.topSkills.map((skill) => skill.name)));
  const skillMatrix = allSkills.map((name) => ({
    skill: name,
    levels: Object.fromEntries(rows.map((row) => [row.id, row.topSkills.find((skill) => skill.name === name)?.level ?? 0])),
  }));

  return { axes: COMPARISON_AXES, candidates: rows, leaders, skillMatrix, jobId: jobId ?? null };
}

// ---------------------------------------------------------------------------
// Hiring analytics
// ---------------------------------------------------------------------------

export async function hiringAnalytics(recruiterId?: string) {
  const pipelineWhere = recruiterId ? { recruiterId } : {};

  const [candidateCount, scored, entries, jobs, interviews, flags] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.aggregate({
      _avg: { talentScore: true, authenticityScore: true, technicalScore: true },
      where: { talentScore: { not: null } },
    }),
    prisma.pipelineEntry.findMany({ where: pipelineWhere, select: { stage: true, createdAt: true, updatedAt: true, candidateId: true } }),
    prisma.job.findMany({ where: recruiterId ? { postedById: recruiterId } : {}, select: { id: true, isActive: true, createdAt: true } }),
    prisma.interviewSession.findMany({ where: { status: 'COMPLETED' }, select: { overallScore: true, recommendation: true, completedAt: true } }),
    prisma.fraudFlag.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
  ]);

  const byStage = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, entries.filter((entry) => String(entry.stage) === stage).length]),
  );

  const hired = entries.filter((entry) => String(entry.stage) === 'HIRED');
  const rejected = entries.filter((entry) => String(entry.stage) === 'REJECTED');
  const decided = hired.length + rejected.length;

  // Time to hire measured from first pipeline touch to the hire decision.
  const daysToHire = hired
    .map((entry) => (entry.updatedAt.getTime() - entry.createdAt.getTime()) / 86_400_000)
    .filter((days) => days >= 0);

  return {
    totalCandidates: candidateCount,
    scoredCandidates: await prisma.candidate.count({ where: { talentScore: { not: null } } }),
    averageTalentScore: round(scored._avg.talentScore ?? 0, 1),
    averageAuthenticity: round(scored._avg.authenticityScore ?? 0, 1),
    averageTechnical: round(scored._avg.technicalScore ?? 0, 1),
    pipeline: byStage,
    pipelineTotal: entries.length,
    uniqueCandidatesInPipeline: unique(entries.map((entry) => entry.candidateId)).length,
    conversionRate: decided ? round(hired.length / decided, 3) : 0,
    avgDaysToHire: daysToHire.length ? round(average(daysToHire), 1) : null,
    activeJobs: jobs.filter((job) => job.isActive).length,
    totalJobs: jobs.length,
    interviews: {
      completed: interviews.length,
      averageScore: interviews.length ? round(average(interviews.map((entry) => entry.overallScore ?? 0)), 1) : null,
      recommendations: interviews.reduce<Record<string, number>>((counts, entry) => {
        const key = entry.recommendation || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
    },
    openTrustFlags: flags,
  };
}

/** Monthly candidate intake and hire counts for the trend chart. */
export async function hiringTrends(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [candidates, hires] = await Promise.all([
    prisma.candidate.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.pipelineEntry.findMany({ where: { stage: 'HIRED', updatedAt: { gte: since } }, select: { updatedAt: true } }),
  ]);

  const buckets: Array<{ month: string; candidates: number; hires: number }> = [];
  for (let index = 0; index < months; index += 1) {
    const date = new Date(since);
    date.setMonth(since.getMonth() + index);
    const key = date.toISOString().slice(0, 7);
    buckets.push({
      month: key,
      candidates: candidates.filter((row) => row.createdAt.toISOString().slice(0, 7) === key).length,
      hires: hires.filter((row) => row.updatedAt.toISOString().slice(0, 7) === key).length,
    });
  }
  return buckets;
}

/** Where market demand outruns verified supply in the talent pool. */
export async function skillsGap() {
  const [jobs, skills] = await Promise.all([
    prisma.job.findMany({ where: { isActive: true }, select: { skillsJson: true } }),
    prisma.candidateSkill.findMany({ where: { level: { gte: 50 } }, include: { skill: { select: { slug: true, name: true } } } }),
  ]);

  const demand = new Map<string, number>();
  for (const job of jobs) {
    for (const slug of safeJsonParse<string[]>(job.skillsJson, [])) demand.set(slug, (demand.get(slug) || 0) + 1);
  }

  const supply = new Map<string, number>();
  const names = new Map<string, string>();
  for (const entry of skills) {
    names.set(entry.skill.slug, entry.skill.name);
    supply.set(entry.skill.slug, (supply.get(entry.skill.slug) || 0) + 1);
  }

  const maxDemand = Math.max(1, ...demand.values());
  const maxSupply = Math.max(1, ...supply.values());

  return [...new Set([...demand.keys(), ...supply.keys()])]
    .map((slug) => ({
      skill: names.get(slug) || getSkill(slug)?.name || slug,
      demand: clamp(Math.round(((demand.get(slug) || 0) / maxDemand) * 100)),
      supply: clamp(Math.round(((supply.get(slug) || 0) / maxSupply) * 100)),
      openRoles: demand.get(slug) || 0,
      qualifiedCandidates: supply.get(slug) || 0,
    }))
    .filter((row) => row.openRoles > 0 || row.qualifiedCandidates > 2)
    .sort((a, b) => b.demand - a.demand - (b.supply - a.supply))
    .slice(0, 15);
}

/** Team contribution analytics derived from synced repository evidence. */
export async function teamContributions(candidateId: string) {
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: { repos: { include: { commits: true } } },
  });

  if (!connection) {
    return { available: false, reason: 'GitHub is not connected for this candidate.', contributions: [], impact: null };
  }

  const commits = connection.repos.flatMap((repo) => repo.commits);
  const ninetyDaysAgo = Date.now() - 90 * 86_400_000;
  const recent = commits.filter((commit) => commit.committedAt.getTime() > ninetyDaysAgo);
  const merges = commits.filter((commit) => /merge pull request/i.test(commit.message));
  const reviews = commits.filter((commit) => /review|feedback|suggestion/i.test(commit.message));
  const collaborative = connection.repos.filter((repo) => unique(repo.commits.map((commit) => commit.authorEmail)).length > 1);

  const additions = commits.reduce((total, commit) => total + (commit.additions ?? 0), 0);
  const deletions = commits.reduce((total, commit) => total + (commit.deletions ?? 0), 0);

  const contributions = [
    { type: 'commits', count: commits.length, period: 'synced history' },
    { type: 'commits_recent', count: recent.length, period: 'last 90 days' },
    { type: 'pull_requests', count: merges.length, merged: merges.length },
    { type: 'reviews', count: reviews.length },
    { type: 'projects', count: connection.repos.length },
    { type: 'collaborative_projects', count: collaborative.length },
    { type: 'lines_added', count: additions },
    { type: 'lines_removed', count: deletions },
  ];

  const code = clamp(Math.min(100, commits.length * 1.2 + Math.log10(additions + 1) * 10));
  const review = clamp(Math.min(100, reviews.length * 8 + merges.length * 4));
  const mentorship = clamp(Math.min(100, collaborative.length * 15));
  const leadership = clamp(Math.min(100, merges.length * 5 + collaborative.length * 10));

  return {
    available: true,
    contributions,
    impact: {
      impactScore: clamp(Math.round(average([code, review, mentorship, leadership]))),
      breakdown: { code, review, mentorship, leadership },
    },
    collaborators: unique(commits.map((commit) => commit.authorEmail).filter((email): email is string => Boolean(email))).length,
  };
}
