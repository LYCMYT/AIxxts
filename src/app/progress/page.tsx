import type { Metadata } from "next";
import { ProjectProgress } from "@/components/progress/project-progress";
import { getAdminDashboardData } from "@/server/admin/queries";
import { getDigestArchive } from "@/server/digests/queries";

export const metadata: Metadata = {
  title: "开发进度 | AI 行业每日精选",
  description: "AIxxts 当前开发完成项、运行状态和下一步计划",
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const [adminData, archive] = await Promise.all([getAdminDashboardData(), getDigestArchive()]);

  return <ProjectProgress adminData={adminData} archive={archive} />;
}
