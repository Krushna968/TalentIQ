import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { computeTalentIntelligence, getStoredIntelligence, careerTimeline } from '../services/intelligence.service.js';
import { runAgents, latestAgentResults } from '../agents/orchestrator.js';
import { similarCandidates } from '../services/knowledge-graph.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param } from '../utils/http.js';

/**
 * Returns the candidate's talent intelligence.
 *
 * Reads the stored score by default so dashboards stay fast; `?refresh=true`
 * re-runs the whole agent fleet.
 */
export const getTalentScore = handle<AuthenticatedRequest, Response>('talentScore.get', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  const refresh = param(req.query.refresh) === 'true';

  const stored = refresh ? null : await getStoredIntelligence(candidateId);
  if (stored) {
    res.json({ source: 'stored', ...stored });
    return;
  }

  const intelligence = await computeTalentIntelligence(candidateId);
  res.json({ source: 'computed', ...intelligence });
});

/** Forces a full re-score. */
export const recalculate = handle<AuthenticatedRequest, Response>('talentScore.recalculate', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.params.candidateId);
  res.json(await computeTalentIntelligence(candidateId));
});

export const getAgentRuns = handle<AuthenticatedRequest, Response>('talentScore.agents', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  res.json({ agents: await latestAgentResults(candidateId) });
});

export const runAgentFleet = handle<AuthenticatedRequest, Response>('talentScore.runAgents', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.params.candidateId);
  res.json(await runAgents(candidateId, { only: req.body?.agents }));
});

export const getTimeline = handle<AuthenticatedRequest, Response>('talentScore.timeline', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  res.json({ timeline: await careerTimeline(candidateId) });
});

export const getSimilar = handle<AuthenticatedRequest, Response>('talentScore.similar', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.candidateId);
  res.json({ similar: await similarCandidates(candidateId, 6) });
});
