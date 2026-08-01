import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('A valid email address is required');
const password = z.string().min(8, 'Password must be at least 8 characters');

export const schemas = {
  register: z.object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email,
    password,
    role: z.enum(['candidate', 'recruiter']).optional(),
    mobile: z.string().trim().max(40).optional(),
    education: z.string().trim().max(200).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    title: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    company: z.string().trim().max(160).optional(),
  }),
  login: z.object({ email, password: z.string().min(1, 'Password is required') }),
  refresh: z.object({ refreshToken: z.string().min(1, 'A refresh token is required') }),
  updateMe: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    mobile: z.string().trim().max(40).optional(),
    education: z.string().trim().max(200).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    password: password.optional(),
  }),
  job: z.object({
    title: z.string().trim().min(1, 'A job title is required').max(160),
    description: z.string().trim().max(8000).optional(),
    location: z.string().trim().max(120).optional(),
    skills: z.array(z.string().trim().min(1)).max(50).optional(),
    responsibilities: z.array(z.string().trim().min(1)).max(50).optional(),
    seniority: z.string().trim().max(40).optional(),
    employmentType: z.string().trim().max(40).optional(),
    remote: z.boolean().optional(),
    salaryMin: z.coerce.number().int().min(0).optional(),
    salaryMax: z.coerce.number().int().min(0).optional(),
    currency: z.string().trim().length(3).optional(),
    minTalentScore: z.coerce.number().int().min(0).max(100).optional(),
    applyUrl: z.string().url().optional(),
    closesAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  matchRequest: z.object({
    role: z.string().trim().max(160).optional(),
    jobId: z.string().trim().optional(),
    skills: z.array(z.string().trim().min(1)).max(50).optional(),
    location: z.string().trim().max(120).optional(),
    minTalentScore: z.coerce.number().min(0).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  copilotSearch: z.object({
    query: z.string().trim().min(1, 'Describe who you are looking for').max(500),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  interviewStart: z.object({
    type: z.enum(['technical', 'hr', 'behavioral', 'mixed']).optional(),
    jobId: z.string().trim().optional(),
    questionCount: z.coerce.number().int().min(1).max(15).optional(),
  }),
  interviewAnswer: z.object({
    questionId: z.string().trim().min(1, 'A question id is required'),
    answer: z.string().trim().min(1, 'An answer is required').max(20000),
  }),
  pipelineUpdate: z.object({
    stage: z.enum(['DISCOVERED', 'SCREENED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'ON_HOLD']),
    jobId: z.string().trim().optional(),
    note: z.string().trim().max(2000).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
  analyzePresentation: z.object({
    candidateId: z.string().trim().optional(),
    title: z.string().trim().max(200).optional(),
    event: z.string().trim().max(200).optional(),
    text: z.string().trim().max(200000).optional(),
    fileBase64: z.string().max(20_000_000).optional(),
    fileName: z.string().trim().max(300).optional(),
    saveAsEvidence: z.boolean().optional(),
  }),
  analyzeResume: z.object({
    candidateId: z.string().trim().optional(),
    text: z.string().trim().max(200000).optional(),
    fileBase64: z.string().max(20_000_000).optional(),
    fileName: z.string().trim().max(300).optional(),
    saveAsEvidence: z.boolean().optional(),
  }),
  reportFraud: z.object({
    candidateId: z.string().trim().min(1, 'A candidate id is required'),
    type: z.string().trim().min(1, 'A flag type is required').max(80),
    detail: z.string().trim().max(2000).optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }),
} as const;

export type SchemaName = keyof typeof schemas;

/** Validates and normalises req.body against a named schema. */
export const validate = (name: SchemaName) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[name];
    if (!schema) {
      next();
      return;
    }
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(422).json({
        error: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid request body',
        issues: result.error.issues.map((item) => ({ path: item.path.join('.'), message: item.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
