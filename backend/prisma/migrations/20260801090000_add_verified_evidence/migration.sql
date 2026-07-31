CREATE TABLE "Evidence" (
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

CREATE INDEX "Evidence_candidateId_status_idx" ON "Evidence"("candidateId", "status");
CREATE INDEX "Evidence_source_status_idx" ON "Evidence"("source", "status");
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
