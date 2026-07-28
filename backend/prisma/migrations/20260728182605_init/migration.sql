-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'candidate',
    "title" TEXT,
    "location" TEXT,
    "bio" TEXT,
    "githubConnected" BOOLEAN NOT NULL DEFAULT false,
    "talentScore" DOUBLE PRECISION,
    "githubScore" DOUBLE PRECISION,
    "hackathonScore" DOUBLE PRECISION,
    "certScore" DOUBLE PRECISION,
    "presentationScore" DOUBLE PRECISION,
    "openSourceScore" DOUBLE PRECISION,
    "socialScore" DOUBLE PRECISION,
    "status" TEXT,
    "radarData" TEXT,
    "signals" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubConnection" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "githubId" INTEGER,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "name" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "location" TEXT,
    "publicRepos" INTEGER,
    "followers" INTEGER,
    "following" INTEGER,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubRepo" (
    "id" TEXT NOT NULL,
    "githubConnectionId" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "homepage" TEXT,
    "language" TEXT,
    "topics" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL DEFAULT 0,
    "isFork" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "pushedAt" TIMESTAMP(3),
    "repoCreatedAt" TIMESTAMP(3),
    "repoUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubCommit" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "additions" INTEGER,
    "deletions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubRepoLanguage" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,

    CONSTRAINT "GithubRepoLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubLanguageSummary" (
    "id" TEXT NOT NULL,
    "githubConnectionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "totalBytes" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "repoCount" INTEGER NOT NULL,

    CONSTRAINT "GithubLanguageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GithubConnection_candidateId_key" ON "GithubConnection"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepo_githubId_key" ON "GithubRepo"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubCommit_repoId_sha_key" ON "GithubCommit"("repoId", "sha");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepoLanguage_repoId_language_key" ON "GithubRepoLanguage"("repoId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "GithubLanguageSummary_githubConnectionId_language_key" ON "GithubLanguageSummary"("githubConnectionId", "language");

-- AddForeignKey
ALTER TABLE "GithubConnection" ADD CONSTRAINT "GithubConnection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubRepo" ADD CONSTRAINT "GithubRepo_githubConnectionId_fkey" FOREIGN KEY ("githubConnectionId") REFERENCES "GithubConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubCommit" ADD CONSTRAINT "GithubCommit_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GithubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubRepoLanguage" ADD CONSTRAINT "GithubRepoLanguage_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GithubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubLanguageSummary" ADD CONSTRAINT "GithubLanguageSummary_githubConnectionId_fkey" FOREIGN KEY ("githubConnectionId") REFERENCES "GithubConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
