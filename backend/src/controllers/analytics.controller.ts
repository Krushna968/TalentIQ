import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getHiringAnalytics = async (_req: Request, res: Response) => {
  res.json({
    totalCandidates: candidates.length,
    avgTalentScore: Math.round(candidates.reduce((a, c) => a + c.talentScore, 0) / candidates.length),
    topSkill: 'Python',
    pipelineBreakdown: { discovered: 12, screened: 8, interviewing: 3, offered: 1, hired: 0 },
  });
};

export const getTrends = async (_req: Request, res: Response) => {
  res.json({ trends: [
    { month: 'Jan', candidates: 45, hires: 3 },
    { month: 'Feb', candidates: 52, hires: 5 },
    { month: 'Mar', candidates: 48, hires: 4 },
  ]});
};

export const getSkillsGap = async (_req: Request, res: Response) => {
  res.json({ skillsGap: [
    { skill: 'Kubernetes', demand: 92, supply: 45 },
    { skill: 'Rust', demand: 78, supply: 22 },
    { skill: 'AI/ML', demand: 95, supply: 60 },
  ]});
};

export const getPipelineMetrics = async (_req: Request, res: Response) => {
  res.json({ avgDaysToHire: 18, conversionRate: 0.23, activeRequisitions: 7 });
};
