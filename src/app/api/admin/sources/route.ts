import { getAdminSources } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAdminSources();

  return Response.json(data);
}
