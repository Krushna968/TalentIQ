import { Request } from 'express';

export type Role = 'candidate' | 'recruiter' | 'reviewer' | 'admin';

export interface AuthPrincipal {
  /** User record id. This is never the candidate id. */
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Set when the signed-in user owns a candidate profile. */
  candidateId?: string;
  /** Set when the signed-in user is a recruiter. */
  recruiterId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPrincipal;
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
