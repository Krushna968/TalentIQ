import { prisma } from '../lib/prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { getUser, actorOf } from '../lib/tenant.js';
import { assertJobPermission, type JobPermission } from '../middleware/tenant.middleware.js';
import { recordAudit } from './audit.service.js';

const CANDIDATE_FIELDS = { id: true, name: true, title: true, talentScore: true, avatar: true, location: true } as const;

// Loads an entry and asserts the caller's permission on its job (which also
// enforces tenant isolation). Central choke point for entry-scoped writes.
async function loadEntry(req: AuthenticatedRequest, entryId: string, level: JobPermission = 'editor') {
  const entry = await prisma.pipelineEntry.findUnique({
    where: { id: entryId },
    include: { currentStage: true },
  });
  if (!entry) throw new AppError(404, 'Pipeline entry not found');
  await assertJobPermission(req, entry.jobId, level);
  return entry;
}

// The board: ordered stages + entries (with light candidate info). Returns the
// stage columns even when a job has zero entries (empty-state friendly).
export async function getBoard(req: AuthenticatedRequest, jobId: string) {
  const job = await assertJobPermission(req, jobId, 'viewer');
  const [stages, entries] = await Promise.all([
    prisma.pipelineStage.findMany({ where: { jobId }, orderBy: { order: 'asc' } }),
    prisma.pipelineEntry.findMany({
      where: { jobId },
      orderBy: { addedAt: 'asc' },
      include: { candidate: { select: CANDIDATE_FIELDS } },
    }),
  ]);
  return { job, stages, entries };
}

// Adds candidates to a job's first stage. Idempotent: existing entries and
// unknown candidate ids are skipped rather than erroring the whole batch.
export async function addCandidates(req: AuthenticatedRequest, jobId: string, candidateIds: string[]) {
  await assertJobPermission(req, jobId, 'editor');
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
    throw new AppError(400, 'candidateIds is required');
  }
  const user = getUser(req);
  const actor = actorOf(req);

  const firstStage = await prisma.pipelineStage.findFirst({ where: { jobId }, orderBy: { order: 'asc' } });
  if (!firstStage) throw new AppError(400, 'Job has no pipeline stages');

  const [existing, valid] = await Promise.all([
    prisma.pipelineEntry.findMany({ where: { jobId, candidateId: { in: candidateIds } }, select: { candidateId: true } }),
    prisma.candidate.findMany({ where: { id: { in: candidateIds } }, select: { id: true } }),
  ]);
  const existingSet = new Set(existing.map((e) => e.candidateId));
  const validSet = new Set(valid.map((c) => c.id));
  const toAdd = candidateIds.filter((id) => validSet.has(id) && !existingSet.has(id));

  const created = await prisma.$transaction(async (tx) => {
    const rows = [];
    for (const candidateId of toAdd) {
      const entry = await tx.pipelineEntry.create({
        data: { jobId, candidateId, currentStageId: firstStage.id, addedById: user.id },
      });
      await tx.pipelineEvent.create({ data: { entryId: entry.id, type: 'added', toStageId: firstStage.id, ...actor } });
      await recordAudit(tx, {
        orgId: user.orgId, ...actor,
        action: 'pipeline.add', targetType: 'PipelineEntry', targetId: entry.id, metadata: { jobId, candidateId },
      });
      rows.push(entry);
    }
    return rows;
  });

  return { added: created.length, skipped: candidateIds.length - created.length, entries: created };
}

