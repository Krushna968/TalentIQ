import { prisma } from '../../src/lib/prisma.js';
import type { AuthenticatedRequest } from '../../src/types/index.js';

// Removes all recruiter-domain rows in FK-safe order (entries before stages so
// the RESTRICT on PipelineEntry.currentStage doesn't block deletion).
export async function resetDb() {
  await prisma.pipelineEvent.deleteMany();
  await prisma.pipelineEntry.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.jobCollaborator.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.job.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.candidate.deleteMany();
}

// A minimal AuthenticatedRequest stand-in for calling services directly.
export function fakeReq(user: { id: string; orgId: string; role?: string }): AuthenticatedRequest {
  return {
    user: { id: user.id, email: `${user.id}@test.dev`, role: (user.role as never) ?? 'recruiter', orgId: user.orgId },
    header: () => undefined,
  } as unknown as AuthenticatedRequest;
}

// Creates an org, an owner membership for `userId`, and a candidate to place.
export async function seedTenant(opts: { orgId: string; userId: string; candidateId: string }) {
  await prisma.organization.create({ data: { id: opts.orgId, name: opts.orgId, slug: opts.orgId } });
  await prisma.membership.create({ data: { orgId: opts.orgId, userId: opts.userId, role: 'owner' } });
  await prisma.candidate.create({
    data: { id: opts.candidateId, name: 'Test Candidate', email: `${opts.candidateId}@test.dev`, talentScore: 90 },
  });
}
