import { DigestPublishError, publishDailyDigest } from "@/server/digests/publish";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;

  try {
    const result = await publishDailyDigest(date);

    return Response.json(result);
  } catch (error) {
    if (error instanceof DigestPublishError) {
      return Response.json(
        {
          error: error.message,
        },
        {
          status: error.statusCode,
        },
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
