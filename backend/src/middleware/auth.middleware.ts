import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

// Fixed id of the demo tenant seeded by scripts/seed.ts. Used as the default
// when no tenant is specified so local dev works out of the box.
export const DEMO_ORG_ID = 'demo-org';
export const DEMO_USER_ID = 'demo-user';

// PROVISIONAL AUTH (Owner 1 seam).
// Until Owner 1 ships real JWT auth, identity + tenant are read from request
// headers (with demo fallbacks) so recruiter flows are exercisable end-to-end:
//   x-user-id / x-user-role / x-org-id
// Owner 1's middleware must populate the SAME req.user shape
// ({ id, email, role, orgId }) so downstream code needs no changes.
export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const id = (req.header('x-user-id') || DEMO_USER_ID).trim();
  const role = (req.header('x-user-role') || 'admin').trim() as NonNullable<AuthenticatedRequest['user']>['role'];
  const orgId = (req.header('x-org-id') || DEMO_ORG_ID).trim();
  req.user = { id, email: `${id}@talentiq.ai`, role, orgId };
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};
