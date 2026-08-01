-- The first production database was initialized before the evidence migration
-- existed. Bootstrap the prerequisite table here as well so both those older
-- databases and a clean database can apply the migration safely.
DO $$ BEGIN CREATE TYPE "Visibility" AS ENUM ('PRIVATE','RECRUITERS','PUBLIC'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EvidenceStatus" AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "VerificationDecision" AS ENUM ('VERIFIED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED','APPLIED','SCREENING','INTERVIEW','OFFER','REJECTED','WITHDRAWN','IGNORED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AttachmentScanStatus" AS ENUM ('PENDING','CLEAN','FAILED','QUARANTINED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Evidence" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "provider" TEXT,
  "title" TEXT NOT NULL,
  "issuer" TEXT,
  "referenceUrl" TEXT,
  "referenceId" TEXT,
  "issuedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'pending',
  "score" DOUBLE PRECISION,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Evidence_candidateId_status_idx" ON "Evidence"("candidateId", "status");
CREATE INDEX IF NOT EXISTS "Evidence_source_status_idx" ON "Evidence"("source", "status");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Evidence_candidateId_fkey') THEN
    ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Evidence' AND column_name = 'status' AND udt_name <> 'EvidenceStatus'
  ) THEN
    ALTER TABLE "Evidence" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Evidence" ALTER COLUMN "status" TYPE "EvidenceStatus" USING CASE lower("status"::text) WHEN 'verified' THEN 'VERIFIED'::"EvidenceStatus" WHEN 'rejected' THEN 'REJECTED'::"EvidenceStatus" WHEN 'expired' THEN 'EXPIRED'::"EvidenceStatus" ELSE 'DRAFT'::"EvidenceStatus" END;
  END IF;
END $$;
ALTER TABLE "Evidence" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "description" TEXT, ADD COLUMN IF NOT EXISTS "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE', ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "submittedBy" TEXT;
CREATE TABLE "CandidateProfile" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL UNIQUE,"headline" TEXT,"phone" TEXT,"website" TEXT,"visibility" "Visibility" NOT NULL DEFAULT 'RECRUITERS',"publishedAt" TIMESTAMP(3),"draftJson" TEXT,"projectsJson" TEXT,"credentialsJson" TEXT,"workHistoryJson" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "CandidateProfile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE);
CREATE TABLE "CandidateLink" ("id" TEXT PRIMARY KEY,"profileId" TEXT NOT NULL,"label" TEXT NOT NULL,"url" TEXT NOT NULL,"provider" TEXT,"isPublic" BOOLEAN NOT NULL DEFAULT true,"syncStatus" TEXT NOT NULL DEFAULT 'manual',"lastSyncedAt" TIMESTAMP(3),CONSTRAINT "CandidateLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE,CONSTRAINT "CandidateLink_profileId_url_key" UNIQUE("profileId","url"));
CREATE TABLE "RoadmapItem" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT,"dueAt" TIMESTAMP(3),"completedAt" TIMESTAMP(3),"position" INTEGER NOT NULL DEFAULT 0,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "RoadmapItem_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE);
CREATE INDEX "RoadmapItem_candidateId_position_idx" ON "RoadmapItem"("candidateId","position");
CREATE TABLE "Resume" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"name" TEXT NOT NULL,"template" TEXT NOT NULL DEFAULT 'modern',"activeVersionId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Resume_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE);
CREATE TABLE "ResumeVersion" ("id" TEXT PRIMARY KEY,"resumeId" TEXT NOT NULL,"version" INTEGER NOT NULL,"contentJson" TEXT NOT NULL,"attachmentId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ResumeVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE,CONSTRAINT "ResumeVersion_resumeId_version_key" UNIQUE("resumeId","version"));
CREATE TABLE "Job" ("id" TEXT PRIMARY KEY,"title" TEXT NOT NULL,"company" TEXT NOT NULL,"location" TEXT,"description" TEXT,"applyUrl" TEXT,"isActive" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "JobApplication" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"jobId" TEXT NOT NULL,"status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',"notes" TEXT,"historyJson" TEXT NOT NULL DEFAULT '[]',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "JobApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE,CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE,CONSTRAINT "JobApplication_candidateId_jobId_key" UNIQUE("candidateId","jobId"));
CREATE TABLE "EvidenceReview" ("id" TEXT PRIMARY KEY,"evidenceId" TEXT NOT NULL,"reviewerId" TEXT NOT NULL,"reviewerName" TEXT,"decision" "VerificationDecision" NOT NULL,"reason" TEXT,"score" DOUBLE PRECISION,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "EvidenceReview_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE);
CREATE TABLE "VerificationRun" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"evidenceId" TEXT,"source" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'queued',"requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"completedAt" TIMESTAMP(3),"detail" TEXT,CONSTRAINT "VerificationRun_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE,CONSTRAINT "VerificationRun_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL);
CREATE TABLE "Attachment" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"evidenceId" TEXT,"storageKey" TEXT NOT NULL UNIQUE,"originalName" TEXT NOT NULL,"contentType" TEXT NOT NULL,"sizeBytes" INTEGER NOT NULL,"scanStatus" "AttachmentScanStatus" NOT NULL DEFAULT 'PENDING',"scanDetail" TEXT,"uploadedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Attachment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE,CONSTRAINT "Attachment_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL);
CREATE TABLE "Badge" ("id" TEXT PRIMARY KEY,"candidateId" TEXT NOT NULL,"label" TEXT NOT NULL,"description" TEXT,"awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"expiresAt" TIMESTAMP(3),CONSTRAINT "Badge_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE);
CREATE TABLE "AuditLog" ("id" TEXT PRIMARY KEY,"candidateId" TEXT,"actorId" TEXT NOT NULL,"action" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entityId" TEXT NOT NULL,"detail" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL);
CREATE INDEX "EvidenceReview_evidenceId_createdAt_idx" ON "EvidenceReview"("evidenceId","createdAt"); CREATE INDEX "VerificationRun_candidateId_status_idx" ON "VerificationRun"("candidateId","status"); CREATE INDEX "Attachment_candidateId_createdAt_idx" ON "Attachment"("candidateId","createdAt"); CREATE INDEX "AuditLog_candidateId_createdAt_idx" ON "AuditLog"("candidateId","createdAt");
