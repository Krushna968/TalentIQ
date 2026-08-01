import { prisma } from '../lib/prisma.js';

type ScoreInput = {
  repos: Array<{ description: string | null; size: number; stars: number; forks: number; pushedAt: Date | null }>;
  commits: Array<{ committedAt: Date }>;
  languages: Array<{ language: string; repoCount: number }>;
  followers: number | null;
  identityVerified?: boolean;
};

export type TalentScore = {
  score: number;
  confidence: number;
  components: Array<{ key: string; label: string; score: number; max: number; evidence: string }>;
  radar: Array<{ axis: string; value: number }>;
  evidence: { repositories: number; commits: number; languages: number; stars: number; forks: number; verified?: number };
};

const clamp = (value: number, max: number) => Math.round(Math.min(Math.max(value, 0), max) * 10) / 10;

/** Calculates a deterministic, inspectable score only from synced GitHub evidence. */
export function calculateGitHubTalentScore(input: ScoreInput, now = new Date()): TalentScore {
  const { repos, commits, languages } = input;
  const stars = repos.reduce((total, repo) => total + repo.stars, 0);
  const forks = repos.reduce((total, repo) => total + repo.forks, 0);
  const documented = repos.filter((repo) => Boolean(repo.description?.trim())).length;
  const sizeable = repos.filter((repo) => repo.size >= 100).length;
  const daysSinceLatest = repos.reduce((min, repo) => {
    if (!repo.pushedAt) return min;
    return Math.min(min, Math.max(0, (now.getTime() - repo.pushedAt.getTime()) / 86_400_000));
  }, Infinity);

  const projectQuality = clamp(Math.min(repos.length, 10) * 1.2 + Math.min(documented, 8) + Math.min(sizeable, 5), 25);
  const recentActivity = !Number.isFinite(daysSinceLatest) ? 0 : daysSinceLatest <= 30 ? 10 : daysSinceLatest <= 90 ? 7 : daysSinceLatest <= 180 ? 4 : 1;
  const activity = clamp(Math.min(commits.length, 50) * 0.3 + recentActivity, 25);
  const breadth = clamp(Math.min(languages.length, 6) * 2.5 + Math.min(languages.reduce((total, language) => total + language.repoCount, 0), 10), 25);
  const impact = clamp(Math.min(stars, 100) * 0.1 + Math.min(forks, 50) * 0.1 + Math.min(input.followers ?? 0, 100) * 0.05, 15);
  const codeEvidence = clamp(Math.min(commits.length, 30) * (10 / 30), 10);
  const score = Math.round(projectQuality + activity + breadth + impact + codeEvidence);
  const confidence = Math.round(Math.min(100, repos.length * 8 + commits.length * 1.5 + languages.length * 5 + (input.identityVerified ? 5 : 0)));

  return {
    score,
    confidence,
    components: [
      { key: 'projects', label: 'Project quality', score: projectQuality, max: 25, evidence: `${repos.length} repositories; ${documented} documented; ${sizeable} substantial` },
      { key: 'activity', label: 'Activity', score: activity, max: 25, evidence: `${commits.length} sampled commits; ${Number.isFinite(daysSinceLatest) ? `${Math.floor(daysSinceLatest)} days since latest push` : 'no push date'}` },
      { key: 'breadth', label: 'Technical breadth', score: breadth, max: 25, evidence: `${languages.length} languages across ${languages.reduce((total, language) => total + language.repoCount, 0)} repository-language signals` },
      { key: 'impact', label: 'Community impact', score: impact, max: 15, evidence: `${stars} stars, ${forks} forks, ${input.followers ?? 0} followers` },
      { key: 'code', label: 'Code evidence', score: codeEvidence, max: 10, evidence: `${commits.length} recent commit records sampled` },
    ],
    radar: [
      { axis: 'Tech Depth', value: Math.round((projectQuality / 25) * 100) },
      { axis: 'Innovation', value: Math.round((impact / 15) * 100) },
      { axis: 'Leadership', value: Math.round((impact / 15) * 100) },
      { axis: 'Velocity', value: Math.round((activity / 25) * 100) },
      { axis: 'Collab', value: Math.round((codeEvidence / 10) * 100) },
      { axis: 'Comms', value: Math.round((documented / Math.max(repos.length, 1)) * 100) },
    ],
    evidence: { repositories: repos.length, commits: commits.length, languages: languages.length, stars, forks },
  };
}

type VerifiedEvidence = { source: string; score: number | null; title: string };

