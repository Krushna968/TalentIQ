import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { calculateAndStoreTalentScore } from './talent-score.service.js';
import { encryptSecret } from './secret-crypto.service.js';

const GITHUB_API = 'https://api.github.com';
const SYNC_CONCURRENCY = 4;
const MAX_GITHUB_RETRIES = 3;
const MAX_GITHUB_PAGES = 100;

class GitHubApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function fetchGitHub(url: string, token: string) {
  for (let attempt = 0; attempt <= MAX_GITHUB_RETRIES; attempt++) {
    const response = await fetch(url, { headers: apiHeaders(token), signal: AbortSignal.timeout(15_000) });
    if (response.ok) return response;

    const rateLimited = response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');
    if (rateLimited && attempt < MAX_GITHUB_RETRIES) {
      const resetAt = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      const retryAfter = Number(response.headers.get('retry-after')) * 1000;
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter
        : Number.isFinite(resetAt) && resetAt > Date.now()
          ? resetAt - Date.now()
          : 1_000 * 2 ** attempt;
      await wait(Math.min(delay, 60_000));
      continue;
    }
    throw new GitHubApiError(`GitHub API request failed with status ${response.status}`, response.status);
  }
  throw new GitHubApiError('GitHub API retry limit reached', 429);
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
}

function oauthHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

function apiHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'TalentIQ',
  };
}

export function getOAuthUrl(state: string): string {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    throw new Error('GitHub OAuth is not configured');
  }
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    state,
    scope: 'read:user,public_repo',
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: oauthHeaders(),
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });
  return res.json();
}

export async function fetchGitHubUser(token: string) {
  const res = await fetchGitHub(`${GITHUB_API}/user`, token);
  return res.json();
}

export async function fetchRepos(token: string, perPage = 100) {
  const repos: any[] = [];
  let page = 1;
  while (page <= MAX_GITHUB_PAGES) {
    const res = await fetchGitHub(`${GITHUB_API}/user/repos?per_page=${perPage}&page=${page}&sort=pushed`, token);
    const data = await res.json();
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return repos;
}

export async function fetchLanguages(token: string, owner: string, repo: string) {
  const res = await fetchGitHub(`${GITHUB_API}/repos/${owner}/${repo}/languages`, token);
  return res.json();
}

export async function fetchCommits(token: string, owner: string, repo: string, perPage = 30) {
  const res = await fetchGitHub(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${perPage}`, token);
  return res.json();
}

export async function syncCandidateFromGitHub(candidateId: string, token: string) {
  const ghUser = await fetchGitHubUser(token);
  const repos = await fetchRepos(token);
  const publicRepos = repos.filter((repo) => !repo.fork && !repo.private);
  const repositorySnapshots = await mapWithConcurrency(publicRepos, SYNC_CONCURRENCY, async (repo) => {
    const [languages, commits] = await Promise.all([
      fetchLanguages(token, ghUser.login, repo.name),
      fetchCommits(token, ghUser.login, repo.name, 10),
    ]);
    return { repo, languages, commits: commits.slice(0, 10) };
  });

  const connectionData = {
    githubUsername: ghUser.login,
    githubId: ghUser.id,
    accessToken: encryptSecret(token),
    avatarUrl: ghUser.avatar_url,
    name: ghUser.name,
    bio: ghUser.bio,
    company: ghUser.company,
    location: ghUser.location,
    publicRepos: ghUser.public_repos,
    followers: ghUser.followers,
    following: ghUser.following,
    lastSyncedAt: new Date(),
    syncStatus: 'synced' as const,
  };

  const connection = await prisma.githubConnection.upsert({
    where: { candidateId },
    create: { candidateId, ...connectionData },
    update: connectionData,
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { githubConnected: true },
  });

  const syncedRepoIds: number[] = [];
  for (const { repo, languages: langs, commits } of repositorySnapshots) {
    syncedRepoIds.push(repo.id);

    const totalBytes = (Object.values(langs) as number[]).reduce<number>((a, b) => a + b, 0);

    const repoData = {
        githubConnectionId: connection.id,
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        topics: JSON.stringify(repo.topics || []),
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        size: repo.size,
        isFork: repo.fork,
        isArchived: repo.archived,
        isPrivate: repo.private,
        pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
        repoCreatedAt: repo.created_at ? new Date(repo.created_at) : null,
        repoUpdatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
    };
    const savedRepo = await prisma.githubRepo.upsert({
      where: { githubId: repo.id },
      create: repoData,
      update: repoData,
    });

    await prisma.githubRepoLanguage.deleteMany({ where: { repoId: savedRepo.id } });

    for (const [language, bytes] of Object.entries(langs) as [string, number][]) {
      await prisma.githubRepoLanguage.create({
        data: {
          repoId: savedRepo.id,
          language,
          bytes,
          percentage: totalBytes ? Math.round((bytes / totalBytes) * 10000) / 100 : null,
        },
      });
    }

    await prisma.githubCommit.deleteMany({ where: { repoId: savedRepo.id } });
    for (const c of commits) {
      await prisma.githubCommit.create({
        data: {
          repoId: savedRepo.id,
          sha: c.sha,
          message: c.commit?.message || '',
          authorName: c.commit?.author?.name,
          authorEmail: c.commit?.author?.email,
          committedAt: c.commit?.author?.date ? new Date(c.commit.author.date) : new Date(),
        },
      });
    }
  }

  // Remove old repositories only after every current repository has been saved.
  // This keeps previous evidence available if a sync fails mid-import.
  await prisma.githubRepo.deleteMany({
    where: {
      githubConnectionId: connection.id,
      ...(syncedRepoIds.length ? { githubId: { notIn: syncedRepoIds } } : {}),
    },
  });

  await prisma.githubLanguageSummary.deleteMany({ where: { githubConnectionId: connection.id } });
  const langStats = await prisma.githubRepoLanguage.groupBy({
    by: ['language'],
    where: { repo: { githubConnectionId: connection.id } },
    _sum: { bytes: true },
    _count: { language: true },
  });

  const totalAllBytes = langStats.reduce((a, b) => a + (b._sum.bytes || 0), 0);
  for (const stat of langStats) {
    await prisma.githubLanguageSummary.create({
      data: {
        githubConnectionId: connection.id,
        language: stat.language,
        totalBytes: stat._sum.bytes || 0,
        percentage: totalAllBytes ? Math.round(((stat._sum.bytes || 0) / totalAllBytes) * 10000) / 100 : null,
        repoCount: stat._count.language,
      },
    });
  }

  await calculateAndStoreTalentScore(candidateId);
  return connection;
}

export async function getGitHubProfile(candidateId: string) {
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    include: {
      repos: {
        orderBy: { stars: 'desc' },
        take: 20,
        include: {
          languages: true,
          commits: { orderBy: { committedAt: 'desc' }, take: 5 },
        },
      },
      languageSummary: { orderBy: { totalBytes: 'desc' } },
    },
  });
  return connection;
}
