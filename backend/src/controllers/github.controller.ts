import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import * as githubService from '../services/github.service.js';
import { createGitHubOAuthState, verifyGitHubOAuthState } from '../services/github-oauth-state.service.js';
import { decryptSecret } from '../services/secret-crypto.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { handle, notFound, badRequest, unavailable } from '../utils/http.js';
import { logger } from '../utils/logger.js';

export const initiateOAuth = handle<AuthenticatedRequest, Response>('github.initiateOAuth', async (req, res) => {
  // The candidate always comes from the session, so a caller cannot start an
  // OAuth flow that attaches a GitHub account to somebody else's profile.
  const candidateId = resolveWritableCandidateId(req);

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidate) throw notFound('Candidate not found.');

  try {
    const state = createGitHubOAuthState(candidate.id);
    res.json({ url: githubService.getOAuthUrl(state) });
  } catch (error) {
    throw unavailable(error instanceof Error ? error.message : 'GitHub OAuth is unavailable.');
  }
});

export const handleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = verifyGitHubOAuthState(req.query.state as string | undefined);
  if (!code || !state) {
    res.redirect(`${env.FRONTEND_URL}/candidate?github=error&message=invalid_oauth_state`);
    return;
  }

  try {
    const tokenData = await githubService.exchangeCode(code);
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      res.redirect(`${env.FRONTEND_URL}/candidate?github=error&message=invalid_token`);
      return;
    }

    const ghUser = await githubService.fetchGitHubUser(accessToken);
    const candidate = await prisma.candidate.findUnique({ where: { id: state.candidateId } });
    if (!candidate) {
      res.redirect(`${env.FRONTEND_URL}/candidate?github=error&message=no_candidate`);
      return;
    }

    await githubService.syncCandidateFromGitHub(candidate.id, accessToken);
    res.redirect(`${env.FRONTEND_URL}/candidate?github=connected&user=${encodeURIComponent(ghUser.login)}`);
  } catch (err) {
    logger.error('GitHub OAuth callback failed', err);
    res.redirect(`${env.FRONTEND_URL}/candidate?github=error&message=callback_failed`);
  }
};

export const getProfile = handle<AuthenticatedRequest, Response>('github.getProfile', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  const profile = await githubService.getGitHubProfile(candidateId);
  if (!profile) throw notFound('GitHub is not connected for this candidate.');
  res.json(profile);
});

export const triggerSync = handle<AuthenticatedRequest, Response>('github.triggerSync', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.params.candidateId);
  const connection = await prisma.githubConnection.findUnique({ where: { candidateId } });
  if (!connection) throw badRequest('GitHub is not connected for this candidate.');

  try {
    await githubService.syncCandidateFromGitHub(candidateId, decryptSecret(connection.accessToken));
    res.json({ message: 'Sync completed' });
  } catch (err) {
    logger.error('GitHub sync failed', { candidateId, error: err });
    await prisma.githubConnection.updateMany({ where: { candidateId }, data: { syncStatus: 'failed' } });
    res.status(502).json({ error: 'GitHub sync failed. Previously synced evidence has been kept.' });
  }
});

export const checkConnection = handle<AuthenticatedRequest, Response>('github.checkConnection', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  const connection = await prisma.githubConnection.findUnique({
    where: { candidateId },
    select: {
      githubUsername: true,
      avatarUrl: true,
      name: true,
      connectedAt: true,
      lastSyncedAt: true,
      syncStatus: true,
      publicRepos: true,
      followers: true,
      following: true,
    },
  });
  res.json({ connected: Boolean(connection), profile: connection });
});

export const disconnect = handle<AuthenticatedRequest, Response>('github.disconnect', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.params.candidateId);
  await prisma.$transaction([
    prisma.githubConnection.deleteMany({ where: { candidateId } }),
    prisma.candidate.update({ where: { id: candidateId }, data: { githubConnected: false, githubScore: null } }),
  ]);
  res.status(204).send();
});
