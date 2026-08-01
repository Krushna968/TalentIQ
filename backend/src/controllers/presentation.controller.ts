import { type Request, type Response } from 'express';
import { analyzePresentationWithAi, AiServiceError } from '../services/ai.service.js';

export const analyzePresentation = async (req: Request, res: Response) => {
  const { title, content, audience } = req.body as { title?: string; content?: string; audience?: string };
  if (!content?.trim()) return res.status(400).json({ error: 'Presentation content is required' });
  try { res.json(await analyzePresentationWithAi({ title, content, audience })); }
  catch (error) { const value = error as AiServiceError; res.status(value.status || 500).json({ error: value.message || 'Presentation analysis failed' }); }
};

export const getPresentationHistory = async (req: Request, res: Response) => res.json({ userId: req.params.userId, presentations: [] });