import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as service from '../services/candidate.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param } from '../utils/http.js';

const readable = (req: AuthenticatedRequest) => resolveCandidateId(req, req.query.id);
const writable = (req: AuthenticatedRequest) => resolveWritableCandidateId(req, req.query.id);
const roadmapId = (req: AuthenticatedRequest) => param(req.params.roadmapId);

export const getDashboard = handle<AuthenticatedRequest, Response>('candidate.dashboard', async (req, res) => {
  res.json(await service.dashboard(readable(req)));
});

export const getProfile = handle<AuthenticatedRequest, Response>('candidate.getProfile', async (req, res) => {
  res.json(await service.profile(readable(req)));
});

export const updateProfile = handle<AuthenticatedRequest, Response>('candidate.updateProfile', async (req, res) => {
  res.json(await service.updateProfile(writable(req), req.body, req.user!.id));
});

export const getRoadmap = handle<AuthenticatedRequest, Response>('candidate.getRoadmap', async (req, res) => {
  res.json({ items: await service.listRoadmap(readable(req)) });
});

export const createRoadmap = handle<AuthenticatedRequest, Response>('candidate.createRoadmap', async (req, res) => {
  res.status(201).json({ item: await service.createRoadmap(writable(req), req.body) });
});

export const updateRoadmap = handle<AuthenticatedRequest, Response>('candidate.updateRoadmap', async (req, res) => {
  res.json({ item: await service.updateRoadmap(writable(req), roadmapId(req), req.body) });
});

export const deleteRoadmap = handle<AuthenticatedRequest, Response>('candidate.deleteRoadmap', async (req, res) => {
  await service.deleteRoadmap(writable(req), roadmapId(req));
  res.status(204).end();
});

export const getResume = handle<AuthenticatedRequest, Response>('candidate.getResume', async (req, res) => {
  res.json({ resumes: await service.resumes(readable(req)), templates: ['modern', 'classic', 'minimal'] });
});

export const saveResume = handle<AuthenticatedRequest, Response>('candidate.saveResume', async (req, res) => {
  res.status(201).json({ resume: await service.saveResume(writable(req), req.body) });
});

export const generateResume = handle<AuthenticatedRequest, Response>('candidate.generateResume', async (req, res) => {
  res.json(await service.generateResumeDraft(readable(req), req.body?.targetRole));
});

export const getPortfolio = handle<AuthenticatedRequest, Response>('candidate.getPortfolio', async (req, res) => {
  res.json(await service.generatePortfolio(readable(req)));
});

export const getJobRecommendations = handle<AuthenticatedRequest, Response>('candidate.jobs', async (req, res) => {
  res.json(await service.jobs(readable(req), req.query));
});

export const applyToJob = handle<AuthenticatedRequest, Response>('candidate.applyToJob', async (req, res) => {
  const application = await service.setApplication(writable(req), param(req.params.id), req.body.status || 'APPLIED', req.body.notes);
  res.json({ application });
});

export const getSalaryPrediction = handle<AuthenticatedRequest, Response>('candidate.salary', async (req, res) => {
  res.json(await service.predictSalary(readable(req)));
});

export const getLearningRecommendations = handle<AuthenticatedRequest, Response>('candidate.learning', async (req, res) => {
  res.json(await service.recommendLearning(readable(req)));
});

export const getBadges = handle<AuthenticatedRequest, Response>('candidate.badges', async (req, res) => {
  res.json({ badges: await service.badges(readable(req)) });
});
