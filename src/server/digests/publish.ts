export type DigestPublishErrorCode = "INVALID_DATE" | "NOT_FOUND" | "FAILED_DIGEST";

const digestPublishSelect = {
  id: true,
  digestDate: true,
  status: true,
  _count: {
    select: {
      items: true,
    },
  },
} as const;

type PublishableDigest = {
  id: string;
  digestDate: string;
  status: string;
  _count: {
    items: number;
  };
};

type DigestPublisherClient = {
  dailyDigest: {
    findUnique(args: {
      where: {
        digestDate: string;
      };
      select: typeof digestPublishSelect;
    }): Promise<PublishableDigest | null>;
    update(args: {
      where: {
        digestDate: string;
      };
      data: {
        status: "PUBLISHED";
      };
      select: typeof digestPublishSelect;
    }): Promise<PublishableDigest>;
  };
};

export type PublishDailyDigestResult = {
  digestDate: string;
  status: "PUBLISHED";
  publishedCount: number;
  selectedCount: number;
};

export class DigestPublishError extends Error {
  constructor(
    public readonly code: DigestPublishErrorCode,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "DigestPublishError";
  }
}

export async function publishDailyDigest(
  digestDate: string,
  db?: DigestPublisherClient,
): Promise<PublishDailyDigestResult> {
  validateDigestDate(digestDate);

  const client = db ?? (await getDefaultDigestPublisherClient());
  const digest = await client.dailyDigest.findUnique({
    where: {
      digestDate,
    },
    select: digestPublishSelect,
  });

  if (!digest) {
    throw new DigestPublishError("NOT_FOUND", `DailyDigest ${digestDate} was not found.`, 404);
  }

  if (digest.status === "PUBLISHED") {
    return publishedResult(digest);
  }

  if (digest.status === "DRAFT") {
    const updatedDigest = await client.dailyDigest.update({
      where: {
        digestDate,
      },
      data: {
        status: "PUBLISHED",
      },
      select: digestPublishSelect,
    });

    return publishedResult(updatedDigest);
  }

  if (digest.status === "FAILED") {
    throw new DigestPublishError(
      "FAILED_DIGEST",
      `DailyDigest ${digestDate} is FAILED and cannot be published.`,
      409,
    );
  }

  throw new Error("publishDailyDigest is not implemented.");
}

async function getDefaultDigestPublisherClient(): Promise<DigestPublisherClient> {
  const { prisma } = await import("@/server/db/prisma");

  return prisma as unknown as DigestPublisherClient;
}

function publishedResult(digest: PublishableDigest): PublishDailyDigestResult {
  return {
    digestDate: digest.digestDate,
    status: "PUBLISHED",
    publishedCount: 1,
    selectedCount: digest._count.items,
  };
}

function validateDigestDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new DigestPublishError("INVALID_DATE", "digestDate must use YYYY-MM-DD.", 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new DigestPublishError("INVALID_DATE", "digestDate is not a valid calendar date.", 400);
  }
}