// Moves an entry to another stage with optimistic concurrency and the
// terminal-stage rule. `expectedUpdatedAt` is the updatedAt the client last saw.
export async function moveStage(
  req: AuthenticatedRequest,
  entryId: string,
  toStageId: string,
  expectedUpdatedAt?: string,
) {
  const entry = await loadEntry(req, entryId, 'editor');
  if (expectedUpdatedAt && entry.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new AppError(409, 'This candidate was updated elsewhere — refresh and retry');
  }
  if (entry.currentStage.isTerminal) {
    throw new AppError(409, 'Entry is in a terminal stage; reopen it before moving');
  }
  const toStage = await prisma.pipelineStage.findUnique({ where: { id: toStageId } });
  if (!toStage || toStage.jobId !== entry.jobId) throw new AppError(400, 'Invalid target stage');
  if (toStage.id === entry.currentStageId) return entry; // no-op

  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pipelineEntry.update({ where: { id: entryId }, data: { currentStageId: toStageId } });
    await tx.pipelineEvent.create({
      data: { entryId, type: 'stage_change', fromStageId: entry.currentStageId, toStageId, ...actor },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.move', targetType: 'PipelineEntry', targetId: entryId,
      metadata: { from: entry.currentStageId, to: toStageId },
    });
    return updated;
  });
}

// Records a Hire/Hold/Reject decision. Hire/Reject move to the matching terminal
// stage; Hold stays put. A reason is mandatory and captured immutably.
export async function recordDecision(
  req: AuthenticatedRequest,
  entryId: string,
  decision: 'hire' | 'hold' | 'reject',
  reason: string,
) {
  if (!['hire', 'hold', 'reject'].includes(decision)) throw new AppError(400, 'Invalid decision');
  if (!reason?.trim()) throw new AppError(400, 'A decision reason is required');
  const entry = await loadEntry(req, entryId, 'editor');

  let toStageId = entry.currentStageId;
  if (decision === 'hire' || decision === 'reject') {
    const stageName = decision === 'hire' ? 'Hired' : 'Rejected';
    const stage = await prisma.pipelineStage.findFirst({ where: { jobId: entry.jobId, name: stageName } });
    if (!stage) throw new AppError(400, `No "${stageName}" stage configured for this job`);
    toStageId = stage.id;
  }

  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pipelineEntry.update({ where: { id: entryId }, data: { currentStageId: toStageId } });
    await tx.pipelineEvent.create({
      data: {
        entryId, type: 'decision', decision, reason: reason.trim(),
        fromStageId: entry.currentStageId, toStageId, ...actor,
      },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.decision', targetType: 'PipelineEntry', targetId: entryId,
      metadata: { decision, reason: reason.trim() },
    });
    return updated;
  });
}

// Reopens a terminal (hired/rejected) entry back into an active stage.
export async function reopenEntry(req: AuthenticatedRequest, entryId: string, toStageId?: string) {
  const entry = await loadEntry(req, entryId, 'editor');
  if (!entry.currentStage.isTerminal) throw new AppError(400, 'Entry is not in a terminal stage');
  const target = toStageId
    ? await prisma.pipelineStage.findUnique({ where: { id: toStageId } })
    : await prisma.pipelineStage.findFirst({ where: { jobId: entry.jobId, isTerminal: false }, orderBy: { order: 'asc' } });
  if (!target || target.jobId !== entry.jobId || target.isTerminal) throw new AppError(400, 'Invalid reopen target');

  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pipelineEntry.update({ where: { id: entryId }, data: { currentStageId: target.id } });
    await tx.pipelineEvent.create({
      data: { entryId, type: 'stage_change', fromStageId: entry.currentStageId, toStageId: target.id, reason: 'reopened', ...actor },
    });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.reopen', targetType: 'PipelineEntry', targetId: entryId, metadata: { to: target.id },
    });
    return updated;
  });
}

export async function assignOwner(req: AuthenticatedRequest, entryId: string, assignedToUserId: string | null) {
  await loadEntry(req, entryId, 'editor');
  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pipelineEntry.update({
      where: { id: entryId },
      data: { assignedToUserId: assignedToUserId || null },
    });
    await tx.pipelineEvent.create({ data: { entryId, type: 'assignment', body: assignedToUserId || null, ...actor } });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.assign', targetType: 'PipelineEntry', targetId: entryId, metadata: { assignedToUserId },
    });
    return updated;
  });
}

