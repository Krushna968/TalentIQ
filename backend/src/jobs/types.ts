export const JOB_NAMES = {
  sourceSync: 'source.sync',
  webhookProcess: 'webhook.process',
  uploadScan: 'upload.scan',
  evidenceExpiry: 'evidence.expiry',
  reportExport: 'report.export',
  notificationDeliver: 'notification.deliver',
} as const;

export type BackgroundJobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export type BackgroundJobPayload =
  | { candidateId: string; provider: 'github'; type: 'source.sync' }
  | { provider: string; eventId: string; type: 'webhook.process' }
  | { attachmentId: string; candidateId: string; type: 'upload.scan' }
  | { type: 'evidence.expiry' }
  | { candidateId: string; reportId?: string; type: 'report.export' }
  | { notificationId: string; type: 'notification.deliver' };

export type EnqueueInput = {
  name: BackgroundJobName;
  payload: BackgroundJobPayload;
  idempotencyKey: string;
  candidateId?: string;
  maxAttempts?: number;
};