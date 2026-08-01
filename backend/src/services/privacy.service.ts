import { prisma } from '../lib/prisma.js';
import { authService } from './auth.service.js';
import { auditService } from './audit.service.js';
import { AppError } from '../middleware/error.middleware.js';

export interface ConsentRecordItem {
  consentType: string;
  status: string; // GRANTED, REVOKED
  version: string;
  updatedAt: Date;
}

const memConsents: Map<string, Record<string, ConsentRecordItem>> = new Map(); // userId -> { consentType -> item }
const memVisibility: Map<string, string> = new Map(); // userId -> visibility

export class PrivacyService {
  async updateConsent(userId: string, consentType: string, status: string, version: string = '1.0'): Promise<ConsentRecordItem> {
    const user = await authService.findUserById(userId);
    if (!user) throw new AppError(404, 'User account not found', 'NOT_FOUND');

    let userConsents = memConsents.get(userId) || {};
    const item: ConsentRecordItem = { consentType, status, version, updatedAt: new Date() };
    userConsents[consentType] = item;
    memConsents.set(userId, userConsents);

    await auditService.record({
      userId,
      action: status === 'GRANTED' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      metadata: { consentType, version },
    });

    try {
      if (process.env.NODE_ENV !== 'test') {
        await prisma.consentRecord.upsert({
          where: { userId_consentType: { userId, consentType } },
          update: { status, version, revokedAt: status === 'REVOKED' ? new Date() : null },
          create: { id: crypto.randomUUID(), userId, consentType, status, version },
        });
      }
    } catch {
      // Retain in memory
    }

    return item;
  }

  async getConsents(userId: string): Promise<ConsentRecordItem[]> {
    const map = memConsents.get(userId) || {};
    try {
      if (process.env.NODE_ENV !== 'test') {
        const records = await prisma.consentRecord.findMany({ where: { userId } });
        if (records && records.length > 0) {
          return records.map((r: { consentType: string; status: string; version: string; grantedAt: Date }) => ({ consentType: r.consentType, status: r.status, version: r.version, updatedAt: r.grantedAt }));
        }
      }
    } catch {
      // fallback
    }
    return Object.values(map);
  }

  async updateVisibility(userId: string, visibility: string): Promise<string> {
    memVisibility.set(userId, visibility);
    try {
      if (process.env.NODE_ENV !== 'test') {
        await prisma.privacyPreference.upsert({
          where: { userId },
          update: { visibility },
          create: { id: crypto.randomUUID(), userId, visibility },
        });
      }
    } catch {
      // fallback
    }
    return visibility;
  }

  async getVisibility(userId: string): Promise<string> {
    if (memVisibility.has(userId)) return memVisibility.get(userId)!;
    try {
      if (process.env.NODE_ENV !== 'test') {
        const pref = await prisma.privacyPreference.findUnique({ where: { userId } });
        if (pref) return pref.visibility;
      }
    } catch {
      // fallback
    }
    return 'ORGANIZATION_SHARED';
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await authService.findUserById(userId);
    if (!user) throw new AppError(404, 'User account not found', 'NOT_FOUND');

    await auditService.record({ userId, action: 'DATA_EXPORT_REQUESTED' });

    const consents = await this.getConsents(userId);
    const visibility = await this.getVisibility(userId);
    const logs = await auditService.getLogsForUser(userId);

    const { passwordHash: _hash, ...safeUser } = user;
    return {
      profile: safeUser,
      privacy: {
        visibility,
        consents,
      },
      auditHistory: logs,
      exportedAt: new Date().toISOString(),
    };
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    await auditService.record({ userId, action: 'DELETION_REQUESTED' });
    await authService.updateUser(userId, { status: 'DELETED', name: 'Deleted User', email: `deleted_${userId}@talentiq.local` });
    await authService.revokeAllUserTokens(userId);

    try {
      if (process.env.NODE_ENV !== 'test') {
        await prisma.deletionRequest.create({
          data: { id: crypto.randomUUID(), userId, status: 'PROCESSING' },
        });
      }
    } catch {
      // ignore
    }
  }
}

export const privacyService = new PrivacyService();
