import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as interviews from '../services/interview.service.js';
import { resolveCandidateId, resolveWritableCandidateId } from '../middleware/auth.middleware.js';
import { handle, param } from '../utils/http.js';

const sessionId = (req: AuthenticatedRequest) => param(req.params.id || req.params.sessionId);

export const getQuestions = handle<AuthenticatedRequest, Response>('interview.questions', async (req, res) => {
  const candidateId = resolveCandidateId(req, req.query.candidateId);
  const type = (param(req.query.type) || 'technical').toUpperCase() as interviews.InterviewType;
  const count = Number(param(req.query.count)) || 5;
  res.json(await interviews.previewQuestions(candidateId, type, count));
});

export const startSession = handle<AuthenticatedRequest, Response>('interview.start', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body.candidateId);
  const session = await interviews.startSession({
    candidateId,
    type: req.body.type,
    jobId: req.body.jobId,
    questionCount: req.body.questionCount,
  });
  res.status(201).json({ session });
});

export const submitAnswer = handle<AuthenticatedRequest, Response>('interview.submit', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body.candidateId);
  const result = await interviews.submitAnswer({
    sessionId: param(req.params.id) || req.body.sessionId,
    questionId: req.body.questionId,
    answer: req.body.answer,
    candidateId,
  });
  res.json(result);
});

export const completeSession = handle<AuthenticatedRequest, Response>('interview.complete', async (req, res) => {
  const candidateId = resolveWritableCandidateId(req, req.body?.candidateId);
  res.json({ session: await interviews.completeSession(sessionId(req), candidateId) });
});

export const getSessions = handle<AuthenticatedRequest, Response>('interview.sessions', async (req, res) => {
  res.json({ sessions: await interviews.listSessions(resolveCandidateId(req, req.query.candidateId)) });
});

export const getSession = handle<AuthenticatedRequest, Response>('interview.session', async (req, res) => {
  // Recruiters and reviewers may read any session; candidates only their own.
  const scope = req.user!.role === 'candidate' ? resolveCandidateId(req) : undefined;
  res.json({ session: await interviews.getSession(sessionId(req), scope) });
});

export const getInterviewReport = handle<AuthenticatedRequest, Response>('interview.report', async (req, res) => {
  const scope = req.user!.role === 'candidate' ? resolveCandidateId(req) : undefined;
  res.json(await interviews.getReport(sessionId(req), scope));
});
