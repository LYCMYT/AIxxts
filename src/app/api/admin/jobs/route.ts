import { getAdminJobs } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const data = await getAdminJobs({
    jobs: {
      jobType: params.get("jobType"),
      page: params.get("page"),
      sourceId: params.get("sourceId"),
      status: params.get("status"),
    },
  });

  return Response.json(data);
}
