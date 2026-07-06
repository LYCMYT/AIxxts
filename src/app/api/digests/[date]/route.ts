import { getDigestByDate } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const digest = await getDigestByDate(date);

  return Response.json({
    digest,
  });
}
