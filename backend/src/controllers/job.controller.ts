import { asyncHandler } from '../lib/http.js';
import * as jobs from '../services/job.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ jobs: await jobs.listJobs(req, { status: req.query.status as string | undefined }) });
});

export const get = asyncHandler(async (req, res) => {
  res.json({ job: await jobs.getJob(req, req.params.jobId as string) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ job: await jobs.createJob(req, req.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ job: await jobs.updateJob(req, req.params.jobId as string, req.body) });
});

// Open/close/reopen a requisition via { status }.
export const setStatus = asyncHandler(async (req, res) => {
  res.json({ job: await jobs.setJobStatus(req, req.params.jobId as string, req.body?.status) });
});

export const listCollaborators = asyncHandler(async (req, res) => {
  res.json({ collaborators: await jobs.listCollaborators(req, req.params.jobId as string) });
});

export const addCollaborator = asyncHandler(async (req, res) => {
  res.status(201).json({ collaborator: await jobs.addCollaborator(req, req.params.jobId as string, req.body) });
});
