import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { createGitHubOAuthState, verifyGitHubOAuthState } from '../services/github-oauth-state.service.js';
import * as linkedInService from '../services/linkedin.service.js';

export const initiateOAuth = async (req: Request, res: Response) => {
  const candidateId = req.query.candidateId as string | undefined;
  if (!candidateId) return res.status(400).json({ error: 'A candidateId is required to connect LinkedIn.' });
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found.' });
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    res.json({ mode: 'preview' });
    return;
  }
  try {
    res.json({ url: linkedInService.getOAuthUrl(createGitHubOAuthState(candidate.id, 'linkedin')) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'LinkedIn OAuth is unavailable' });
  }
};

export const createPreviewConnection = async (req: Request, res: Response) => {
  try {
    const candidateId = req.body.candidateId as string | undefined;
    if (!candidateId) return res.status(400).json({ error: 'A candidateId is required.' });
    const connection = await linkedInService.createConnectionPreview(candidateId);
    res.status(201).json({ profile: connection, mode: 'preview' });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to prepare LinkedIn connection' });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  const state = verifyGitHubOAuthState(req.query.state as string | undefined, 'linkedin');
  const code = req.query.code as string | undefined;
  if (!state || !code || req.query.error) return res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=error`);
  try {
    const token = await linkedInService.exchangeCode(code);
    await linkedInService.syncCandidateFromLinkedIn(state.candidateId, token.access_token, token.expires_in);
    res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=connected`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error', error);
    res.redirect(`${env.FRONTEND_URL}/candidate?linkedin=error`);
  }
};

export const getConnection = async (req: Request, res: Response) => {
  const connection = await prisma.linkedInConnection.findUnique({
    where: { candidateId: req.params.candidateId as string },
    select: { name: true, email: true, avatarUrl: true, locale: true, connectedAt: true, lastSyncedAt: true, syncStatus: true },
  });
  res.json({ connected: Boolean(connection), profile: connection });
};
