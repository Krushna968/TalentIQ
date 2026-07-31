import { Request, Response } from 'express';
import * as evidenceService from '../services/evidence.service.js';

export const list = async (req: Request, res: Response) => {
  try { res.json({ evidence: await evidenceService.getCandidateEvidence(req.params.candidateId as string) }); }
  catch { res.status(500).json({ error: 'Unable to retrieve evidence' }); }
};

export const submit = async (req: Request, res: Response) => {
  try { res.status(201).json({ evidence: await evidenceService.submitEvidence(req.params.candidateId as string, req.body) }); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to submit evidence' }); }
};

export const review = async (req: Request, res: Response) => {
  try {
    const evidence = await evidenceService.reviewEvidence(req.params.evidenceId as string, req.body.decision, req.body.score);
    res.json({ evidence });
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to review evidence' }); }
};
