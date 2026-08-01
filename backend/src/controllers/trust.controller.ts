import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getFraudFlags = async (_req: Request, res: Response) => {
  res.json({ flags: [
    { id: 'f1', candidateId: 'sarah-jenkins', type: 'certification_expiry', severity: 'low', status: 'open' },
    { id: 'f2', candidateId: 'aditi-rao', type: 'github_ownership', severity: 'medium', status: 'investigating' },
  ]});
};

export const reportFraud = async (req: Request, res: Response) => {
  res.json({ id: 'f-new', status: 'reported', ...req.body, createdAt: new Date() });
};

export const resolveFlag = async (req: Request, res: Response) => {
  res.json({ id: req.params.id, status: 'resolved', resolvedAt: new Date() });
};

export const getTrustScore = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.params.userId);
  res.json({ userId: req.params.userId, trustScore: c ? 92 : 85, signals: { verifiedClaims: 8, pendingVerification: 2, flags: 0 }, risk: 'low' });
};
