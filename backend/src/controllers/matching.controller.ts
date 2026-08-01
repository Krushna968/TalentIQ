import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as matching from '../services/matching.service.js';
import * as copilot from '../services/copilot.service.js';
import { resolveCandidateId } from '../middleware/auth.middleware.js';
import { handle, param } from '../utils/http.js';

export const matchCandidate = handle<AuthenticatedRequest, Response>('matching.match', async (req, res) => {
  const { jobId, limit, ...rest } = req.body;
  const result = jobId ? await matching.matchForJob(jobId, limit || 20) : await matching.matchCandidates(rest, limit || 20);
  res.json(result);
});

export const getMatchScores = handle<AuthenticatedRequest, Response>('matching.scores', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  const jobId = param(req.query.jobId);
  if (!jobId) {
    res.json({ candidateId, jobs: await matching.recommendJobsForCandidate(candidateId, 10) });
    return;
  }
  res.json(await matching.scoreCandidateAgainstJob(candidateId, jobId));
});

export const getRecommendations = handle<AuthenticatedRequest, Response>('matching.recommendations', async (req, res) => {
  // Candidates get roles; recruiters get candidates for one of their roles.
  if (req.user!.role === 'candidate') {
    res.json({ jobs: await matching.recommendJobsForCandidate(resolveCandidateId(req), 10) });
    return;
  }
  const jobId = param(req.query.jobId);
  res.json(jobId ? await matching.matchForJob(jobId, 10) : await matching.matchCandidates({ skills: [] }, 10));
});

export const copilotSearch = handle<AuthenticatedRequest, Response>('matching.copilot', async (req, res) => {
  res.json(await copilot.search(req.body.query, req.body.limit || 20));
});
