# 真实数据接入策略

更新时间：2026-07-06

## 当前结论

当前本地数据库不是假数据。开发库已有真实来源、真实候选和已生成日报；这次清理的是前端页面里的静态 mock/fallback 展示数据。清理后页面只读取数据库，数据库为空时展示真实空状态，不再用演示内容填充。

## 数据原则

1. 页面不内置演示条目、演示用户、演示来源或 `example.com` 链接。
2. 采集器只写入真实来源返回的内容，来源返回 0 条就保留空结果。
3. 没有 `LLM_API_KEY` 时，只对真实候选池做确定性规则排序，不生成外部事实。
4. 抖音、小红书等平台不得用非授权爬虫绕过平台限制。

## 第一优先级：可直接自动化

| 来源 | 接入方式 | 当前状态 | 说明 |
|---|---|---|---|
| AI 公司官方博客 | RSS/Atom | 已接入 | OpenAI、Google AI、Hugging Face 等可按源持续扩展 |
| 科技媒体 AI 栏目 | RSS/Atom | 已接入 | TechCrunch AI 已接入，后续可补机器之心、量子位、MIT Technology Review 等可用 RSS |
| Hacker News | HN RSS 或官方 Firebase API | 已接入 RSS | 适合开发者社区热度信号 |
| Reddit | RSS 或 Data API | 已接入 subreddit RSS | 先使用公开 RSS，若要更稳定的搜索和互动指标再申请 Data API |
| YouTube | 频道 RSS fallback + YouTube Data API `search.list` | 已接入 | 无 key 时采集默认 AI 频道池的真实 RSS；配置 `YOUTUBE_API_KEY` 后可升级为全站关键词搜索 |
| arXiv | 官方 RSS/API | 已加入默认来源 | `cs.AI`、`cs.CL`、`cs.LG` 作为无 key 的研究动态补充 |
| GitHub | REST Search API | 待做 | 可监测 AI repo、agent 框架、LLM 工具的 star/update/release 信号 |

参考资料：

- YouTube Data API search.list: https://developers.google.com/youtube/v3/docs/search/list
- YouTube channel ID lookup: https://developers.google.com/youtube/v3/docs/channels/list
- Hacker News official API: https://github.com/HackerNews/API
- Reddit Data API Wiki: https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki
- arXiv RSS feeds: https://info.arxiv.org/help/rss.html
- arXiv API manual: https://info.arxiv.org/help/api/user-manual.html
- GitHub REST API: https://docs.github.com/en/rest

## 第二优先级：需要 key、预算或权限

| 来源 | 接入方式 | 是否建议进入 MVP | 说明 |
|---|---|---|---|
| X / Twitter | X API recent search | 暂不默认开启 | 支持最近 7 天搜索，但读取按资源计费，需要先定预算上限 |
| 抖音 | 抖音开放平台关键词视频搜索 | 先做技术调研 | 官方文档存在关键词视频搜索能力，但需要创建关键词、申请能力，且只返回较短时间窗口，不能等同于全站热点 API |
| 小红书 | 小红书开放平台/服务市场 | 暂不自动接入 | 当前公开文档重点在电商、订单、商品、素材等商家场景；全站笔记热点/关键词监测需要另行确认权限或商业数据服务 |

参考资料：

- X recent search: https://docs.x.com/x-api/posts/search-recent-posts
- X pricing: https://docs.x.com/x-api/getting-started/pricing
- 抖音关键词视频搜索: https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/search-management/keywords-video-list/keywords-video
- 抖音搜索能力: https://developer.open-douyin.com/docs/resource/zh-CN/dop/ability/search-management/video
- 小红书开放平台文档: https://open.xiaohongshu.com/document/api

## 第三优先级：半自动补充

| 场景 | 方案 |
|---|---|
| 抖音、小红书短期无法自动接入 | 用管理后台手动录入真实链接、标题、摘要和发布时间 |
| 需要热点榜单但没有官方 API | 人工定期从官方网页工具或付费数据平台导出，再手动录入候选池 |
| 需要商业数据供应商 | 单独调研新榜、新红、蝉妈妈等是否提供 API、合同和合规条款 |

## 下一步开发顺序

1. 继续维护 YouTube 默认频道池，优先补团队认可的 AI 公司、研究者和开发者频道；如需全站搜索，再配置 `YOUTUBE_API_KEY`。
2. 补充中文科技媒体 RSS、AI 公司官方博客和 GitHub repo / release 信号，提高候选覆盖面。
3. 把管理后台的 source 保存、启停、重跑动作接入真实 API，减少后续改配置时对脚本的依赖。
4. 按预算决定 X / Twitter 是否进入 Phase 2。
5. 对抖音、小红书单独调研人工整理、官方权限或付费数据服务路径。
