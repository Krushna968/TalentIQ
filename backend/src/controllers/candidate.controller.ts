import { Request, Response } from 'express';
import { candidates } from '../data/demo.js';

export const getDashboard = async (_req: Request, res: Response) => {
  res.json({
    candidates,
    total: candidates.length,
    stats: {
      avgScore: Math.round(candidates.reduce((a, c) => a + c.talentScore, 0) / candidates.length)
    }
  });
};

export const getAllCandidates = async (_req: Request, res: Response) => {
  res.json(candidates);
};

export const getCandidateById = async (req: Request, res: Response) => {
  const c = candidates.find(item => item.id === req.params.id);
  if (!c) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }
  res.json(c);
};

export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const authUser = (req as unknown as { user?: { id: string; role: string } }).user;
  const candidate = candidates.find(item => item.id === id);
  if (!candidate) {
    if (authUser && (authUser.id === id || authUser.role === 'ADMIN')) {
      res.json({ message: 'Status updated successfully', candidate: { id, status } });
      return;
    }
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }
  candidate.status = status;
  res.json({ message: 'Status updated successfully', candidate });
};

export const getProfile = async (req: Request, res: Response) => {
  const c = candidates.find(c => c.id === req.query.id);
  res.json(c || candidates[0]);
};

export const updateProfile = async (req: Request, res: Response) => {
  res.json({ ...candidates[0], ...req.body });
};

export const getRoadmap = async (_req: Request, res: Response) => {
  res.json({
    steps: [
      { name: 'Core Skills', detail: 'Master primary stack', done: true },
      { name: 'Advanced Topics', detail: 'Deep dive into system design', done: true },
      { name: 'Specialization', detail: 'Choose a focus area', done: false },
      { name: 'Leadership', detail: 'Lead projects and mentor', done: false },
    ]
  });
};

export const updateRoadmap = async (req: Request, res: Response) => {
  res.json({ message: 'Roadmap updated', ...req.body });
};

export const getResume = async (_req: Request, res: Response) => {
  res.json({ candidate: candidates[0], templates: ['modern', 'classic', 'minimal'] });
};

export const generateResume = async (req: Request, res: Response) => {
  res.json({ url: '/resumes/demo-resume.pdf', format: req.body.format || 'pdf' });
};

export const getJobRecommendations = async (_req: Request, res: Response) => {
  res.json({
    jobs: [
      { id: 'j1', title: 'Senior Full-Stack Engineer', company: 'TechCorp', matchScore: 94 },
      { id: 'j2', title: 'Frontend Architect', company: 'StartupXYZ', matchScore: 88 },
      { id: 'j3', title: 'Node.js Backend Lead', company: 'ScaleUp Inc', matchScore: 82 },
    ]
  });
};

export const applyToJob = async (req: Request, res: Response) => {
  res.json({ message: `Applied to job ${req.params.id}` });
};
