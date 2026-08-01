import crypto from 'node:crypto';
import { env } from '../config/env.js';

const MAX_AGE_MS = 10 * 60 * 1000;
const consumedNonces = new Map<string, number>();

type OAuthStatePayload = { candidateId: string; provider: 'github' | 'linkedin'; nonce: string; createdAt: number };

function sign(payload: string) {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('base64url');
}

/** A short-lived, signed binding between the OAuth request and its candidate. */
export function createGitHubOAuthState(candidateId: string, provider: OAuthStatePayload['provider'] = 'github') {
  const payload = Buffer.from(JSON.stringify({ candidateId, provider, nonce: crypto.randomUUID(), createdAt: Date.now() } satisfies OAuthStatePayload)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyGitHubOAuthState(state: string | undefined, expectedProvider: OAuthStatePayload['provider'] = 'github'): OAuthStatePayload | null {
  if (!state) return null;
  const [payload, signature, ...extra] = state.split('.');
  if (!payload || !signature || extra.length) return null;

  const expected = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (!parsed.candidateId || parsed.provider !== expectedProvider || !parsed.nonce || !parsed.createdAt || Date.now() - parsed.createdAt > MAX_AGE_MS || parsed.createdAt > Date.now()) return null;
    const now = Date.now();
    for (const [nonce, expiresAt] of consumedNonces) {
      if (expiresAt <= now) consumedNonces.delete(nonce);
    }
    if (consumedNonces.has(parsed.nonce)) return null;
    consumedNonces.set(parsed.nonce, parsed.createdAt + MAX_AGE_MS);
    return parsed;
  } catch {
    return null;
  }
}
