import { type Request, type Response } from 'express';
import * as ai from '../services/ai.service.js';
import { scoreResume } from '../services/resume-score.service.js';
import { extractResumeText } from '../services/resume-upload.service.js';

const handle = async (res: Response, work: () => Promise<unknown>) => {
  try { res.json(await work()); }
  catch (error) { const aiError = error as ai.AiServiceError; res.status(aiError.status || 500).json({ error: aiError.message || 'AI request failed' }); }
};

export const status = async (_req: Request, res: Response) => res.json({ configured: ai.isAiConfigured(), provider: 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' });
export const careerRoadmap = async (req: Request, res: Response) => handle(res, () => ai.createCareerRoadmap(req.body));
export const resumeDraft = async (req: Request, res: Response) => handle(res, () => ai.createResumeDraft(req.body));
export const resumeScore = async (req: Request, res: Response) => handle(res, async () => scoreResume(req.body));
export const resumeUploadScore = async (req: Request, res: Response) => handle(res, async () => {
  if (!req.file) throw Object.assign(new Error('Choose a resume file before scoring.'), { status: 400 });
  const uploaded = await extractResumeText(req.file);
  const scorecard = scoreResume({ resumeText: uploaded.text, targetRole: req.body.targetRole });
  return { ...scorecard, uploadedFile: { name: uploaded.name, format: uploaded.format, extractedWordCount: uploaded.text.split(/\s+/).filter(Boolean).length } };
});
export const trustReview = async (req: Request, res: Response) => handle(res, () => ai.analyzeTrust(req.body));