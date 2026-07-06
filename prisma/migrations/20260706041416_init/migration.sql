-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'READER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fetchIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CandidateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "canonicalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentText" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hotScore" REAL,
    "influenceScore" REAL,
    "rawEngagement" JSONB,
    "rawPayload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "duplicateOfId" TEXT,
    CONSTRAINT "CandidateItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateItem_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "CandidateItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyDigest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digestDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "llmRunId" TEXT,
    CONSTRAINT "DailyDigest_llmRunId_fkey" FOREIGN KEY ("llmRunId") REFERENCES "LlmRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DigestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digestId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "sourceSnapshot" TEXT NOT NULL,
    "urlSnapshot" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "score" REAL,
    "signals" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigestItem_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "DailyDigest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DigestItem_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LlmRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costCents" INTEGER,
    "promptHash" TEXT,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Source_enabled_type_idx" ON "Source"("enabled", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateItem_canonicalUrl_key" ON "CandidateItem"("canonicalUrl");

-- CreateIndex
CREATE INDEX "CandidateItem_publishedAt_idx" ON "CandidateItem"("publishedAt");

-- CreateIndex
CREATE INDEX "CandidateItem_sourceId_publishedAt_idx" ON "CandidateItem"("sourceId", "publishedAt");

-- CreateIndex
CREATE INDEX "CandidateItem_status_publishedAt_idx" ON "CandidateItem"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDigest_digestDate_key" ON "DailyDigest"("digestDate");

-- CreateIndex
CREATE UNIQUE INDEX "DigestItem_digestId_rank_key" ON "DigestItem"("digestId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "DigestItem_digestId_candidateId_key" ON "DigestItem"("digestId", "candidateId");

-- CreateIndex
CREATE INDEX "LlmRun_purpose_createdAt_idx" ON "LlmRun"("purpose", "createdAt");
