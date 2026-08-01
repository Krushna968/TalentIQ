import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const searchCandidates = async (req: Request, res: Response) => {
  const { q, minScore, specialism } = req.query;
  let results = [...candidates];
  if (q) results = results.filter(c => c.name.toLowerCase().includes((q as string).toLowerCase()) || c.skills.some(s => s.toLowerCase().includes((q as string).toLowerCase())));
  if (minScore) results = results.filter(c => c.talentScore >= Number(minScore));
  if (specialism) results = results.filter(c => c.skills.some(s => s.toLowerCase().includes((specialism as string).toLowerCase())));
  res.json({ candidates: results, total: results.length });
};

export const getPipeline = async (_req: Request, res: Response) => {
  res.json({ stages: [
    { name: 'Discovered', count: 12, candidates: candidates.slice(0, 2) },
    { name: 'Screened', count: 8, candidates: candidates.slice(2, 4) },
    { name: 'Interviewing', count: 3, candidates: candidates.slice(4) },
    { name: 'Offered', count: 1, candidates: [] },
    { name: 'Hired', count: 0, candidates: [] },
  ]});
};

export const updatePipelineStatus = async (req: Request, res: Response) => {
  res.json({ candidateId: req.params.candidateId, status: req.body.status, updatedAt: new Date() });
};

export const compareCandidates = async (req: Request, res: Response) => {
  const ids = req.body.ids || [];
  const selected = candidates.filter(c => ids.includes(c.id));
  res.json({ candidates: selected.length ? selected : candidates.slice(0, 3), comparison: { columns: ['talentScore', 'githubScore', 'hackathonScore', 'certScore'] } });
};
