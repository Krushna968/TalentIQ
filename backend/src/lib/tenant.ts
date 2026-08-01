import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { prisma } from './prisma.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'admin';
  orgId: string;
}

// Returns the authenticated user or throws 401. Use this instead of touching
// req.user directly so controllers/services never carry undefined checks.
export function getUser(req: AuthenticatedRequest): AuthUser {
  if (!req.user || !req.user.orgId) {
    throw new AppError(401, 'Unauthenticated');
  }
  return req.user as AuthUser;
}

// The single chokepoint for tenant isolation: injects the caller's orgId into
// every Prisma `where`. Building all recruiter queries through this makes
// cross-tenant reads structurally hard to write by accident.
export function scopedWhere<T extends Record<string, unknown>>(
  req: AuthenticatedRequest,
  extra: T = {} as T,
): T & { orgId: string } {
  return { ...extra, orgId: getUser(req).orgId };
}

// Guards a record already loaded by id. Throws 403 (not 404) on a tenant
// mismatch so we don't leak whether the id exists in another org.
export function assertSameOrg(record: { orgId: string } | null, req: AuthenticatedRequest): void {
  if (!record || record.orgId !== getUser(req).orgId) {
    throw new AppError(403, 'Forbidden');
  }
}

// The caller's role within their tenant. Cached on req.orgRole by requireOrg;
// falls back to a DB lookup so services/tests work without the HTTP middleware.
export async function getOrgRole(req: AuthenticatedRequest): Promise<string> {
  if (req.orgRole) return req.orgRole;
  const user = getUser(req);
  const membership = await prisma.membership.findUnique({
    where: { orgId_userId: { orgId: user.orgId, userId: user.id } },
  });
  if (!membership) throw new AppError(403, 'Not a member of this organization');
  req.orgRole = membership.role as AuthenticatedRequest['orgRole'];
  return membership.role;
}

// Asserts the caller holds one of `allowed` roles in their tenant, else 403.
export async function assertOrgRole(req: AuthenticatedRequest, allowed: string[]): Promise<void> {
  const role = await getOrgRole(req);
  if (!allowed.includes(role)) throw new AppError(403, 'Forbidden');
}

// Actor identity stamped onto audit rows and pipeline events (both use these keys).
export function actorOf(req: AuthenticatedRequest): { actorId: string; actorName: string } {
  const user = getUser(req);
  return { actorId: user.id, actorName: user.email };
}
