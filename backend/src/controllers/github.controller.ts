import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import * as githubService from '../services/github.service.js';
import { createGitHubOAuthState, verifyGitHubOAuthState } from '../services/github-oauth-state.service.js';

export const initiateOAuth = async (req: Request, res: Response) => {
  const candidateId = req.query.candidateId as string | undefined;
  if (!candidateId) {
    res.status(400).json({ error: 'A candidateId is required to connect GitHub.' });
    return;
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidate) {
    res.status(404).json({ error: 'Candidate not found.' });
    return;
  }

  // When production login replaces the demo session, candidateId must come from req.user, not the query string.
  const state = createGitHubOAuthState(candidate.id);
  const url = githubService.getOAuthUrl(state);
  res.json({ url });
};

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
    res.redirect(`${env.FRONTEND_URL}/candidate?github=connected&user=${ghUser.login}`);
  } catch (err) {
    console.error('GitHub OAuth callback error', err);
    res.redirect(`${env.FRONTEND_URL}/candidate?github=error&message=callback_failed`);
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
    const profile = await githubService.getGitHubProfile(candidateId);
    if (!profile) {
      res.status(404).json({ error: 'GitHub not connected' });
      return;
    }
    res.json(profile);
  } catch (err) {
    console.error('Error fetching GitHub profile', err);
    res.status(500).json({ error: 'Failed to fetch GitHub profile' });
  }
};

export const triggerSync = async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
    const connection = await prisma.githubConnection.findUnique({
      where: { candidateId },
    });
    if (!connection) {
      res.status(400).json({ error: 'GitHub not connected' });
      return;
    }

    await githubService.syncCandidateFromGitHub(candidateId, connection.accessToken);
    res.json({ message: 'Sync completed' });
  } catch (err) {
    console.error('Error syncing GitHub', err);
    res.status(500).json({ error: 'Sync failed' });
  }
};

export const checkConnection = async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.candidateId as string;
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
    res.json({ connected: !!connection, profile: connection });
  } catch (err) {
    console.error('Error checking GitHub connection', err);
    res.status(500).json({ error: 'Failed to check connection' });
  }
};
