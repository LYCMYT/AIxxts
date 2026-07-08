import { jobErrorResponse, readAdminJobOptions } from "@/server/admin/job-options";
import { runTopicBackfillJob } from "@/server/jobs/backfill-topics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const options = await readAdminJobOptions(request);
    const summary = await runTopicBackfillJob({
      digestDate: options.digestDate,
      force: options.force,
      limit: options.limit,
      selectedOnly: options.selectedOnly,
    });

    return Response.json(summary);
  } catch (error) {
    return jobErrorResponse(error);
  }
}
