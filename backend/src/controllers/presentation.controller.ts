import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { runPresentationAgent } from '../agents/presentation.agent.js';
import { extractDocument } from '../services/document.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, badRequest } from '../utils/http.js';
import { safeJsonParse } from '../utils/helpers.js';

export const analyzePresentation = handle<AuthenticatedRequest, Response>('presentation.analyze', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body?.candidateId);

  // Text can be pasted directly or extracted from an uploaded deck.
  let text = String(req.body.text || '');
  let slides = 0;
  if (req.body.fileBase64) {
    const extracted = await extractDocument(req.body.fileBase64, req.body.fileName);
    if (!extracted.text) {
      throw badRequest('No readable text could be extracted from that file. Paste the deck contents instead.');
    }
    text = extracted.text;
    slides = extracted.sections;
  }
  if (!text.trim()) throw badRequest('Provide either deck text or a file to analyse');

  const result = await runPresentationAgent({ text, slides, title: req.body.title });

  // Optionally keep the analysis as evidence so it counts toward the score.
  if (req.body.saveAsEvidence) {
    await prisma.evidence.create({
      data: {
        candidateId,
        source: 'presentation',
        title: req.body.title || 'Presentation',
        issuer: req.body.event || null,
        description: result.summary,
        score: result.score,
        status: 'SUBMITTED',
        submittedBy: req.user!.id,
        metadata: JSON.stringify({ slides, extractedText: text.slice(0, 20000), analysis: result.signals }),
      },
    });
  }

  res.json({
    scores: {
      overall: result.score,
      ...Object.fromEntries(result.components.map((item) => [item.key, Math.round((item.score / item.max) * 100)])),
    },
    confidence: result.confidence,
    engine: result.engine,
    feedback: result.summary,
    components: result.components,
    recommendations: (result.signals as { recommendations?: string[] }).recommendations || [],
    savedAsEvidence: Boolean(req.body.saveAsEvidence),
  });
});

export const getPresentationHistory = handle<AuthenticatedRequest, Response>('presentation.history', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.params.userId);
  const rows = await prisma.evidence.findMany({
    where: { candidateId, source: 'presentation' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({
    candidateId,
    presentations: rows.map((row) => ({
      id: row.id,
      title: row.title,
      event: row.issuer,
      score: row.score,
      status: row.status,
      date: row.issuedAt || row.createdAt,
      slides: safeJsonParse<{ slides?: number }>(row.metadata, {}).slides ?? null,
      summary: row.description,
    })),
  });
});
