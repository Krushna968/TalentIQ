import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'candidate' | 'recruiter' | 'admin';
    // Tenant the request is acting within. Populated by the auth middleware.
    // Owner 1's real JWT auth must fill this same shape so the seam is drop-in.
    orgId: string;
  };
  // Set by requireOrg once membership in `user.orgId` is verified against the DB.
  orgRole?: 'owner' | 'admin' | 'recruiter' | 'viewer';
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
