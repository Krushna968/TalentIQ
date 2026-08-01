import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as service from '../services/evidence.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param } from '../utils/http.js';

const readable = (req: AuthenticatedRequest) => resolveCandidateId(req, req.params.candidateId);
const writable = (req: AuthenticatedRequest) => resolveWritableCandidateId(req, req.params.candidateId);
const evidenceId = (req: AuthenticatedRequest) => param(req.params.evidenceId);
const attachmentId = (req: AuthenticatedRequest) => param(req.params.attachmentId);

export const list = handle<AuthenticatedRequest, Response>('evidence.list', async (req, res) => {
  res.json(await service.listEvidence(readable(req), req.query as never));
});

export const get = handle<AuthenticatedRequest, Response>('evidence.get', async (req, res) => {
  res.json({ evidence: await service.getEvidence(readable(req), evidenceId(req)) });
});

export const create = handle<AuthenticatedRequest, Response>('evidence.create', async (req, res) => {
  res.status(201).json({ evidence: await service.createEvidence(writable(req), req.body, req.user!.id) });
});

export const update = handle<AuthenticatedRequest, Response>('evidence.update', async (req, res) => {
  res.json({ evidence: await service.updateEvidence(writable(req), evidenceId(req), req.body, req.user!.id) });
});

export const submit = handle<AuthenticatedRequest, Response>('evidence.submit', async (req, res) => {
  res.json({ evidence: await service.submitEvidence(writable(req), evidenceId(req), req.user!.id) });
});

export const appeal = handle<AuthenticatedRequest, Response>('evidence.appeal', async (req, res) => {
  res.json({ evidence: await service.appealEvidence(writable(req), evidenceId(req), req.body.reason, req.user!.id) });
});

export const remove = handle<AuthenticatedRequest, Response>('evidence.remove', async (req, res) => {
  await service.deleteEvidence(writable(req), evidenceId(req), req.user!.id);
  res.status(204).end();
});

export const queue = handle<AuthenticatedRequest, Response>('evidence.queue', async (req, res) => {
  res.json(await service.reviewQueue(req.query as never));
});

export const startReview = handle<AuthenticatedRequest, Response>('evidence.startReview', async (req, res) => {
  res.json({ evidence: await service.beginReview(evidenceId(req), req.user!.id, req.user!.email) });
});

export const review = handle<AuthenticatedRequest, Response>('evidence.review', async (req, res) => {
  const { decision, reason, score } = req.body;
  res.json({ evidence: await service.reviewEvidence(evidenceId(req), req.user!.id, decision, reason, score) });
});

export const attachmentIntent = handle<AuthenticatedRequest, Response>('evidence.attachmentIntent', async (req, res) => {
  const intent = await service.createAttachmentIntent(writable(req), evidenceId(req) || undefined, req.body, req.user!.id);
  res.status(201).json(intent);
});

export const attachmentComplete = handle<AuthenticatedRequest, Response>('evidence.attachmentComplete', async (req, res) => {
  const attachment = await service.completeAttachment(writable(req), attachmentId(req), req.body.scanStatus, req.user!.id);
  res.json({ attachment });
});

export const attachmentDownload = handle<AuthenticatedRequest, Response>('evidence.attachmentDownload', async (req, res) => {
  res.json(await service.getDownload(readable(req), attachmentId(req)));
});
