import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { getUser, getOrgRole, assertOrgRole, actorOf, scopedWhere } from '../lib/tenant.js';
import { assertJobPermission } from '../middleware/tenant.middleware.js';
import { recordAudit } from './audit.service.js';

// Default hiring stages seeded for every new requisition. Hired/Rejected are
// terminal — the pipeline service blocks moving out of them without a reopen.
export const DEFAULT_STAGES: { name: string; order: number; isTerminal: boolean }[] = [
  { name: 'Discovered', order: 0, isTerminal: false },
  { name: 'Screened', order: 1, isTerminal: false },
  { name: 'Interviewing', order: 2, isTerminal: false },
  { name: 'Offered', order: 3, isTerminal: false },
  { name: 'Hired', order: 4, isTerminal: true },
  { name: 'Rejected', order: 5, isTerminal: true },
];

// Lists requisitions the caller may see: org owners/admins see all in the tenant;
// everyone else sees org-visible jobs plus ones they collaborate on.
export async function listJobs(req: AuthenticatedRequest, filter: { status?: string } = {}) {
  const user = getUser(req);
  const role = await getOrgRole(req);
  const base = scopedWhere(req, filter.status ? { status: filter.status } : {});

  const where =
    role === 'owner' || role === 'admin'
      ? base
      : { ...base, OR: [{ visibility: 'org' }, { collaborators: { some: { userId: user.id } } }] };

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true, collaborators: true } } },
  });
}

export async function getJob(req: AuthenticatedRequest, jobId: string) {
  await assertJobPermission(req, jobId, 'viewer');
  return prisma.job.findUnique({
    where: { id: jobId },
    include: { stages: { orderBy: { order: 'asc' } }, collaborators: true },
  });
}

export async function createJob(
  req: AuthenticatedRequest,
  data: { title: string; description?: string; department?: string; location?: string; employmentType?: string; visibility?: string },
) {
  const user = getUser(req);
  await assertOrgRole(req, ['owner', 'admin', 'recruiter']); // viewers can't create
  if (!data.title?.trim()) throw new AppError(400, 'title is required');

  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        orgId: user.orgId,
        title: data.title.trim(),
        description: data.description,
        department: data.department,
        location: data.location,
        employmentType: data.employmentType,
        visibility: data.visibility === 'assigned' ? 'assigned' : 'org',
        createdById: user.id,
        stages: { create: DEFAULT_STAGES },
        collaborators: { create: { userId: user.id, role: 'owner' } },
      },
      include: { stages: { orderBy: { order: 'asc' } }, collaborators: true },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'job.create', targetType: 'Job', targetId: job.id,
      metadata: { title: job.title, visibility: job.visibility },
    });
    return job;
  });
}

export async function updateJob(
  req: AuthenticatedRequest,
  jobId: string,
  data: Partial<{ title: string; description: string; department: string; location: string; employmentType: string; visibility: string }>,
) {
  await assertJobPermission(req, jobId, 'editor');
  const actor = actorOf(req);
  const user = getUser(req);

  return prisma.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id: jobId },
      data: {
        title: data.title?.trim(),
        description: data.description,
        department: data.department,
        location: data.location,
        employmentType: data.employmentType,
        visibility: data.visibility,
      },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'job.update', targetType: 'Job', targetId: jobId, metadata: { ...data },
    });
    return job;
  });
}

// Opens or closes a requisition. Closing stamps closedAt; reopening clears it.
export async function setJobStatus(req: AuthenticatedRequest, jobId: string, status: 'open' | 'closed' | 'draft') {
  await assertJobPermission(req, jobId, 'editor');
  const actor = actorOf(req);
  const user = getUser(req);

  return prisma.$transaction(async (tx) => {
    const job = await tx.job.update({
      where: { id: jobId },
      data: { status, closedAt: status === 'closed' ? new Date() : null },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: `job.${status}`, targetType: 'Job', targetId: jobId,
    });
    return job;
  });
}

export async function listCollaborators(req: AuthenticatedRequest, jobId: string) {
  await assertJobPermission(req, jobId, 'viewer');
  return prisma.jobCollaborator.findMany({ where: { jobId }, orderBy: { createdAt: 'asc' } });
}

export async function addCollaborator(
  req: AuthenticatedRequest,
  jobId: string,
  data: { userId: string; role?: string },
) {
  await assertJobPermission(req, jobId, 'owner'); // only job owners grant access
  if (!data.userId?.trim()) throw new AppError(400, 'userId is required');
  const actor = actorOf(req);
  const user = getUser(req);
  const role = data.role ?? 'viewer';

  return prisma.$transaction(async (tx) => {
    const collab = await tx.jobCollaborator.upsert({
      where: { jobId_userId: { jobId, userId: data.userId } },
      create: { jobId, userId: data.userId, role },
      update: { role },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'job.collaborator.add', targetType: 'Job', targetId: jobId,
      metadata: { userId: data.userId, role },
    });
    return collab;
  });
}
