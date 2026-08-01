import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as recruiters from '../services/recruiter.service.js';
import * as copilot from '../services/copilot.service.js';
import { matchCandidates } from '../services/matching.service.js';
import { handle, param, forbidden } from '../utils/http.js';

/** Recruiter-scoped endpoints need the caller's recruiter profile id. */
const recruiterId = (req: AuthenticatedRequest) => {
  if (req.user!.role === 'admin' && param(req.query.recruiterId)) return param(req.query.recruiterId);
  if (!req.user!.recruiterId) throw forbidden('This account does not have a recruiter profile');
  return req.user!.recruiterId;
};

export const searchCandidates = handle<AuthenticatedRequest, Response>('recruiter.search', async (req, res) => {
  const query = param(req.query.q);
  const limit = Number(param(req.query.limit)) || 20;

  // A free-text query goes through the copilot; structured filters go direct.
  if (query) {
    res.json(await copilot.search(query, limit));
    return;
  }

  const result = await matchCandidates(
    {
      skills: param(req.query.skills) ? param(req.query.skills).split(',') : [],
      location: param(req.query.location) || undefined,
      seniority: param(req.query.seniority) || undefined,
      minTalentScore: param(req.query.minScore) ? Number(param(req.query.minScore)) : undefined,
    },
    limit,
  );
  res.json({ ...result, matches: result.matches, total: result.matches.length });
});

export const getPipeline = handle<AuthenticatedRequest, Response>('recruiter.pipeline', async (req, res) => {
  res.json(await recruiters.getPipeline(recruiterId(req), param(req.query.jobId) || undefined));
});

export const updatePipelineStatus = handle<AuthenticatedRequest, Response>('recruiter.pipelineUpdate', async (req, res) => {
  const entry = await recruiters.setPipelineStage({
    recruiterId: recruiterId(req),
    candidateId: param(req.params.candidateId),
    jobId: req.body.jobId,
    stage: req.body.stage,
    note: req.body.note,
    rating: req.body.rating,
  });
  res.json({ entry });
});

export const removeFromPipeline = handle<AuthenticatedRequest, Response>('recruiter.pipelineRemove', async (req, res) => {
  await recruiters.removeFromPipeline(recruiterId(req), param(req.params.entryId));
  res.status(204).end();
});

export const compareCandidates = handle<AuthenticatedRequest, Response>('recruiter.compare', async (req, res) => {
  res.json(await recruiters.compareCandidates(req.body.ids || [], req.body.jobId));
});

export const getCompany = handle<AuthenticatedRequest, Response>('recruiter.getCompany', async (req, res) => {
  res.json(await recruiters.getCompany(recruiterId(req)));
});

export const saveCompany = handle<AuthenticatedRequest, Response>('recruiter.saveCompany', async (req, res) => {
  res.json({ company: await recruiters.upsertCompany(recruiterId(req), req.body) });
});

export const listJobs = handle<AuthenticatedRequest, Response>('recruiter.listJobs', async (req, res) => {
  const mine = param(req.query.mine) !== 'false';
  res.json({ jobs: await recruiters.listJobs(mine ? recruiterId(req) : undefined) });
});

export const getJob = handle<AuthenticatedRequest, Response>('recruiter.getJob', async (req, res) => {
  res.json({ job: await recruiters.getJob(param(req.params.jobId)) });
});

export const createJob = handle<AuthenticatedRequest, Response>('recruiter.createJob', async (req, res) => {
  res.status(201).json({ job: await recruiters.createJob(recruiterId(req), req.body) });
});

export const updateJob = handle<AuthenticatedRequest, Response>('recruiter.updateJob', async (req, res) => {
  res.json({ job: await recruiters.updateJob(recruiterId(req), param(req.params.jobId), req.body) });
});

export const closeJob = handle<AuthenticatedRequest, Response>('recruiter.closeJob', async (req, res) => {
  res.json({ job: await recruiters.deleteJob(recruiterId(req), param(req.params.jobId)) });
});
