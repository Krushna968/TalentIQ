import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { runHackathonAgent } from '../agents/hackathon.agent.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param, badRequest } from '../utils/http.js';
import { safeJsonParse } from '../utils/helpers.js';

export const getHackathonProfile = handle<AuthenticatedRequest, Response>('hackathon.profile', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const [candidate, result] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId }, select: { id: true, name: true, title: true, avatar: true } }),
    runHackathonAgent(candidateId),
  ]);

  res.json({
    candidate,
    score: result.score,
    confidence: result.confidence,
    summary: result.summary,
    components: result.components,
    hackathons: (result.signals as { events?: unknown[] }).events || [],
  });
});

export const verifyHackathonParticipation = handle<AuthenticatedRequest, Response>('hackathon.verify', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body?.candidateId);
  const event = String(req.body.event || '').trim();
  if (!event) throw badRequest('An event name is required');

  const evidence = await prisma.evidence.create({
    data: {
      candidateId,
      source: 'hackathon',
      title: String(req.body.title || `${event}${req.body.rank ? ` — ${req.body.rank}` : ''}`),
      issuer: event,
      referenceUrl: req.body.referenceUrl || null,
      description: req.body.description || null,
      issuedAt: req.body.date ? new Date(String(req.body.date)) : null,
      status: 'SUBMITTED',
      submittedBy: req.user!.id,
      metadata: JSON.stringify({
        rank: req.body.rank || null,
        teamSize: req.body.teamSize || null,
        role: req.body.role || null,
        project: req.body.project || null,
      }),
    },
  });

  // Score immediately so the candidate sees the effect of what they submitted.
  const result = await runHackathonAgent(candidateId);
  res.status(201).json({ evidence, score: result.score, summary: result.summary, status: 'submitted_for_review' });
});

export const getAchievements = handle<AuthenticatedRequest, Response>('hackathon.achievements', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const rows = await prisma.evidence.findMany({ where: { candidateId, source: 'hackathon' } });

  const rankOf = (row: (typeof rows)[number]) =>
    String(safeJsonParse<{ rank?: string }>(row.metadata, {}).rank || row.title).toLowerCase();

  const counts = {
    wins: rows.filter((row) => /\b(winner|1st|first|champion|gold)\b/.test(rankOf(row))).length,
    runnerUp: rows.filter((row) => /\b(runner|2nd|second|silver)\b/.test(rankOf(row))).length,
    finalist: rows.filter((row) => /\b(finalist|top\s*\d+|3rd|third|bronze)\b/.test(rankOf(row))).length,
    participated: rows.length,
    verified: rows.filter((row) => String(row.status) === 'VERIFIED').length,
  };

  res.json({
    candidateId,
    achievements: [
      { title: 'Hackathon Winner', icon: 'trophy', count: counts.wins },
      { title: 'Runner-up', icon: 'medal', count: counts.runnerUp },
      { title: 'Finalist', icon: 'star', count: counts.finalist },
      { title: 'Events entered', icon: 'flag', count: counts.participated },
      { title: 'Verified records', icon: 'verified', count: counts.verified },
    ],
  });
});

/** Hackathon-to-hiring pipeline: standout hackathon performers across the pool. */
export const getTopPerformers = handle<AuthenticatedRequest, Response>('hackathon.leaderboard', async (req, res) => {
  const limit = Math.min(Number(param(req.query.limit)) || 20, 100);
  const rows = await prisma.evidence.findMany({
    where: { source: 'hackathon', status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'] } },
    include: {
      candidate: { select: { id: true, name: true, title: true, avatar: true, talentScore: true, hackathonScore: true } },
    },
    take: 1000,
  });

  const byCandidate = new Map<string, { candidate: (typeof rows)[number]['candidate']; events: number; wins: number; verified: number }>();
  for (const row of rows) {
    const entry = byCandidate.get(row.candidateId) || { candidate: row.candidate, events: 0, wins: 0, verified: 0 };
    entry.events += 1;
    if (/\b(winner|1st|first|runner[- ]?up|2nd|champion)\b/i.test(row.title)) entry.wins += 1;
    if (String(row.status) === 'VERIFIED') entry.verified += 1;
    byCandidate.set(row.candidateId, entry);
  }

  const performers = [...byCandidate.values()]
    .sort((a, b) => b.wins - a.wins || (b.candidate.hackathonScore ?? 0) - (a.candidate.hackathonScore ?? 0) || b.events - a.events)
    .slice(0, limit);

  res.json({ performers, totalEvents: rows.length });
});
