import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    organizationId?: string;
  };
  requestId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  } | string;
  requestId?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

