import { type Request, type Response } from 'express';
import { candidates } from '../data/demo.js';
import { analyzeRoleMatch, AiServiceError } from '../services/ai.service.js';

export const matchCandidate = async (req: Request, res: Response) => {
  const { role, skills = [] } = req.body as { role?: string; skills?: string[] };
  if (!role?.trim()) return res.status(400).json({ error: 'role is required' });
  try {
    const result = await analyzeRoleMatch({ role, requiredSkills: skills, candidates: candidates.map(({ id, name, title, skills: candidateSkills, githubDesc }) => ({ id, name, title, skills: candidateSkills, evidence: githubDesc })) });
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const matches = result.matches.map((match) => ({ ...byId.get(match.id), ...match })).filter((match) => match.id);
    res.json({ role, matches });
  } catch (error) { const value = error as AiServiceError; res.status(value.status || 500).json({ error: value.message || 'Matching assistant failed' }); }
};

export const getMatchScores = async (req: Request, res: Response) => res.status(400).json({ error: 'Submit a role to /match for an explainable AI score.' });
export const getRecommendations = async (_req: Request, res: Response) => res.status(400).json({ error: 'Submit a role to /match for AI recommendations.' });