import { prisma } from '../lib/prisma.js';
import { normalizeSkills, extractSkills } from '../services/skills.service.js';
import { calculateGitHubTalentScore } from '../services/talent-score.service.js';
import { unique } from '../utils/helpers.js';
import { clampScore, type AgentComponent, type AgentResult } from './types.js';

/**
 * GitHub Agent — scores proof of work from synced repository evidence.
 *
 * Wraps the existing deterministic GitHub scorer and additionally derives skill
 * signals from repository languages, topics and descriptions.
 */

export async function runGithubAgent(candidateId: string): Promise<AgentResult> {
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: { repos: { include: { commits: true, languages: true } }, languageSummary: true },
  });

  if (!connection) {
    return {
      agent: 'github',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'GitHub is not connected for this candidate.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'not_connected' },
    };
  }

  const commits = connection.repos.flatMap((repo) => repo.commits);
  const base = calculateGitHubTalentScore({
    repos: connection.repos,
    commits,
    languages: connection.languageSummary,
    followers: connection.followers,
  });

  // Languages carry the strongest signal; topics and descriptions add breadth.
  const languageSlugs = normalizeSkills(connection.languageSummary.map((entry) => entry.language));
  const topicText = connection.repos
    .flatMap((repo) => [repo.description || '', repo.topics || ''])
    .join(' ');
  const inferredSlugs = extractSkills(topicText);

  const languageShare = new Map(
    connection.languageSummary.map((entry) => [entry.language.toLowerCase(), entry.percentage ?? 0]),
  );

  const skills = unique([...languageSlugs, ...inferredSlugs]).map((slug) => {
    const share = languageShare.get(slug) ?? 0;
    const isLanguage = languageSlugs.includes(slug);
    return {
      slug,
      // A dominant language is stronger evidence than a passing mention in a topic.
      level: isLanguage ? clampScore(50 + Math.min(share, 40)) : 40,
      source: 'github',
      verified: isLanguage,
    };
  });

  const components: AgentComponent[] = base.components.map((item) => ({
    key: item.key,
    label: item.label,
    score: item.score,
    max: item.max,
    evidence: item.evidence,
  }));

  const topRepos = [...connection.repos]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5)
    .map((repo) => ({ name: repo.fullName, stars: repo.stars, language: repo.language, url: repo.url }));

  return {
    agent: 'github',
    score: clampScore(base.score),
    confidence: clampScore(base.confidence),
    engine: 'deterministic',
    summary:
      `${base.evidence.repositories} repositories, ${base.evidence.commits} sampled commits, ` +
      `${base.evidence.languages} languages, ${base.evidence.stars} stars.`,
    components,
    skills,
    signals: {
      username: connection.githubUsername,
      lastSyncedAt: connection.lastSyncedAt,
      syncStatus: connection.syncStatus,
      radar: base.radar,
      evidence: base.evidence,
      topRepos,
    },
  };
}
