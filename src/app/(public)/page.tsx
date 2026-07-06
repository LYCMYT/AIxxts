import { DigestHome } from "@/components/digest/digest-home";
import { getTodayPublishedDigestHome } from "@/server/digests/queries";

export const dynamic = "force-dynamic";

function currentDateLabel() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${Number(value("year"))}年${Number(value("month"))}月${Number(value("day"))}日`;
}

export default async function Home() {
  const digest = await getTodayPublishedDigestHome();

  return (
    <DigestHome
      candidateCount={digest?.candidateCount ?? 0}
      dateLabel={digest?.dateLabel ?? currentDateLabel()}
      generatedAt={digest?.generatedAt ?? "未生成"}
      items={digest?.items ?? []}
      lastSuccessDate={digest?.lastSuccessDate ?? "暂无成功日报"}
      selectedCount={digest?.selectedCount ?? 0}
      taskStatus={digest?.taskStatus ?? "未生成"}
    />
  );
}
