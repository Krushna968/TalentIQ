import { prisma } from '../lib/prisma.js';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'DATA_EXPORT_REQUESTED'
  | 'DELETION_REQUESTED'
  | 'RECRUITER_PRIVATE_DATA_ACCESS';

export interface AuditLogOptions {
  userId?: string | null;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// In-memory array for observability during automated testing or DB offline fallback
export const inMemoryAuditLogs: (AuditLogOptions & { createdAt: Date })[] = [];

export class AuditService {
  /**
   * Record a security or privacy action in the audit log
   */
  async record(options: AuditLogOptions): Promise<void> {
    const entry = {
      ...options,
      createdAt: new Date(),
    };

    if (process.env.NODE_ENV === 'test' || process.env.AUDIT_IN_MEMORY === 'true') {
      inMemoryAuditLogs.push(entry);
      return;
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: options.userId || null,
          action: options.action,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
          metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        },
      });
    } catch (err) {
      // Graceful fallback to in-memory log if DB server is unreachable
      console.warn(`[AuditService Warning] Could not persist audit log to DB, storing in fallback buffer. Action: ${options.action}`);
      inMemoryAuditLogs.push(entry);
    }
  }

  async getLogsForUser(userId: string): Promise<Array<{ action: string; createdAt: Date; metadata: string | null }>> {
    try {
      if (process.env.NODE_ENV === 'test' || process.env.AUDIT_IN_MEMORY === 'true') {
        return inMemoryAuditLogs
          .filter(l => l.userId === userId)
          .map(l => ({ action: l.action, createdAt: l.createdAt, metadata: l.metadata ? JSON.stringify(l.metadata) : null }));
      }
      return await prisma.auditLog.findMany({
        where: { userId },
        select: { action: true, createdAt: true, metadata: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      return inMemoryAuditLogs
        .filter(l => l.userId === userId)
        .map(l => ({ action: l.action, createdAt: l.createdAt, metadata: l.metadata ? JSON.stringify(l.metadata) : null }));
    }
  }
}

export const auditService = new AuditService();
