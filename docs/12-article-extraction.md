# 原文正文抓取与清洗

本文档记录当前 MVP 的原文正文抓取策略。目标是让每日精选详情页优先展示站内可读的正文中文版本，而不是只展示标题、摘要或外链。

## 触发位置

- 采集任务：`pnpm job:collect` 在写入候选池前，会对缺少有效正文的普通网页候选做一次轻量抓取和清洗。
- 每日任务：`pnpm job:daily` 在每日精选生成成功后，会先运行正文回填，再运行中文翻译，确保翻译基于最新正文。
- 手动回填：`pnpm job:enrich-articles -- --date=YYYY-MM-DD --limit=20` 可对指定日期的精选内容补抓正文。
- 管理后台：`/admin` 的任务控制区可触发正文回填和翻译补齐；对应 API 为 `/api/admin/jobs/enrich-articles` 和 `/api/admin/jobs/translate`。

## 清洗规则

- 只抓取 `http` / `https` 页面，且响应类型需要是 HTML 或 XHTML。
- 自动移除 `script`、`style`、`nav`、`header`、`footer`、`aside`、`form`、`iframe` 等页面噪音。
- 优先读取 `article`，其次读取 `main`、内容型 `section`，最后回退到 `body`。
- 正文过短或只有元数据的内容会被丢弃，避免把 Hacker News 这类“Article URL / Comments URL / Points”元信息当作正文。
- YouTube、GitHub 这类不适合用普通网页正文解析的来源会跳过正文抓取，继续使用各自采集器提供的结构化字段。

## 翻译缓存

手动或自动回填到新的 `contentText` 后，会清空该候选的 `translatedSummary`、`translatedContent` 和 `translatedAt`。后续 `job:translate` 会重新生成中文详情，避免页面继续展示旧摘要翻译。

## 当前边界

当前实现不绕过登录墙、付费墙、反爬限制或 robots 层面的访问限制。抓取失败时保留原候选内容，不阻断采集、每日精选生成或翻译任务。
