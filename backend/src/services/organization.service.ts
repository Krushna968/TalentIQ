import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { getUser, assertSameOrg, assertOrgRole, actorOf } from '../lib/tenant.js';
import { recordAudit } from './audit.service.js';

// Orgs the caller belongs to.
export async function listOrganizations(req: AuthenticatedRequest) {
  const user = getUser(req);
  return prisma.organization.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getOrganization(req: AuthenticatedRequest, id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  assertSameOrg(org ? { orgId: org.id } : null, req);
  return org;
}

export async function createOrganization(req: AuthenticatedRequest, data: { name: string; slug: string }) {
  const user = getUser(req);
  if (!data.name?.trim() || !data.slug?.trim()) throw new AppError(400, 'name and slug are required');

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: data.name.trim(), slug: data.slug.trim() } });
    // The creator becomes an owner so they can never be locked out of their tenant.
    await tx.membership.create({
      data: { orgId: org.id, userId: user.id, email: user.email, role: 'owner' },
    });
    await recordAudit(tx, {
      orgId: org.id, ...actorOf(req),
      action: 'org.create', targetType: 'Organization', targetId: org.id,
      metadata: { name: org.name, slug: org.slug },
    });
    return org;
  });
}

export async function listMembers(req: AuthenticatedRequest, orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  assertSameOrg(org ? { orgId: org.id } : null, req);
  return prisma.membership.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } });
}

export async function addMember(
  req: AuthenticatedRequest,
  orgId: string,
  data: { userId: string; email?: string; name?: string; role?: string },
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  assertSameOrg(org ? { orgId: org.id } : null, req);
  await assertOrgRole(req, ['owner', 'admin']); // only admins manage the team
  if (!data.userId?.trim()) throw new AppError(400, 'userId is required');

  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const member = await tx.membership.upsert({
      where: { orgId_userId: { orgId, userId: data.userId } },
      create: { orgId, userId: data.userId, email: data.email, name: data.name, role: data.role ?? 'recruiter' },
      update: { email: data.email, name: data.name, role: data.role ?? undefined },
    });
    await recordAudit(tx, {
      orgId, ...actor,
      action: 'org.member.add', targetType: 'Membership', targetId: member.id,
      metadata: { userId: data.userId, role: member.role },
    });
    return member;
  });
}

export async function updateMemberRole(req: AuthenticatedRequest, membershipId: string, role: string) {
  await assertOrgRole(req, ['owner', 'admin']);
  const member = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!member) throw new AppError(404, 'Member not found');
  assertSameOrg({ orgId: member.orgId }, req);
  if (!role?.trim()) throw new AppError(400, 'role is required');

  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.update({ where: { id: membershipId }, data: { role } });
    await recordAudit(tx, {
      orgId: member.orgId, ...actor,
      action: 'org.member.updateRole', targetType: 'Membership', targetId: membershipId,
      metadata: { role },
    });
    return updated;
  });
}
