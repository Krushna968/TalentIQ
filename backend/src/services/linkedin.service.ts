import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { calculateAndStoreTalentScore } from './talent-score.service.js';
import { encryptSecret } from './secret-crypto.service.js';

const AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

export function getOAuthUrl(state: string) {
  if (!env.LINKEDIN_CLIENT_ID) throw new Error('LinkedIn OAuth is not configured');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: env.LINKEDIN_CALLBACK_URL,
    scope: 'openid profile email',
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string; expires_in?: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code', code,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
    redirect_uri: env.LINKEDIN_CALLBACK_URL,
  });
  const response = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error(`LinkedIn token exchange failed: ${response.status}`);
  return response.json();
}

export async function fetchUserInfo(accessToken: string) {
  const response = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`LinkedIn userinfo request failed: ${response.status}`);
  return response.json() as Promise<{ sub: string; name?: string; email?: string; picture?: string; locale?: string }>;
}

export async function syncCandidateFromLinkedIn(candidateId: string, accessToken: string, expiresIn?: number) {
  const profile = await fetchUserInfo(accessToken);
  if (!profile.sub) throw new Error('LinkedIn did not return a member identifier');
  const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
  const connection = await prisma.linkedInConnection.upsert({
    where: { candidateId },
    create: {
      candidateId, linkedInId: profile.sub, accessToken: encryptSecret(accessToken), tokenExpiresAt,
      name: profile.name, email: profile.email, avatarUrl: profile.picture, locale: profile.locale,
      lastSyncedAt: new Date(), syncStatus: 'synced',
    },
    update: {
      linkedInId: profile.sub, accessToken: encryptSecret(accessToken), tokenExpiresAt,
      name: profile.name, email: profile.email, avatarUrl: profile.picture, locale: profile.locale,
      lastSyncedAt: new Date(), syncStatus: 'synced',
    },
  });
  await calculateAndStoreTalentScore(candidateId);
  return connection;
}

/** Provides a complete local connection state when a LinkedIn app has not been configured yet. */
export async function createConnectionPreview(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true, name: true, email: true } });
  if (!candidate) throw new Error('Candidate not found');
  const connection = await prisma.linkedInConnection.upsert({
    where: { candidateId },
    create: {
      candidateId,
      linkedInId: `preview:${candidate.id}`,
      accessToken: 'connection-preview',
      name: candidate.name,
      email: candidate.email,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(candidate.name)}`,
      locale: 'en_US',
      lastSyncedAt: new Date(),
      syncStatus: 'preview',
    },
    update: {
      name: candidate.name,
      email: candidate.email,
      avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(candidate.name)}`,
      lastSyncedAt: new Date(),
      syncStatus: 'preview',
    },
  });
  await calculateAndStoreTalentScore(candidateId);
  return connection;
}
