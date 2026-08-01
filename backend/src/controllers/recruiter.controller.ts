import { asyncHandler } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';

// NOTE: Full production talent search (transparent filters, sorting, pagination,
// shareable query URLs) is Owner 3 work item #2. This is a minimal DB-backed
// placeholder that removes the old in-memory demo dependency; the pipeline
// endpoints that used to live here now live under /api/jobs and /api/pipeline.
export const searchCandidates = asyncHandler(async (req, res) => {
  const q = ((req.query.q as string) || '').trim();
  const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
  const candidates = await prisma.candidate.findMany({
    where: {
      ...(minScore ? { talentScore: { gte: minScore } } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { title: { contains: q } }] } : {}),
    },
    orderBy: { talentScore: 'desc' },
    take: 50,
  });
  res.json({ candidates, total: candidates.length });
});

// NOTE: Full compare workspace + dossier review is Owner 3 work item #4.
export const compareCandidates = asyncHandler(async (req, res) => {
  const ids: string[] = req.body?.ids || [];
  const candidates = await prisma.candidate.findMany({ where: { id: { in: ids } } });
  res.json({ candidates, comparison: { columns: ['talentScore', 'githubScore', 'hackathonScore', 'certScore'] } });
});
