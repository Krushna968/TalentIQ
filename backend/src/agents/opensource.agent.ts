import { prisma } from '../lib/prisma.js';
import { normalizeSkills } from '../services/skills.service.js';
import { clampScore, scoreFromComponents, type AgentComponent, type AgentResult } from './types.js';

/**
 * Open Source Agent — measures contribution beyond a candidate's own repos.
 *
 * The distinction that matters is *external* contribution: commits landed in
 * forks of other people's projects, and repositories that attract other people's
 * stars and forks, are qualitatively different from a pile of personal repos.
 */

const MERGE_COMMIT = /\b(merge pull request|merged pr|merge branch)\b/i;
const REVIEW_COMMIT = /\b(review|address(?:ed|ing)? (?:review )?(?:comments|feedback)|apply suggestions)\b/i;
const FIX_COMMIT = /\b(fix(?:es|ed)?|resolve[sd]?|close[sd]?)\s+#\d+/i;
const DOC_COMMIT = /\b(docs?|documentation|readme|changelog)\b/i;

export async function runOpenSourceAgent(candidateId: string): Promise<AgentResult> {
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: { repos: { include: { commits: true } } },
  });

  if (!connection || !connection.repos.length) {
    return {
      agent: 'opensource',
      score: 0,
      confidence: 0,
      engine: 'deterministic',
      summary: 'No repository evidence is available to assess open-source contribution.',
      components: [],
      skills: [],
      signals: { available: false, reason: 'no_repos' },
    };
  }

  const publicRepos = connection.repos.filter((repo) => !repo.isPrivate);
  const forks = publicRepos.filter((repo) => repo.isFork);
  const originals = publicRepos.filter((repo) => !repo.isFork);
  const allCommits = publicRepos.flatMap((repo) => repo.commits);

  // Commits the candidate authored inside somebody else's project.
  const upstreamCommits = forks.flatMap((repo) => repo.commits);
  const mergeCommits = allCommits.filter((commit) => MERGE_COMMIT.test(commit.message));
  const reviewCommits = allCommits.filter((commit) => REVIEW_COMMIT.test(commit.message));
  const issueLinked = allCommits.filter((commit) => FIX_COMMIT.test(commit.message));
  const docCommits = allCommits.filter((commit) => DOC_COMMIT.test(commit.message));

  const stars = originals.reduce((total, repo) => total + repo.stars, 0);
  const forksReceived = originals.reduce((total, repo) => total + repo.forks, 0);
  const openIssues = publicRepos.reduce((total, repo) => total + repo.openIssues, 0);

  const adopted = originals.filter((repo) => repo.stars >= 5 || repo.forks >= 2);

  const components: AgentComponent[] = [
    {
      key: 'upstream',
      label: 'Upstream contribution',
      score: Math.min(25, forks.length * 5 + upstreamCommits.length * 0.5),
      max: 25,
      evidence: `${forks.length} fork(s) with ${upstreamCommits.length} commit(s) to other people's projects`,
    },
    {
      key: 'pull_requests',
      label: 'Pull request activity',
      score: Math.min(20, mergeCommits.length * 2),
      max: 20,
      evidence: `${mergeCommits.length} merge commit(s) observed in synced history`,
    },
    {
      key: 'issue_resolution',
      label: 'Issue resolution',
      score: Math.min(15, issueLinked.length * 2),
      max: 15,
      evidence: `${issueLinked.length} commit(s) explicitly close or fix a tracked issue`,
    },
    {
      key: 'collaboration',
      label: 'Review collaboration',
      score: Math.min(15, reviewCommits.length * 3),
      max: 15,
      evidence: `${reviewCommits.length} commit(s) respond to code review`,
    },
    {
      key: 'adoption',
      label: 'Community adoption',
      score: Math.min(15, Math.log10(stars + 1) * 7 + Math.log10(forksReceived + 1) * 5),
      max: 15,
      evidence: `${stars} star(s) and ${forksReceived} fork(s) across ${adopted.length} adopted project(s)`,
    },
    {
      key: 'stewardship',
      label: 'Project stewardship',
      score: Math.min(10, docCommits.length * 1.5 + (openIssues > 0 ? 2 : 0)),
      max: 10,
      evidence: `${docCommits.length} documentation commit(s); ${openIssues} open issue(s) being tracked`,
    },
  ];

  const score = scoreFromComponents(components);
  const skills = normalizeSkills(originals.map((repo) => repo.language).filter((language): language is string => Boolean(language)));

  return {
    agent: 'opensource',
    score,
    confidence: clampScore(publicRepos.length * 6 + allCommits.length * 0.8 + forks.length * 8),
    engine: 'deterministic',
    summary:
      `${forks.length} upstream fork(s), ${mergeCommits.length} merge commit(s), ` +
      `${stars} star(s) received across ${originals.length} original project(s).`,
    components,
    skills: skills.map((slug) => ({ slug, level: 45, source: 'opensource' })),
    signals: {
      available: true,
      publicRepos: publicRepos.length,
      forks: forks.length,
      originals: originals.length,
      upstreamCommits: upstreamCommits.length,
      mergeCommits: mergeCommits.length,
      issueLinkedCommits: issueLinked.length,
      reviewCommits: reviewCommits.length,
      starsReceived: stars,
      forksReceived,
      topProjects: adopted
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 5)
        .map((repo) => ({ name: repo.fullName, stars: repo.stars, forks: repo.forks, url: repo.url })),
    },
  };
}
