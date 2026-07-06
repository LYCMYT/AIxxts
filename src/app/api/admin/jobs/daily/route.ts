import { runDailyDigestJob } from "@/server/jobs/daily";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const digestDate = await readDigestDate(request);
    const summary = await runDailyDigestJob({
      digestDate,
    });

    return Response.json(summary);
  } catch (error) {
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

async function readDigestDate(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const value = (body as { digestDate?: unknown }).digestDate;

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
