import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getTeamContributions = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.params.userId);
  res.json({ user: c || candidates[0], contributions: [
    { type: 'commits', count: 342, period: 'last 90 days' },
    { type: 'pull_requests', count: 28, merged: 24 },
    { type: 'reviews', count: 45 },
    { type: 'projects', count: 6 },
  ]});
};

export const getImpactScore = async (req: Request, res: Response) => {
  res.json({ userId: req.params.userId, impactScore: 87, breakdown: { code: 92, review: 78, mentorship: 84, leadership: 80 } });
};
