import { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from './error.middleware.js';
import { getUser, assertSameOrg } from '../lib/tenant.js';
import { prisma } from '../lib/prisma.js';

export type JobPermission = 'viewer' | 'editor' | 'owner';
const ROLE_RANK: Record<JobPermission, number> = { viewer: 1, editor: 2, owner: 3 };

// Wraps an async handler so thrown AppErrors reach the shared error handler
// regardless of Express version quirks.
const wrap =
  (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req as AuthenticatedRequest, res, next).catch(next);
  };

// Verifies the caller actually belongs to the tenant they claim (user.orgId),
// so the header-driven org can't be self-asserted. Caches the org role.
export const requireOrg = wrap(async (req, _res, next) => {
  const user = getUser(req);
  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId: user.orgId, userId: user.id } },
  });
  if (!membership) throw new AppError(403, 'Not a member of this organization');
  req.orgRole = membership.role as AuthenticatedRequest['orgRole'];
  next();
});

// Resolves the caller's effective role on a job. Org owners/admins get full
// access tenant-wide; otherwise access comes from an explicit collaborator grant
// or, for org-visible jobs, a baseline viewer role. Throws 403 on tenant
// mismatch or no access. Reused by both middleware and the pipeline service.
export async function effectiveJobRole(
  req: AuthenticatedRequest,
  jobId: string | undefined,
): Promise<{ job: { id: string; orgId: string; visibility: string; status: string }; role: JobPermission }> {
  const user = getUser(req);
  if (!jobId) throw new AppError(400, 'Missing job id');

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  assertSameOrg(job, req); // 403 if missing or in another org (no existence leak)

  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId: user.orgId, userId: user.id } },
  });
  if (!membership) throw new AppError(403, 'Forbidden');
  if (membership.role === 'owner' || membership.role === 'admin') {
    return { job: job!, role: 'owner' };
  }

  const collab = await prisma.jobCollaborator.findUnique({
    where: { jobId_userId: { jobId, userId: user.id } },
  });
  let role = collab?.role as JobPermission | undefined;
  if (!role && job!.visibility === 'org') role = 'viewer';
  if (!role) throw new AppError(403, 'Forbidden');

  return { job: job!, role };
}

// Asserts the caller has at least `level` on the job, else throws 403.
export async function assertJobPermission(
  req: AuthenticatedRequest,
  jobId: string | undefined,
  level: JobPermission,
): Promise<{ id: string; orgId: string; visibility: string; status: string }> {
  const { job, role } = await effectiveJobRole(req, jobId);
  if (ROLE_RANK[role] < ROLE_RANK[level]) throw new AppError(403, 'Forbidden');
  return job;
}

// Route guard for job-scoped endpoints (`/api/jobs/:jobId/...`).
export const requireJobPermission = (level: JobPermission): RequestHandler =>
  wrap(async (req, _res, next) => {
    await assertJobPermission(req, req.params.jobId as string, level);
    next();
  });
