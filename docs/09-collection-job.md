# 采集任务闭环

MVP 采集任务由独立 Node.js 脚本触发，不绑定 Next.js 请求生命周期。

## 数据源

- RSS 类来源读取启用状态的 `RSS`、`OFFICIAL_BLOG`、`HACKER_NEWS`、`REDDIT` source，使用 `rss-parser` 拉取 feed。
- YouTube 来源读取 `YOUTUBE` source，配置存放在 `Source.config`。如果配置了 `YOUTUBE_API_KEY`，采集器使用 YouTube Data API `search.list` 做关键词搜索；如果未配置 key，采集器改用频道 RSS feed，例如 `{ "channelId": "UCXZCJLdBC09xxGZ6gcdrc6A", "keywords": ["AI", "model"], "maxResults": 15 }`。
- 无 key 的 YouTube RSS 模式只能覆盖默认频道池，不等同于全站关键词热点搜索。RSS feed 返回真实视频条目，关键词过滤只基于 feed 中可见的标题、作者和摘要字段。
- GitHub 来源读取 `GITHUB` source，使用 GitHub REST API。`mode: "search"` 会调用 repository search 并写入 star/fork/open issue 等热度信号；`mode: "releases"` 会读取指定仓库 releases 并补充仓库 star/fork 和 release 下载数。`GITHUB_TOKEN` 可选，无 token 也能抓公开数据，但速率限制更低。
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
