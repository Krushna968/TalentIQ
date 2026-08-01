import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';
import { resetDb, fakeReq, seedTenant } from '../setup/helpers.js';
import * as jobs from '../../src/services/job.service.js';
import * as pipeline from '../../src/services/pipeline.service.js';

const OWNER = { id: 'owner1', orgId: 'orgA' };
const asOwner = (req: request.Test) => req.set('x-user-id', 'owner1').set('x-org-id', 'orgA');

beforeEach(resetDb);

describe('pipeline routes (HTTP)', () => {
  it('403s a user from another org with no permission on the job', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const job = await jobs.createJob(fakeReq(OWNER), { title: 'Role', visibility: 'assigned' });
    await prisma.organization.create({ data: { id: 'orgB', name: 'orgB', slug: 'orgB' } });
    await prisma.membership.create({ data: { orgId: 'orgB', userId: 'intruder', role: 'owner' } });

    const res = await request(app)
      .get(`/api/jobs/${job.id}/pipeline`)
      .set('x-user-id', 'intruder')
      .set('x-org-id', 'orgB');
    expect(res.status).toBe(403);
  });

  it('returns an empty board (stages, no entries) for a job with no candidates', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const job = await jobs.createJob(fakeReq(OWNER), { title: 'Empty role' });

    const res = await asOwner(request(app).get(`/api/jobs/${job.id}/pipeline`));
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
    expect(res.body.stages).toHaveLength(6);
  });

  it('400s a malformed decision with no reason', async () => {
    await seedTenant({ orgId: 'orgA', userId: 'owner1', candidateId: 'cand1' });
    const req = fakeReq(OWNER);
    const job = await jobs.createJob(req, { title: 'Role' });
    await pipeline.addCandidates(req, job.id, ['cand1']);
    const board = await pipeline.getBoard(req, job.id);

    const res = await asOwner(
      request(app).post(`/api/pipeline/entries/${board.entries[0].id}/decision`).send({ decision: 'hire' }),
    );
    expect(res.status).toBe(400);
  });
});
