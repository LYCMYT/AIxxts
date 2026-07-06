import {
  ArrowClockwise,
  FileText,
  Play,
  Translate,
} from "@phosphor-icons/react";

export type AdminJobActionKind = "daily" | "collect" | "enrichArticles" | "translate";

export const adminJobActions = [
  {
    kind: "daily",
    label: "重跑每日精选",
    runningLabel: "正在重跑每日精选",
    url: "/api/admin/jobs/daily",
    icon: ArrowClockwise,
    tone: "primary",
    usesDigestDate: true,
  },
  {
    kind: "collect",
    label: "执行采集",
    runningLabel: "正在执行采集",
    url: "/api/admin/jobs/collect",
    icon: Play,
    tone: "secondary",
    usesDigestDate: false,
  },
  {
    kind: "enrichArticles",
    label: "正文回填",
    runningLabel: "正在抓取原文正文",
    url: "/api/admin/jobs/enrich-articles",
    icon: FileText,
    tone: "secondary",
    usesDigestDate: true,
  },
  {
    kind: "translate",
    label: "翻译补齐",
    runningLabel: "正在补齐中文详情",
    url: "/api/admin/jobs/translate",
    icon: Translate,
    tone: "secondary",
    usesDigestDate: true,
  },
] as const;
