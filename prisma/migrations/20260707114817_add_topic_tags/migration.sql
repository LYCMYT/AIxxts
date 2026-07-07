-- CreateTable
CREATE TABLE "TopicTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CandidateTopic" (
    "candidateId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "confidence" REAL,
    "source" TEXT NOT NULL DEFAULT 'ranking',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("candidateId", "topicId"),
    CONSTRAINT "CandidateTopic_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "TopicTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicTag_label_key" ON "TopicTag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "TopicTag_slug_key" ON "TopicTag"("slug");

-- CreateIndex
CREATE INDEX "CandidateTopic_topicId_idx" ON "CandidateTopic"("topicId");
