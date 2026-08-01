import { prisma } from '../lib/prisma.js';
import { enqueueBackgroundJob } from '../jobs/queue.js';

export async function getNotificationPreferences(candidateId: string) {
  return prisma.notificationPreference.upsert({
    where: { candidateId },
    create: { candidateId },
    update: {},
  });
}

export async function updateNotificationPreferences(candidateId: string, input: Record<string, unknown>) {
  return prisma.notificationPreference.upsert({
    where: { candidateId },
    create: { candidateId, ...input },
    update: input,
  });
}

export async function listNotifications(candidateId: string) {
  return prisma.notification.findMany({ where: { candidateId }, orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function createNotification(input: { candidateId: string; category: string; title: string; body: string; channel?: string }) {
  const notification = await prisma.notification.create({
    data: { candidateId: input.candidateId, category: input.category, title: input.title, body: input.body, channel: input.channel ?? 'in_app' },
  });
  await enqueueBackgroundJob({
    name: 'notification.deliver',
    payload: { type: 'notification.deliver', notificationId: notification.id },
    idempotencyKey: `notification:${notification.id}`,
    candidateId: input.candidateId,
  });
  return notification;
}

export async function deliverNotification(id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new Error('Notification not found');
  if (notification.channel !== 'in_app') throw new Error(`No ${notification.channel} delivery adapter is configured`);
  return prisma.notification.update({ where: { id }, data: { status: 'delivered', deliveredAt: new Date() } });
}