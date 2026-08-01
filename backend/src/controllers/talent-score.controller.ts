import { Request, Response } from 'express';
import { calculateAndStoreTalentScore } from '../services/talent-score.service.js';

export const getTalentScore = async (req: Request, res: Response) => {
  try {
    const score = await calculateAndStoreTalentScore(req.params.candidateId as string);
    if (!score) {
      res.status(404).json({ error: 'GitHub evidence has not been connected yet.' });
      return;
    }
    res.json({ source: 'verified-evidence', ...score });
  } catch (error) {
    console.error('Error calculating talent score', error);
    res.status(500).json({ error: 'Unable to calculate talent score' });
  }
};
