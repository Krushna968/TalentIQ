import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { resetDb, fakeReq, seedTenant } from '../setup/helpers.js';
import * as jobs from '../../src/services/job.service.js';
import * as pipeline from '../../src/services/pipeline.service.js';

const OWNER = { id: 'owner1', orgId: 'orgA' };
const stageByName = (jobId: string, name: string) =>
  prisma.pipelineStage.findFirstOrThrow({ where: { jobId, name } });

async function setupWithEntry() {
  await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
  const req = fakeReq(OWNER);
  const job = await jobs.createJob(req, { title: 'Backend Engineer' });
  await pipeline.addCandidates(req, job.id, ['cand1']);
  const board = await pipeline.getBoard(req, job.id);
  return { req, job, entry: board.entries[0] };
}

beforeEach(resetDb);

describe('pipeline service', () => {
  it('returns ordered stages and an empty entry list for a job with no candidates', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const req = fakeReq(OWNER);
    const job = await jobs.createJob(req, { title: 'Empty role' });
    const board = await pipeline.getBoard(req, job.id);
    expect(board.stages.map((s) => s.name)).toEqual(['Discovered', 'Screened', 'Interviewing', 'Offered', 'Hired', 'Rejected']);
    expect(board.entries).toEqual([]);
  });

  it('moves an entry and appends an immutable stage_change event', async () => {
    const { req, job, entry } = await setupWithEntry();
    const screened = await stageByName(job.id, 'Screened');
    const updated = await pipeline.moveStage(req, entry.id, screened.id, entry.updatedAt.toISOString());
    expect(updated.currentStageId).toBe(screened.id);
    const events = await pipeline.getTimeline(req, entry.id);
    expect(events.map((e) => e.type)).toEqual(['added', 'stage_change']);
  });

  it('rejects a stale optimistic update with 409', async () => {
    const { req, job, entry } = await setupWithEntry();
    const screened = await stageByName(job.id, 'Screened');
    const interviewing = await stageByName(job.id, 'Interviewing');
    // First move consumes the token and bumps updatedAt.
    await pipeline.moveStage(req, entry.id, screened.id, entry.updatedAt.toISOString());
    // Reusing the original token is now stale.
    await expect(
      pipeline.moveStage(req, entry.id, interviewing.id, entry.updatedAt.toISOString()),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('blocks moving out of a terminal stage until reopened', async () => {
    const { req, job, entry } = await setupWithEntry();
    await pipeline.recordDecision(req, entry.id, 'hire', 'Strong systems design');
    const discovered = await stageByName(job.id, 'Discovered');
    await expect(pipeline.moveStage(req, entry.id, discovered.id)).rejects.toMatchObject({ statusCode: 409 });
    // Reopen lands it back in the first active stage.
    const reopened = await pipeline.reopenEntry(req, entry.id);
    expect(reopened.currentStageId).toBe(discovered.id);
  });

  it('requires a reason for a decision and keeps the timeline append-only', async () => {
    const { req, entry } = await setupWithEntry();
    await expect(pipeline.recordDecision(req, entry.id, 'hire', '   ')).rejects.toMatchObject({ statusCode: 400 });

    await pipeline.recordDecision(req, entry.id, 'hire', 'Strong');
    const before = await prisma.pipelineEvent.findMany({ where: { entryId: entry.id }, orderBy: { createdAt: 'asc' } });
    expect(before.find((e) => e.type === 'decision')?.reason).toBe('Strong');

    // A later action must not mutate or remove any earlier event.
    await pipeline.addNote(req, entry.id, 'Following up with the team');
    const after = await prisma.pipelineEvent.findMany({ where: { entryId: entry.id }, orderBy: { createdAt: 'asc' } });
    expect(after.length).toBe(before.length + 1);
    for (const b of before) {
      const match = after.find((a) => a.id === b.id)!;
      expect(match).toMatchObject({ type: b.type, reason: b.reason, toStageId: b.toStageId });
      expect(match.createdAt.getTime()).toBe(b.createdAt.getTime());
    }
  });

  it('enforces tenant isolation: another org cannot read the board', async () => {
    const { job } = await setupWithEntry();
    await prisma.organization.create({ data: { id: 'orgB', name: 'orgB', slug: 'orgB' } });
    await prisma.membership.create({ data: { orgId: 'orgB', userId: 'intruder', role: 'owner' } });
    const intruder = fakeReq({ id: 'intruder', orgId: 'orgB' });
    await expect(pipeline.getBoard(intruder, job.id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('applies a bulk move across all entries of a single job', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    await prisma.candidate.create({ data: { id: 'cand2', name: 'C2', email: 'c2@test.dev', talentScore: 80 } });
    const req = fakeReq(OWNER);
    const job = await jobs.createJob(req, { title: 'Bulk role' });
    await pipeline.addCandidates(req, job.id, ['cand1', 'cand2']);
    const board = await pipeline.getBoard(req, job.id);
    const screened = await stageByName(job.id, 'Screened');
    const res = await pipeline.bulkAction(req, { entryIds: board.entries.map((e) => e.id), action: 'move', toStageId: screened.id });
    expect(res.applied).toBe(2);
    const after = await pipeline.getBoard(req, job.id);
    expect(after.entries.every((e) => e.currentStageId === screened.id)).toBe(true);
  });
});
