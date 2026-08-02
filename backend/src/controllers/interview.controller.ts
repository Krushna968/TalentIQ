import { type Request, type Response } from 'express';
import { createInterviewQuestion, evaluateInterviewAnswer, AiServiceError } from '../services/ai.service.js';

const fail = (res: Response, error: unknown) => {
  const value = error as AiServiceError;
  res.status(value.status || 500).json({ error: value.message || 'Interview assistant failed' });
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const skills = typeof req.query.skills === 'string' ? req.query.skills.split(',').map((item) => item.trim()).filter(Boolean) : [];
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
    let previousAnswers: string[] = [];
    if (typeof req.query.previousAnswers === 'string') {
      try { previousAnswers = JSON.parse(req.query.previousAnswers); } catch { /* ignore */ }
    } else if (Array.isArray(req.query.previousAnswers)) {
      previousAnswers = req.query.previousAnswers as string[];
    }
    const question = await createInterviewQuestion({ role: typeof req.query.role === 'string' ? req.query.role : 'Software Engineer', skills, sessionId, previousAnswers });
    res.json({ questions: [question] });
  } catch (error) { fail(res, error); }
};

export const submitAnswer = async (req: Request, res: Response) => {
  const { question, answer, role, sessionId, previousAnswers } = req.body as { question?: string; answer?: string; role?: string; sessionId?: string; previousAnswers?: string[] };
  if (!question?.trim() || !answer?.trim()) return res.status(400).json({ error: 'question and answer are required' });
  try { res.json(await evaluateInterviewAnswer({ question, answer, role, sessionId, previousAnswers })); }
  catch (error) { fail(res, error); }
};

export const getSessions = async (_req: Request, res: Response) => res.json({ sessions: [] });
export const getSession = async (req: Request, res: Response) => res.json({ id: req.params.id, status: 'not_persisted' });
export const getInterviewReport = async (req: Request, res: Response) => res.json({ sessionId: req.params.sessionId, status: 'generated_client_side' });