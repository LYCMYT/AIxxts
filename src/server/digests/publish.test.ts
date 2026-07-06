import assert from "node:assert/strict";
import test from "node:test";
import { DigestPublishError, publishDailyDigest } from "./publish";

type FakeDigestStatus = "DRAFT" | "PUBLISHED" | "FAILED";

type FakeDigest = {
  id: string;
  digestDate: string;
  status: FakeDigestStatus;
  _count: {
    items: number;
  };
};

type FindUniqueArgs = {
  where: {
    digestDate: string;
  };
};

type UpdateArgs = {
  where: {
    digestDate: string;
  };
  data: {
    status: FakeDigestStatus;
  };
};

function createDigestDb(initialDigest: FakeDigest | null) {
  let digest = initialDigest;
  let updateCount = 0;

  return {
    db: {
      dailyDigest: {
        async findUnique(args: FindUniqueArgs) {
          return digest?.digestDate === args.where.digestDate ? digest : null;
        },
        async update(args: UpdateArgs) {
          if (!digest || digest.digestDate !== args.where.digestDate) {
            throw new Error("digest not found");
          }

          updateCount += 1;
          digest = {
            ...digest,
            status: args.data.status,
          };

          return digest;
        },
      },
    },
    get digest() {
      return digest;
    },
    get updateCount() {
      return updateCount;
    },
  };
}

test("publish daily digest rejects invalid digestDate", async () => {
  const db = {
    dailyDigest: {
      async findUnique() {
        throw new Error("database should not be queried for an invalid date");
      },
      async update() {
        throw new Error("database should not be updated for an invalid date");
      },
    },
  };

  await assert.rejects(
    () => publishDailyDigest("2026-02-30", db),
    (error) =>
      error instanceof DigestPublishError &&
      error.statusCode === 400 &&
      error.code === "INVALID_DATE",
  );
});

test("publish daily digest returns not found when no digest exists for the date", async () => {
  const { db } = createDigestDb(null);

  await assert.rejects(
    () => publishDailyDigest("2026-07-06", db),
    (error) =>
      error instanceof DigestPublishError &&
      error.statusCode === 404 &&
      error.code === "NOT_FOUND",
  );
});

test("publish daily digest updates a draft digest to published", async () => {
  const store = createDigestDb({
    id: "digest-1",
    digestDate: "2026-07-06",
    status: "DRAFT",
    _count: {
      items: 12,
    },
  });

  const result = await publishDailyDigest("2026-07-06", store.db);

  assert.equal(result.digestDate, "2026-07-06");
  assert.equal(result.status, "PUBLISHED");
  assert.equal(result.publishedCount, 1);
  assert.equal(result.selectedCount, 12);
  assert.equal(store.digest?.status, "PUBLISHED");
});

test("publish daily digest rejects failed digests", async () => {
  const store = createDigestDb({
    id: "digest-2",
    digestDate: "2026-07-06",
    status: "FAILED",
    _count: {
      items: 0,
    },
  });

  await assert.rejects(
    () => publishDailyDigest("2026-07-06", store.db),
    (error) =>
      error instanceof DigestPublishError &&
      error.statusCode === 409 &&
      error.code === "FAILED_DIGEST",
  );
  assert.equal(store.digest?.status, "FAILED");
});

test("publish daily digest returns published result when already published", async () => {
  const store = createDigestDb({
    id: "digest-3",
    digestDate: "2026-07-06",
    status: "PUBLISHED",
    _count: {
      items: 8,
    },
  });

  const result = await publishDailyDigest("2026-07-06", store.db);

  assert.equal(result.digestDate, "2026-07-06");
  assert.equal(result.status, "PUBLISHED");
  assert.equal(result.publishedCount, 1);
  assert.equal(result.selectedCount, 8);
  assert.equal(store.updateCount, 0);
});
