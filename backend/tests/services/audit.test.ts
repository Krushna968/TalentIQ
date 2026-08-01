import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import { resetDb, fakeReq, seedTenant } from '../setup/helpers.js';
import * as jobs from '../../src/services/job.service.js';
import * as pipeline from '../../src/services/pipeline.service.js';

const OWNER = { id: 'owner1', orgId: 'orgA' };

beforeEach(resetDb);

describe('audit trail', () => {
  it('writes an audit row for every mutating recruiter action', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const req = fakeReq(OWNER);

    const job = await jobs.createJob(req, { title: 'Role' }); // job.create
    await pipeline.addCandidates(req, job.id, ['cand1']); // pipeline.add
    const board = await pipeline.getBoard(req, job.id);
    await pipeline.recordDecision(req, board.entries[0].id, 'hold', 'Revisit next week'); // pipeline.decision

    const logs = await prisma.recruiterAuditLog.findMany({ where: { orgId: 'orgA' }, orderBy: { createdAt: 'asc' } });
    expect(logs.map((l) => l.action)).toEqual(
      expect.arrayContaining(['job.create', 'pipeline.add', 'pipeline.decision']),
    );
    // Every row is tenant- and actor-attributed.
    for (const log of logs) {
      expect(log.orgId).toBe('orgA');
      expect(log.actorId).toBe('owner1');
    }
  });

  it('does not write an audit row when a mutation is rejected (transactional rollback)', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const req = fakeReq(OWNER);
    const job = await jobs.createJob(req, { title: 'Role' });
    await pipeline.addCandidates(req, job.id, ['cand1']);
    const board = await pipeline.getBoard(req, job.id);

    const before = await prisma.recruiterAuditLog.count();
    await expect(pipeline.recordDecision(req, board.entries[0].id, 'hire', '')).rejects.toMatchObject({ statusCode: 400 });
    expect(await prisma.recruiterAuditLog.count()).toBe(before); // nothing logged for the failed call
  });
});