const SOURCE_WEIGHTS: Record<string, { label: string; weight: number }> = {
  github: { label: 'GitHub proof of work', weight: 35 },
  credential: { label: 'Verified credentials', weight: 20 },
  hackathon: { label: 'Hackathon achievements', weight: 15 },
  assessment: { label: 'Skill assessments', weight: 15 },
  interview: { label: 'Interview performance', weight: 10 },
  presentation: { label: 'Presentation evidence', weight: 5 },
};

function averageEvidence(evidence: VerifiedEvidence[], source: string) {
  const scores = evidence.filter((item) => item.source === source && item.score !== null).map((item) => item.score as number);
  return scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null;
}

/** Reweights only verified sources so candidates are never penalised for sources they have not connected. */
export async function calculateAndStoreTalentScore(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { linkedInConnection: { select: { id: true } }, evidence: { where: { status: 'VERIFIED' as never }, select: { source: true, score: true, title: true } } },
  });
  if (!candidate) return null;

  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: { repos: { include: { commits: true } }, languageSummary: true },
  });

  const github = connection ? calculateGitHubTalentScore({
    repos: connection.repos,
    commits: connection.repos.flatMap((repo) => repo.commits),
    languages: connection.languageSummary,
    followers: connection.followers,
    identityVerified: Boolean(candidate.linkedInConnection),
  }) : null;
  const verifiedEvidence = candidate.evidence as VerifiedEvidence[];
  const sourceScores: Array<{ key: string; score: number; evidence: string }> = [];
  if (github) sourceScores.push({ key: 'github', score: github.score, evidence: `${github.evidence.repositories} repositories and ${github.evidence.commits} sampled commits` });
  for (const source of Object.keys(SOURCE_WEIGHTS).filter((key) => key !== 'github')) {
    const score = averageEvidence(verifiedEvidence, source);
    if (score !== null) sourceScores.push({ key: source, score, evidence: `${verifiedEvidence.filter((item) => item.source === source && item.score !== null).length} verified record(s)` });
  }
  const activeWeight = sourceScores.reduce((total, item) => total + SOURCE_WEIGHTS[item.key].weight, 0);
  const overallScore = activeWeight ? Math.round(sourceScores.reduce((total, item) => total + item.score * SOURCE_WEIGHTS[item.key].weight, 0) / activeWeight) : 0;
  const verifiedCount = verifiedEvidence.filter((item) => item.score !== null).length;
  const confidence = Math.min(100, Math.round((github ? github.confidence * 0.65 : 0) + verifiedCount * 12 + (candidate.linkedInConnection ? 5 : 0)));
  const components = sourceScores.map((item) => ({
    key: item.key,
    label: SOURCE_WEIGHTS[item.key].label,
    score: Math.round(item.score * SOURCE_WEIGHTS[item.key].weight / 100),
    max: SOURCE_WEIGHTS[item.key].weight,
    evidence: item.evidence,
  }));
  const getSourceScore = (source: string, fallback = 0) => averageEvidence(verifiedEvidence, source) ?? fallback;
  const radar = github ? github.radar.map((item) => ({ ...item })) : [
    { axis: 'Tech Depth', value: 0 }, { axis: 'Innovation', value: 0 }, { axis: 'Leadership', value: 0 },
    { axis: 'Velocity', value: 0 }, { axis: 'Collab', value: 0 }, { axis: 'Comms', value: 0 },
  ];
  radar[1].value = Math.round((radar[1].value + getSourceScore('hackathon')) / (getSourceScore('hackathon') ? 2 : 1));
  radar[2].value = Math.round((radar[2].value + getSourceScore('interview') + getSourceScore('presentation')) / (1 + Number(getSourceScore('interview') > 0) + Number(getSourceScore('presentation') > 0)));
  radar[4].value = Math.round((radar[4].value + getSourceScore('assessment')) / (getSourceScore('assessment') ? 2 : 1));
  radar[5].value = Math.round((radar[5].value + getSourceScore('interview') + getSourceScore('presentation')) / (1 + Number(getSourceScore('interview') > 0) + Number(getSourceScore('presentation') > 0)));
  const score: TalentScore = {
    score: overallScore,
    confidence,
    components,
    radar,
    evidence: github ? { ...github.evidence, verified: verifiedCount } : { repositories: 0, commits: 0, languages: 0, stars: 0, forks: 0, verified: verifiedCount },
  };
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { githubScore: github?.score ?? null, talentScore: score.score, radarData: JSON.stringify(score.radar), signals: JSON.stringify(score) },
  });
  return score;
}
