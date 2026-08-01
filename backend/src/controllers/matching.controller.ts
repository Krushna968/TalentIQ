import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const matchCandidate = async (req: Request, res: Response) => {
  const { role, skills: requiredSkills } = req.body;
  const scored = candidates.map(c => {
    const match = (requiredSkills || []).filter((s: string) => c.skills.includes(s)).length;
    return { ...c, matchScore: Math.min(100, Math.round((match / (requiredSkills?.length || 1)) * 80 + 20 + Math.random() * 10)) };
  }).sort((a, b) => b.matchScore - a.matchScore);
  res.json({ matches: scored, role });
};

export const getMatchScores = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.params.candidateId);
  res.json({ candidate: c, matchScores: { technical: 88, experience: 82, culture: 76, overall: 84 } });
};

export const getRecommendations = async (_req: Request, res: Response) => {
  res.json({ recommendations: candidates.slice(0, 3).map(c => ({ ...c, reason: `Strong match for your requirements` })) });
};
