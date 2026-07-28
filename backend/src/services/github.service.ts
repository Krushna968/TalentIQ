import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const GITHUB_API = 'https://api.github.com';

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
  const res = await fetch(`${GITHUB_API}/user`, { headers: apiHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function fetchRepos(token: string, perPage = 100) {
  const repos: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${GITHUB_API}/user/repos?per_page=${perPage}&page=${page}&sort=pushed`, {
      headers: apiHeaders(token),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return repos;
}

export async function fetchLanguages(token: string, owner: string, repo: string) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, {
    headers: apiHeaders(token),
  });
  if (!res.ok) return {};
  return res.json();
}

export async function fetchCommits(token: string, owner: string, repo: string, perPage = 30) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=${perPage}`, {
    headers: apiHeaders(token),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function syncCandidateFromGitHub(candidateId: string, token: string) {
  const ghUser = await fetchGitHubUser(token);
  const repos = await fetchRepos(token);

  const existing = await prisma.githubConnection.findUnique({
    where: { candidateId },
  });

  const connectionData = {
    githubUsername: ghUser.login,
    githubId: ghUser.id,
    accessToken: token,
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

  let connection;
  if (existing) {
    connection = await prisma.githubConnection.update({
      where: { candidateId },
      data: connectionData,
    });
    await prisma.githubRepo.deleteMany({ where: { githubConnectionId: connection.id } });
  } else {
    connection = await prisma.githubConnection.create({
      data: { candidateId, ...connectionData },
    });
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { githubConnected: true },
  });

  for (const repo of repos) {
    if (repo.fork || repo.private) continue;

    const langs = await fetchLanguages(token, ghUser.login, repo.name);
    const totalBytes = (Object.values(langs) as number[]).reduce<number>((a, b) => a + b, 0);

    const created = await prisma.githubRepo.create({
      data: {
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
      },
    });

    for (const [language, bytes] of Object.entries(langs) as [string, number][]) {
      await prisma.githubRepoLanguage.create({
        data: {
          repoId: created.id,
          language,
          bytes,
          percentage: totalBytes ? Math.round((bytes / totalBytes) * 10000) / 100 : null,
        },
      });
    }

    const commits = await fetchCommits(token, ghUser.login, repo.name, 10);
    for (const c of commits.slice(0, 10)) {
      await prisma.githubCommit.create({
        data: {
          repoId: created.id,
          sha: c.sha,
          message: c.commit?.message || '',
          authorName: c.commit?.author?.name,
          authorEmail: c.commit?.author?.email,
          committedAt: c.commit?.author?.date ? new Date(c.commit.author.date) : new Date(),
        },
      });
    }
  }

  const langStats = await prisma.githubRepoLanguage.groupBy({
    by: ['language'],
    where: { repo: { githubConnectionId: connection.id } },
    _sum: { bytes: true },
    _count: { language: true },
  });

  const totalAllBytes = langStats.reduce((a, b) => a + (b._sum.bytes || 0), 0);
  for (const stat of langStats) {
    await prisma.githubLanguageSummary.upsert({
      where: { githubConnectionId_language: { githubConnectionId: connection.id, language: stat.language } },
      create: {
        githubConnectionId: connection.id,
        language: stat.language,
        totalBytes: stat._sum.bytes || 0,
        percentage: totalAllBytes ? Math.round(((stat._sum.bytes || 0) / totalAllBytes) * 10000) / 100 : null,
        repoCount: stat._count.language,
      },
      update: {
        totalBytes: stat._sum.bytes || 0,
        percentage: totalAllBytes ? Math.round(((stat._sum.bytes || 0) / totalAllBytes) * 10000) / 100 : null,
        repoCount: stat._count.language,
      },
    });
  }

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