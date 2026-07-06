import { jobErrorResponse, readAdminJobOptions } from "@/server/admin/job-options";
import { runArticleEnrichmentJob } from "@/server/jobs/enrich-articles";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const options = await readAdminJobOptions(request);
    const summary = await runArticleEnrichmentJob({
      digestDate: options.digestDate,
      limit: options.limit,
      selectedOnly: options.selectedOnly,
    });

    return Response.json(summary);
  } catch (error) {
    return jobErrorResponse(error);
  }
}
