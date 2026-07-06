import { DigestDayPage } from "@/components/history/digest-day-page";
import { getDigestByDate } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

export default async function DigestDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const digest = await getDigestByDate(date);

  return <DigestDayPage date={date} digest={digest} />;
}
