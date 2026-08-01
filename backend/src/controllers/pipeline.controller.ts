import { asyncHandler } from '../lib/http.js';
import * as pipeline from '../services/pipeline.service.js';

// Job-scoped: board + adding candidates (mounted under /api/jobs/:jobId/pipeline).
export const getBoard = asyncHandler(async (req, res) => {
  res.json(await pipeline.getBoard(req, req.params.jobId as string));
});

export const addCandidates = asyncHandler(async (req, res) => {
  res.status(201).json(await pipeline.addCandidates(req, req.params.jobId as string, req.body?.candidateIds));
});

// Entry-scoped actions (mounted under /api/pipeline/entries/:entryId/...).
export const moveStage = asyncHandler(async (req, res) => {
  res.json({ entry: await pipeline.moveStage(req, req.params.entryId as string, req.body?.toStageId, req.body?.expectedUpdatedAt) });
});

export const recordDecision = asyncHandler(async (req, res) => {
  res.json({ entry: await pipeline.recordDecision(req, req.params.entryId as string, req.body?.decision, req.body?.reason) });
});

export const reopen = asyncHandler(async (req, res) => {
  res.json({ entry: await pipeline.reopenEntry(req, req.params.entryId as string, req.body?.toStageId) });
});

export const assignOwner = asyncHandler(async (req, res) => {
  res.json({ entry: await pipeline.assignOwner(req, req.params.entryId as string, req.body?.assignedToUserId ?? null) });
});

export const setShortlist = asyncHandler(async (req, res) => {
  res.json({ entry: await pipeline.setShortlist(req, req.params.entryId as string, req.body?.shortlisted) });
});

export const addNote = asyncHandler(async (req, res) => {
  res.status(201).json({ note: await pipeline.addNote(req, req.params.entryId as string, req.body?.body) });
});

export const getTimeline = asyncHandler(async (req, res) => {
  res.json({ events: await pipeline.getTimeline(req, req.params.entryId as string) });
});

export const bulkAction = asyncHandler(async (req, res) => {
  res.json(await pipeline.bulkAction(req, req.body));
});
