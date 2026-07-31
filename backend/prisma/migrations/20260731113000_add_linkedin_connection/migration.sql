CREATE TABLE "LinkedInConnection" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "linkedInId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "name" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LinkedInConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LinkedInConnection_candidateId_key" ON "LinkedInConnection"("candidateId");
CREATE UNIQUE INDEX "LinkedInConnection_linkedInId_key" ON "LinkedInConnection"("linkedInId");
ALTER TABLE "LinkedInConnection" ADD CONSTRAINT "LinkedInConnection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
