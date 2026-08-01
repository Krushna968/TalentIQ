import { prisma } from '../lib/prisma.js';

// Accepts either the shared client or a $transaction client, so an audit row can
// be written in the same transaction as the action it records (all-or-nothing).
type AuditClient = Pick<typeof prisma, 'auditLog'>;

export interface AuditInput {
  orgId: string;
  actorId: string;
  actorName?: string | null;
  action: string;       // e.g. 'job.close', 'pipeline.decision'
  targetType: string;   // e.g. 'Job', 'PipelineEntry'
  targetId: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(client: AuditClient, input: AuditInput) {
  return client.auditLog.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      actorName: input.actorName ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
