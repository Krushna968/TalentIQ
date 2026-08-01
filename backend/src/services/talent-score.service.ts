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

/**
 * Recalculates and stores every score for a candidate.
 *
 * Composite scoring now lives in the Talent Intelligence Engine, which combines
 * all seven agents plus the verification layer. This wrapper is kept because
 * provider syncs and evidence reviews call it as their 'rescore now' hook.
 *
 * The engine imports the GitHub agent, which imports this module, so the import
 * is deferred to call time to keep the module graph acyclic.
 */
export async function calculateAndStoreTalentScore(candidateId: string) {
  const { computeTalentIntelligence } = await import('./intelligence.service.js');
  const intelligence = await computeTalentIntelligence(candidateId);
  return {
    score: intelligence.talentScore,
    confidence: intelligence.confidence,
    components: intelligence.components.map((item) => ({
      key: item.key,
      label: item.label,
      score: item.contribution,
      max: item.weight,
      evidence: item.evidence,
    })),
    radar: intelligence.radar,
    evidence: {
      repositories: 0,
      commits: 0,
      languages: 0,
      stars: 0,
      forks: 0,
      verified: intelligence.skills.filter((skill) => skill.verified).length,
    },
  };
}
