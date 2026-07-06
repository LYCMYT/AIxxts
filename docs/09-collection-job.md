# 采集任务闭环

MVP 采集任务由独立 Node.js 脚本触发，不绑定 Next.js 请求生命周期。

## 数据源

- RSS 类来源读取启用状态的 `RSS`、`OFFICIAL_BLOG`、`HACKER_NEWS`、`REDDIT` source，使用 `rss-parser` 拉取 feed。
- YouTube 来源读取 `YOUTUBE` source，配置存放在 `Source.config`，示例为 `{ "keyword": "AI agents", "regionCode": "US", "relevanceLanguage": "en", "maxResults": 10 }`。
- `YOUTUBE_API_KEY` 未配置时，YouTube source 会写入 `SKIPPED` JobRun，不会让整轮采集失败。
- 默认 seed 只放可机器读取的 XML/RSS 源。Anthropic 官方新闻页当前可访问但未暴露 RSS feed，后续如果要接入，建议单独做 HTML 页面采集器，不把固定 404 的 `https://www.anthropic.com/news/rss.xml` 写入默认源。

## 去重和任务记录

- URL 先做 canonicalize，再按 `CandidateItem.canonicalUrl` 唯一约束去重。
- 每个 source 每次采集都生成一条 `JobRun`，记录 `scannedCount`、`createdCount`、`skippedCount`、`status` 和错误摘要。
- source 完成后更新 `lastFetchedAt`。成功时清空 `lastError`，失败或跳过时保留原因。

## 本地运行

当前分支已在 `package.json` 提供任务脚本，可直接运行：

```powershell
pnpm seed:sources
pnpm job:collect
```

底层映射为：

```json
{
  "seed:sources": "tsx scripts/seed-sources.ts",
  "job:collect": "tsx scripts/run-collect.ts"
}
```
