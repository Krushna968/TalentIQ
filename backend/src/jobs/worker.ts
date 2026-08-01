import { UnrecoverableError, Worker, type Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { decryptSecret } from '../services/secret-crypto.service.js';
import { syncCandidateFromGitHub } from '../services/github.service.js';
import { expireEvidence } from '../services/evidence.service.js';
import { createNotification, deliverNotification } from '../services/notification.service.js';
import { BACKGROUND_QUEUE_NAME, getQueueConnection } from './queue.js';
import type { BackgroundJobPayload } from './types.js';

async function processJob(job: Job<BackgroundJobPayload>) {
  await prisma.backgroundJob.update({
    where: { id: String(job.id) },
    data: { status: 'ACTIVE', startedAt: new Date(), attempts: job.attemptsMade + 1, error: null },
  });

  switch (job.name) {
    case 'source.sync': {
      if (job.data.type !== 'source.sync' || job.data.provider !== 'github') throw new UnrecoverableError('Unsupported source sync provider');
      const connection = await prisma.githubConnection.findUnique({ where: { candidateId: job.data.candidateId } });
      if (!connection) throw new UnrecoverableError('GitHub connection no longer exists');
      await prisma.githubConnection.update({ where: { candidateId: job.data.candidateId }, data: { syncStatus: 'syncing' } });
      await syncCandidateFromGitHub(job.data.candidateId, decryptSecret(connection.accessToken));
      await createNotification({ candidateId: job.data.candidateId, category: 'sync_success', title: 'GitHub sync complete', body: 'Your GitHub evidence has been refreshed.' });
      return { provider: 'github', candidateId: job.data.candidateId };
    }
    case 'evidence.expiry':
      return { expired: await expireEvidence() };
    case 'upload.scan': {
      if (job.data.type !== 'upload.scan') throw new UnrecoverableError('Invalid upload scan job');
      // No client-controlled clean state: without an approved scanner, the object remains quarantined.
      await prisma.attachment.update({
        where: { id: job.data.attachmentId },
        data: { scanStatus: 'QUARANTINED', scanDetail: 'Awaiting approved malware scanner integration' },
      });
      return { attachmentId: job.data.attachmentId, status: 'quarantined' };
    }
    case 'notification.deliver':
      if (job.data.type !== 'notification.deliver') throw new UnrecoverableError('Invalid notification job');
      return deliverNotification(job.data.notificationId);
    case 'webhook.process':
      throw new UnrecoverableError('No verified provider webhook adapter is configured');
    case 'report.export':
      throw new UnrecoverableError('No report export adapter is configured');
    default:
      throw new UnrecoverableError(`Unsupported job: ${job.name}`);
  }
}

export function startBackgroundWorker() {
  const worker = new Worker<BackgroundJobPayload>(BACKGROUND_QUEUE_NAME, processJob, {
    connection: getQueueConnection(),
    concurrency: env.WORKER_CONCURRENCY,
  });

  worker.on('completed', async (job) => {
    await prisma.backgroundJob.update({ where: { id: String(job.id) }, data: { status: 'COMPLETED', completedAt: new Date(), error: null } });
  });
  worker.on('failed', async (job, error) => {
    if (!job) return;
    const finalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (job.data.type === 'source.sync') {
      await createNotification({ candidateId: job.data.candidateId, category: 'sync_failure', title: 'GitHub sync needs attention', body: 'We could not refresh your GitHub evidence. Please try again later.' });
    }
    await prisma.backgroundJob.update({
      where: { id: String(job.id) },
      data: {
        status: finalAttempt ? 'DEAD_LETTER' : 'FAILED',
        error: error.message.slice(0, 1_000),
        deadLetterAt: finalAttempt ? new Date() : null,
      },
    });
  });
  return worker;
}