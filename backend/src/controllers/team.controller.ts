import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { teamContributions } from '../services/recruiter.service.js';
import { resolveCandidateId } from '../middleware/auth.middleware.js';
import { handle } from '../utils/http.js';

export const getTeamContributions = handle<AuthenticatedRequest, Response>('team.contributions', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const result = await teamContributions(candidateId);
  res.json({ candidateId, ...result });
});

export const getImpactScore = handle<AuthenticatedRequest, Response>('team.impact', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const result = await teamContributions(candidateId);
  res.json({ candidateId, available: result.available, ...(result.impact ?? { impactScore: 0, breakdown: null }) });
});
