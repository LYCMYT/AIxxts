import { getDigestArchive } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getDigestArchive();

  return Response.json(data);
}
