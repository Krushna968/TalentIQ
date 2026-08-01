import { Queue, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import type { EnqueueInput } from './types.js';

export const BACKGROUND_QUEUE_NAME = `${env.QUEUE_PREFIX}:background`;

let connection: IORedis | undefined;
let queue: Queue | undefined;

export function getQueueConnection() {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getBackgroundQueue() {
  if (!queue) queue = new Queue(BACKGROUND_QUEUE_NAME, { connection: getQueueConnection() });
  return queue;
}

const defaultOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: 1_000,
  removeOnFail: 5_000,
};

export async function enqueueBackgroundJob(input: EnqueueInput) {
  const job = await prisma.backgroundJob.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      name: input.name,
      candidateId: input.candidateId ?? null,
      idempotencyKey: input.idempotencyKey,
      payload: JSON.stringify(input.payload),
      maxAttempts: input.maxAttempts ?? defaultOptions.attempts ?? 5,
      status: 'QUEUED',
    },
    update: {},
  });

  if (job.status === 'COMPLETED' || job.status === 'ACTIVE') return job;

  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: { status: 'QUEUED', error: null, completedAt: null, deadLetterAt: null, queuedAt: new Date() },
  });

  await getBackgroundQueue().add(input.name, input.payload, {
    ...defaultOptions,
    attempts: input.maxAttempts ?? defaultOptions.attempts,
    jobId: job.id,
  });
  return prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
}

export async function addRecurringJobs() {
  await getBackgroundQueue().upsertJobScheduler('evidence-expiry-daily', { pattern: '0 3 * * *' }, {
    name: 'evidence.expiry',
    data: { type: 'evidence.expiry' },
    opts: defaultOptions,
  });
}

export async function queueHealth() {
  const redis = getQueueConnection();
  const response = await redis.ping();
  return { status: response === 'PONG' ? 'ok' : 'unavailable', queue: BACKGROUND_QUEUE_NAME };
}

export async function closeQueueConnections() {
  await queue?.close();
  queue = undefined;
  await connection?.quit();
  connection = undefined;
}