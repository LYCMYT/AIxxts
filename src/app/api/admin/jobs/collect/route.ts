import { runCollectJob } from "@/server/jobs/collect";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const summary = await runCollectJob();

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
