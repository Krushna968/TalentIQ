import { Request, Response } from 'express';
import { passportService } from '../services/passport.service.js';

export const getPassport = (_req: Request, res: Response) => {
  res.json({ success: true, data: passportService.getPassport() });
};

export const queueTargetedInterview = (req: Request, res: Response) => {
  res.status(202).json({ success: true, data: { candidateId: req.params.candidateId, status: 'queued', queuedAt: new Date().toISOString() } });
};
