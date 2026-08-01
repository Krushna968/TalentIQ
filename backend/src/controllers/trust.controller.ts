import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import * as fraud from '../services/fraud.service.js';
import { resolveCandidateId } from '../middleware/auth.middleware.js';
import { handle, param, notFound } from '../utils/http.js';
import { safeJsonParse } from '../utils/helpers.js';

export const getFraudFlags = handle<AuthenticatedRequest, Response>('trust.flags', async (req, res) => {
  const flags = await fraud.listFlags({
    candidateId: param(req.query.candidateId) || undefined,
    status: param(req.query.status) || undefined,
  });
  res.json({
    flags: flags.map((flag) => ({
      id: flag.id,
      candidateId: flag.candidateId,
      candidate: flag.candidate,
      type: flag.type,
      severity: flag.severity,
      status: flag.status,
      detail: flag.detail,
      signals: safeJsonParse<string[]>(flag.signalsJson, []),
      detectedBy: flag.detectedBy,
      createdAt: flag.createdAt,
    })),
  });
});

export const reportFraud = handle<AuthenticatedRequest, Response>('trust.report', async (req, res) => {
  const flag = await fraud.reportFlag({
    candidateId: req.body.candidateId,
    type: req.body.type,
    detail: req.body.detail,
    severity: req.body.severity,
    reporterId: req.user!.id,
  });
  res.status(201).json({ flag });
});

export const resolveFlag = handle<AuthenticatedRequest, Response>('trust.resolve', async (req, res) => {
  const status = param(req.body?.status).toUpperCase() === 'DISMISSED' ? 'DISMISSED' : 'RESOLVED';
  res.json({ flag: await fraud.resolveFlag(param(req.params.id), req.user!.id, status) });
});

export const getTrustScore = handle<AuthenticatedRequest, Response>('trust.score', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const [candidate, flags, evidence] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId }, select: { authenticityScore: true, riskScore: true, name: true } }),
    prisma.fraudFlag.findMany({ where: { candidateId, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
    prisma.evidence.groupBy({ by: ['status'], where: { candidateId }, _count: true }),
  ]);
  if (!candidate) throw notFound('Candidate not found');

  const byStatus = Object.fromEntries(evidence.map((row) => [String(row.status), row._count]));
  const authenticity = candidate.authenticityScore ?? 0;

  res.json({
    candidateId,
    name: candidate.name,
    trustScore: authenticity,
    riskScore: candidate.riskScore ?? 0,
    risk: authenticity >= 85 ? 'low' : authenticity >= 65 ? 'medium' : authenticity >= 45 ? 'high' : 'critical',
    signals: {
      verifiedClaims: byStatus.VERIFIED ?? 0,
      pendingVerification: (byStatus.SUBMITTED ?? 0) + (byStatus.UNDER_REVIEW ?? 0),
      rejectedClaims: byStatus.REJECTED ?? 0,
      openFlags: flags.length,
    },
    flags: flags.map((flag) => ({ type: flag.type, severity: flag.severity, detail: flag.detail })),
  });
});

/** Re-runs every detector on demand. */
export const rescan = handle<AuthenticatedRequest, Response>('trust.rescan', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  res.json(await fraud.evaluateAuthenticity(candidateId));
});
