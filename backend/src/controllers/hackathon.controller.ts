import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getHackathonProfile = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.params.userId);
  res.json({ user: c || candidates[0], hackathons: [
    { event: 'HackIndia 2023', rank: 'Runner-up', teamSize: 4, project: 'AI-powered code reviewer' },
    { event: 'AWS Build-On 2022', rank: 'Winner', teamSize: 3, project: 'Serverless data pipeline' },
  ]});
};

export const verifyHackathonParticipation = async (req: Request, res: Response) => {
  res.json({ status: 'verified', score: 86, details: { event: req.body.event, rank: req.body.rank, verifiedAt: new Date() } });
};

export const getAchievements = async (req: Request, res: Response) => {
  res.json({ userId: req.params.userId, achievements: [
    { title: 'Hackathon Winner', icon: 'trophy', count: 2 },
    { title: 'Finalist', icon: 'medal', count: 4 },
    { title: 'Best Innovation', icon: 'star', count: 1 },
  ]});
};
