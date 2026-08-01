import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { runAgents } from '../agents/orchestrator.js';
import { evaluateAuthenticity } from '../services/fraud.service.js';
import { listBadges } from '../services/career.service.js';
import { computeTalentIntelligence } from '../services/intelligence.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param, notFound } from '../utils/http.js';

/**
 * Verification endpoints. Each one re-runs the relevant agent against the
 * candidate's stored evidence and returns the explainable result.
 */

const runOne = async (candidateId: string, agent: 'github' | 'certificate' | 'hackathon' | 'presentation') => {
  const outcome = await runAgents(candidateId, { only: [agent] });
  const result = outcome.results.find((entry) => entry.agent === agent);
  if (!result) throw notFound(`The ${agent} agent produced no result`);
  return {
    status: (result.signals as { available?: boolean }).available === false ? 'unavailable' : 'verified',
    score: result.score,
    confidence: result.confidence,
    summary: result.summary,
    components: result.components,
    details: result.signals,
  };
};

export const verifyGithub = handle<AuthenticatedRequest, Response>('verification.github', async (req, res) => {
  res.json(await runOne(resolveWritableCandidateId(req, req.body?.candidateId), 'github'));
});

export const verifyCertification = handle<AuthenticatedRequest, Response>('verification.certification', async (req, res) => {
  res.json(await runOne(resolveWritableCandidateId(req, req.body?.candidateId), 'certificate'));
});

export const verifyHackathon = handle<AuthenticatedRequest, Response>('verification.hackathon', async (req, res) => {
  res.json(await runOne(resolveWritableCandidateId(req, req.body?.candidateId), 'hackathon'));
});

export const verifyPresentation = handle<AuthenticatedRequest, Response>('verification.presentation', async (req, res) => {
  res.json(await runOne(resolveWritableCandidateId(req, req.body?.candidateId), 'presentation'));
});

/** Runs every agent plus the verification layer and returns the full picture. */
export const verifyAll = handle<AuthenticatedRequest, Response>('verification.all', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body?.candidateId);
  res.json(await computeTalentIntelligence(candidateId));
});

export const getVerificationStatus = handle<AuthenticatedRequest, Response>('verification.status', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.id);
  const [candidate, evidence, runs] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { authenticityScore: true, talentScore: true, scoredAt: true },
    }),
    prisma.evidence.groupBy({ by: ['status'], where: { candidateId }, _count: true }),
    prisma.agentRun.findMany({
      where: { candidateId },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: { agent: true, status: true, score: true, engine: true, startedAt: true },
    }),
  ]);
  if (!candidate) throw notFound('Candidate not found');

  res.json({
    candidateId,
    overallScore: candidate.talentScore,
    authenticityScore: candidate.authenticityScore,
    lastScoredAt: candidate.scoredAt,
    evidenceByStatus: Object.fromEntries(evidence.map((row) => [row.status, row._count])),
    recentAgentRuns: runs,
  });
});

export const getAuthenticityReport = handle<AuthenticatedRequest, Response>('verification.authenticity', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.id);
  res.json(await evaluateAuthenticity(candidateId));
});

export const getBadges = handle<AuthenticatedRequest, Response>('verification.badges', async (req, res) => {
  const candidateId = resolveCandidateId(req, param(req.query.candidateId));
  res.json({ badges: await listBadges(candidateId) });
});
