import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { createGitHubOAuthState, verifyGitHubOAuthState } from '../services/github-oauth-state.service.js';
import * as linkedInService from '../services/linkedin.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { handle, notFound, unavailable } from '../utils/http.js';
import { logger } from '../utils/logger.js';

export const initiateOAuth = handle<AuthenticatedRequest, Response>('linkedin.initiateOAuth', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req);
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidate) throw notFound('Candidate not found.');

  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    res.json({ mode: 'preview' });
    return;
  }
  try {
    res.json({ url: linkedInService.getOAuthUrl(createGitHubOAuthState(candidate.id, 'linkedin')) });
  } catch (error) {
    throw unavailable(error instanceof Error ? error.message : 'LinkedIn OAuth is unavailable');
  }
});

export const createPreviewConnection = handle<AuthenticatedRequest, Response>('linkedin.preview', async (req, res) => {
  if (env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'LinkedIn preview connections are not available in production.' });
    return;
  }
  const candidateId = resolveWritableCandidateId(req, req.body?.candidateId);
  const connection = await linkedInService.createConnectionPreview(candidateId);
  res.status(201).json({ profile: connection, mode: 'preview' });
});

export const handleCallback = async (req: Request, res: Response) => {
  const state = verifyGitHubOAuthState(req.query.state as string | undefined, 'linkedin');
  const code = req.query.code as string | undefined;
  if (!state || !code || req.query.error) {
    res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=error`);
    return;
  }
  try {
    const token = await linkedInService.exchangeCode(code);
    await linkedInService.syncCandidateFromLinkedIn(state.candidateId, token.access_token, token.expires_in);
    res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=connected`);
  } catch (error) {
    logger.error('LinkedIn OAuth callback failed', error);
    res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=error`);
  }
};

export const getConnection = handle<AuthenticatedRequest, Response>('linkedin.getConnection', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  const connection = await prisma.linkedInConnection.findUnique({
    where: { candidateId },
    select: { name: true, email: true, avatarUrl: true, locale: true, connectedAt: true, lastSyncedAt: true, syncStatus: true },
  });
  res.json({ connected: Boolean(connection), profile: connection });
});
