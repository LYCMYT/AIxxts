import { getAdminJobs } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAdminJobs();

  return Response.json(data);
}
