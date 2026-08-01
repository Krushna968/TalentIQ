import { type Response } from 'express';
import { getBackgroundQueue, queueHealth } from '../jobs/queue.js';
import { prisma } from '../lib/prisma.js';

export async function listJobs(req: any, res: Response) {
  const status = req.query.status as string | undefined;
  const jobs = await prisma.backgroundJob.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 50, 100),
  });
  res.json({ jobs });
}

export async function metrics(_req: any, res: Response) {
  const grouped = await prisma.backgroundJob.groupBy({ by: ['status'], _count: { status: true } });
  res.json({ jobs: Object.fromEntries(grouped.map((item) => [item.status, item._count.status])) });
}

export async function retryJob(req: any, res: Response) {
  const record = await prisma.backgroundJob.findUnique({ where: { id: req.params.jobId } });
  if (!record) return res.status(404).json({ error: 'Job not found' });
  if (!['FAILED', 'DEAD_LETTER'].includes(String(record.status))) return res.status(409).json({ error: 'Only failed jobs can be retried' });
  const job = await getBackgroundQueue().getJob(record.id);
  if (job) await job.retry();
  await prisma.backgroundJob.update({ where: { id: record.id }, data: { status: 'QUEUED', error: null, deadLetterAt: null, queuedAt: new Date() } });
  res.status(202).json({ jobId: record.id, status: 'QUEUED' });
}

export async function health(_req: any, res: Response) {
  try { res.json(await queueHealth()); }
  catch { res.status(503).json({ status: 'unavailable' }); }
}