export async function setShortlist(req: AuthenticatedRequest, entryId: string, shortlisted: boolean) {
  await loadEntry(req, entryId, 'editor');
  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.pipelineEntry.update({ where: { id: entryId }, data: { shortlisted: !!shortlisted } });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.shortlist', targetType: 'PipelineEntry', targetId: entryId, metadata: { shortlisted: !!shortlisted },
    });
    return updated;
  });
}

export async function addNote(req: AuthenticatedRequest, entryId: string, body: string) {
  if (!body?.trim()) throw new AppError(400, 'Note body is required');
  await loadEntry(req, entryId, 'editor');
  const user = getUser(req);
  const actor = actorOf(req);
  return prisma.$transaction(async (tx) => {
    const note = await tx.pipelineEvent.create({ data: { entryId, type: 'note', body: body.trim(), ...actor } });
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: 'pipeline.note', targetType: 'PipelineEntry', targetId: entryId,
    });
    return note;
  });
}

// The immutable activity/decision timeline for an entry, oldest first.
export async function getTimeline(req: AuthenticatedRequest, entryId: string) {
  await loadEntry(req, entryId, 'viewer');
  return prisma.pipelineEvent.findMany({ where: { entryId }, orderBy: { createdAt: 'asc' } });
}

type BulkInput = {
  entryIds: string[];
  action: 'move' | 'assign' | 'shortlist';
  toStageId?: string;
  assignedToUserId?: string | null;
  shortlisted?: boolean;
};

// Applies one action across many entries of a single job, transactionally.
export async function bulkAction(req: AuthenticatedRequest, input: BulkInput) {
  const { entryIds, action } = input;
  if (!Array.isArray(entryIds) || entryIds.length === 0) throw new AppError(400, 'entryIds is required');

  const entries = await prisma.pipelineEntry.findMany({
    where: { id: { in: entryIds } },
    include: { currentStage: true },
  });
  if (entries.length !== entryIds.length) throw new AppError(404, 'Some entries were not found');
  const jobIds = [...new Set(entries.map((e) => e.jobId))];
  if (jobIds.length !== 1) throw new AppError(400, 'Bulk actions must target a single job');
  await assertJobPermission(req, jobIds[0], 'editor');

  if (action === 'move') {
    const toStage = input.toStageId ? await prisma.pipelineStage.findUnique({ where: { id: input.toStageId } }) : null;
    if (!toStage || toStage.jobId !== jobIds[0]) throw new AppError(400, 'Invalid target stage');
  }

  const user = getUser(req);
  const actor = actorOf(req);
  const results = await prisma.$transaction(async (tx) => {
    let applied = 0;
    for (const entry of entries) {
      if (action === 'move') {
        if (entry.currentStage.isTerminal || entry.currentStageId === input.toStageId) continue; // skip terminal / no-op
        await tx.pipelineEntry.update({ where: { id: entry.id }, data: { currentStageId: input.toStageId! } });
        await tx.pipelineEvent.create({
          data: { entryId: entry.id, type: 'stage_change', fromStageId: entry.currentStageId, toStageId: input.toStageId!, ...actor },
        });
      } else if (action === 'assign') {
        await tx.pipelineEntry.update({ where: { id: entry.id }, data: { assignedToUserId: input.assignedToUserId || null } });
        await tx.pipelineEvent.create({ data: { entryId: entry.id, type: 'assignment', body: input.assignedToUserId || null, ...actor } });
      } else if (action === 'shortlist') {
        await tx.pipelineEntry.update({ where: { id: entry.id }, data: { shortlisted: !!input.shortlisted } });
      } else {
        throw new AppError(400, 'Unknown bulk action');
      }
      applied += 1;
    }
    await recordAudit(tx, {
      orgId: user.orgId, ...actor,
      action: `pipeline.bulk.${action}`, targetType: 'Job', targetId: jobIds[0],
      metadata: { applied, ...input },
    });
    return applied;
  });

  return { applied: results, total: entryIds.length };
}
