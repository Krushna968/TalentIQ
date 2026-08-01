import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as recruiters from '../services/recruiter.service.js';
import { skillCooccurrence } from '../services/knowledge-graph.service.js';
import { handle, param } from '../utils/http.js';

/** Recruiters see their own funnel; admins see the whole platform. */
const scope = (req: AuthenticatedRequest) => (req.user!.role === 'admin' ? undefined : req.user!.recruiterId);

export const getHiringAnalytics = handle<AuthenticatedRequest, Response>('analytics.hiring', async (req, res) => {
  res.json(await recruiters.hiringAnalytics(scope(req)));
});

export const getTrends = handle<AuthenticatedRequest, Response>('analytics.trends', async (req, res) => {
  const months = Math.min(Math.max(Number(param(req.query.months)) || 6, 1), 24);
  res.json({ trends: await recruiters.hiringTrends(months) });
});

export const getSkillsGap = handle<AuthenticatedRequest, Response>('analytics.skillsGap', async (_req, res) => {
  res.json({ skillsGap: await recruiters.skillsGap() });
});

export const getPipelineMetrics = handle<AuthenticatedRequest, Response>('analytics.pipeline', async (req, res) => {
  const analytics = await recruiters.hiringAnalytics(scope(req));
  res.json({
    avgDaysToHire: analytics.avgDaysToHire,
    conversionRate: analytics.conversionRate,
    activeRequisitions: analytics.activeJobs,
    pipeline: analytics.pipeline,
    pipelineTotal: analytics.pipelineTotal,
  });
});

export const getSkillGraph = handle<AuthenticatedRequest, Response>('analytics.skillGraph', async (_req, res) => {
  res.json({ pairs: await skillCooccurrence(25) });
});
