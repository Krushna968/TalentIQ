CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "BackgroundJob" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "candidateId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "error" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "deadLetterAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BackgroundJob_idempotencyKey_key" ON "BackgroundJob"("idempotencyKey");
CREATE INDEX "BackgroundJob_name_status_idx" ON "BackgroundJob"("name", "status");
CREATE INDEX "BackgroundJob_candidateId_createdAt_idx" ON "BackgroundJob"("candidateId", "createdAt");

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
  "syncFailures" BOOLEAN NOT NULL DEFAULT true,
  "evidenceDecisions" BOOLEAN NOT NULL DEFAULT true,
  "evidenceExpiry" BOOLEAN NOT NULL DEFAULT true,
  "pipelineEvents" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_candidateId_key" ON "NotificationPreference"("candidateId");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'in_app',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_candidateId_createdAt_idx" ON "Notification"("candidateId", "createdAt");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");