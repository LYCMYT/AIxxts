# 市场竞品调研与产品优化方案

日期：2026-07-07

## 1. 设计读法

AIxxts 不是通用资讯站，也不是重型 BI 或对外营销页面。它更接近团队内部的 AI 行业情报工作台：每天先帮助成员快速扫清“今天最值得看什么”，再允许管理员维护来源、任务和质量。

设计取向：

- `DESIGN_VARIANCE: 3`：稳定、克制、可预测。
- `MOTION_INTENSITY: 2`：只保留 hover、focus、保存中、任务执行中等必要反馈。
- `VISUAL_DENSITY: 7`：阅读端中等密度，管理端中高密度。
- 视觉基线：继续沿用 Apple 风格内部产品 UI，浅灰画布、白色实体表面、单一蓝色动作色、细边框、低阴影、强对齐。

## 2. 竞品与模式调研

### 2.1 Feedly / Feedly AI

参考：

- [Feedly AI](https://feedly.com/ai)
- [Getting Started with Feedly](https://docs.feedly.com/article/523-getting-started-with-feedly)
- [Guide to Automated Newsletters](https://docs.feedly.com/article/692-guide-to-automated-newsletters)

可借鉴点：

- AI Feeds 把“主题、公司、趋势”变成可长期追踪的对象，而不是只维护来源列表。
- 机器学习负责从大量来源中优先筛出值得看的内容。
- 自动 Newsletter 把 Team Boards、AI Feeds、Folders 转成定期发送的团队简报，并提供模板和效果数据。

对 AIxxts 的启发：

- 数据源之外需要增加“主题视图 / Watchlist”，例如“模型发布”“AI Agent”“OpenAI”“国产大模型”“AI 编程工具”。
- 每日精选之外，应该有“订阅式简报发送”和“团队阅读效果”。
- 管理后台不能只管理来源，还要管理主题和筛选规则。

### 2.2 AlphaSense

参考：

- [AlphaSense Platform](https://www.alpha-sense.com/platform/)
- [Smart Summaries](https://help.alpha-sense.com/hc/en-us/articles/41669307479443-Get-Instant-Insights-and-Save-Time-with-Smart-Summaries)
- [Monitoring Tools in AlphaSense](https://help.alpha-sense.com/hc/en-us/articles/41815509396371-Maximizing-Your-Monitoring-Tools-in-AlphaSense)

可借鉴点：

- 把搜索、监控、Dashboard、Alert、AI 摘要放在一个研究流程中。
- AI 摘要强调可验证来源和引用，避免用户无法判断结论来源。
- Dashboard 和 Alert 面向持续监控，不只是一次性日报。

对 AIxxts 的启发：

- 详情页需要“证据侧栏”：原文链接、来源、采集时间、互动数据、LLM 评分理由、关联报道。
- LLM 输出需要可追溯：prompt 版本、输入材料、生成时间、是否逐句翻译。
- 后续可增加“保存搜索 / 保存主题 / 提醒规则”，把 AIxxts 从日报变成持续监控工作台。

### 2.3 Techmeme

参考：

- [Techmeme About](https://www.techmeme.com/about)
- [Techmeme Leaderboards](https://www.techmeme.com/lb)
- [Techmeme 首页](https://www.techmeme.com/)

可借鉴点：

- 首页不是卡片墙，而是高度可扫读的新闻聚合版面。
- 重要事件会把主报道、社交评论、论坛讨论放在同一个上下文里。
- Leaderboards 用来识别在某个主题里更活跃、更有影响力的作者和媒体。

对 AIxxts 的启发：

- 同一事件的多源报道应该合并成“事件簇”，不是重复出现在每日精选里。
- 详情页应显示“相关来源 / 讨论入口 / 同事件补充报道”。
- 管理后台可以增加“来源影响力榜”和“高质量来源候选”。

### 2.4 NewsWhip Spike

参考：

- [NewsWhip Spike](https://www.newswhip.com/spike-real-time-media-monitoring/)
- [Real-time Prediction](https://www.newswhip.com/prediction/)
- [NewsWhip Spike Features](https://www.newswhip.com/features/)

可借鉴点：

- 用实时内容流、时间线和预测互动判断“现在什么重要、接下来什么可能重要”。
- Predictive Alerts 和 AI Digests 只在需要时把信号推给团队。
- 关注 engagement velocity，而不是只看静态点赞或播放量。

对 AIxxts 的启发：

- 排序维度应增加“热度速度”：短时间内互动增长、跨源讨论增量、重复报道数量。
- 每日精选之外，可以增加“今日升温中”小模块，展示可能进入明天精选的候选。
- 管理后台任务页可以显示候选池增长时间线。

### 2.5 Brandwatch / Social Listening

参考：

- [Brandwatch Listen](https://www.brandwatch.com/products/listen/)
- [What is social listening](https://www.brandwatch.com/social-media-glossary/social-listening/)
- [Introduction to Listen](https://social-media-management-help.brandwatch.com/en/articles/12767960-introduction-to-listen)

可借鉴点：

- 保存搜索、Boolean 查询、多语言、历史数据、AI alerts、情绪和主题分析是社媒监听产品的核心。
- 查询和仪表盘是组织级资产，不只是个人临时搜索。

对 AIxxts 的启发：

- Phase 2/3 若接 Twitter/X、抖音、小红书，不应直接把全量内容倒入日报；需要先抽象成“平台监听规则”。
- 查询规则要可视化配置：关键词、排除词、来源类型、语言、时间窗口、最低热度。
- 社媒数据需要区分“监控个体提及”和“长期趋势洞察”，避免日报被噪声污染。

### 2.6 Crayon

参考：

- [Crayon Competitive Intelligence Software](https://www.crayon.co/)
- [Dynamic Battlecards](https://www.crayon.co/blog/battlecard-dynamic-tiles)

可借鉴点：

- 竞品情报的价值不只是收集，而是把信息转成动态 Battlecards、提醒和可行动材料。
- 动态内容需要持续更新、可衡量使用情况、面向不同团队推送。

对 AIxxts 的启发：

- 我们暂不做深度竞品报告，但可以做“素材卡片”：演讲素材、客户案例线索、模型发布记录。
- 每条精选可以增加“可用于：演讲 / 客户材料 / 产品跟进 / 仅阅读”的内部标签。
- 后续增加团队反馈：收藏、标记有用、复制摘要、加入素材库。

### 2.7 Exploding Topics

参考：

- [Exploding Topics](https://explodingtopics.com/)
- [Exploding Topics Platform](https://explodingtopics.com/platform)

可借鉴点：

- 趋势产品把“主题”做成对象，带历史曲线、增长率、渠道来源、相关主题和 API。
- 它强调发现早期信号，而不是只展示已经爆发的热点。

对 AIxxts 的启发：

- 增加“主题雷达”：AI Agent、AI IDE、多模态、开源模型、AI 硬件等主题的近期热度。
- 对主题维护历史快照：近 7 天候选数、精选数、来源数、热度分变化。
- 今日精选页右侧可以放“升温主题”，不打断统一排序列表。

### 2.8 Readwise Reader

参考：

- [Readwise Reader Feed docs](https://docs.readwise.io/reader/docs/faqs/feed)
- [Reader public beta update](https://readwise.io/reader/update-april2024)

可借鉴点：

- RSS、Newsletter、文章、PDF 等内容统一进入阅读工作流。
- Filtered Views 是核心组织方式，允许用户动态建立自己的阅读视图。
- AI summary prompt 可自定义，适合不同阅读目的。

对 AIxxts 的启发：

- 团队成员需要“已读 / 稍后看 / 收藏 / 复制摘要”这类轻量阅读状态。
- 后续可以增加“我的视图”：只看模型发布、只看视频、只看国产大模型、只看未读。
- 翻译和摘要 prompt 应记录版本，便于未来切换“逐句翻译 / 简短摘要 / 演讲素材化”模式。

## 3. 当前产品差距

### 3.1 已有优势

- 已有真实采集来源、候选池、每日精选、站内详情、逐句重译、原文正文回填。
- 管理后台已经从长页面优化成单模块导航，基础维护入口清晰。
- 普通使用界面与管理后台已拆开，符合内部产品角色分离。
- 后台已有数据源健康、任务状态、手动候选、发布草稿等必要动作。

### 3.2 主要短板

1. 阅读端仍偏“日报列表”，缺少可持续使用的阅读状态。
2. 今日精选缺少“为什么入选”的可解释信号分层。
3. 详情页还可以更像证据页：来源、原文、翻译、LLM 依据、相关报道应更清楚。
4. 历史回看缺少搜索、主题筛选和跨日期趋势感。
5. 管理后台仍偏 CRUD，缺少规则配置、任务时间线、来源质量和重跑策略。
6. 数据模型还没有主题标签、事件簇、用户阅读状态、提醒规则、prompt 版本。
7. 暂无主动提醒，团队成员需要主动打开页面，错过当天容易漏看。

## 4. 前端优化方案

### 4.1 全局信息架构

建议保留两个入口：

- 普通阅读端：`/`、`/digests`、`/digests/[date]`、`/items/[id]`、未来 `/search`。
- 管理端：`/admin`，内部再按模块导航，不出现在普通导航里。

新增前端概念：

- 今日简报：顶部显示生成状态、发布时间、候选池、精选数、翻译完成率、下一次任务时间。
- 统一精选列表：默认仍按 LLM 综合排序，不按来源分区。
- 快速视图：全部、重大发布、社区热议、工具论文、公司动态。它是过滤器，不改变默认统一排序。
- 主题雷达：右侧或顶部次级模块，显示今日升温主题和来源分布。
- 阅读状态：未读、已读、稍后看、收藏。

### 4.2 首页 `/`

桌面布局：

- 顶部：紧凑标题区，不做营销 hero。
- 左侧主列：每日精选列表，宽度优先给标题和解读。
- 右侧信息栏：今日主题、来源分布、任务状态、下一次生成时间。

精选卡片字段：

- 排名。
- 标题。
- 来源、发布时间、来源类型。
- 1 到 2 句 AI 解读。
- 入选信号 chips：影响力、社区热度、多源报道、新鲜度。
- 站内阅读主操作。
- 原文链接次操作。
- 翻译状态：已逐句翻译 / 仅摘要 / 待翻译。

视觉规则：

- 卡片高度稳定，避免一条内容变成过大的海报卡。
- 排名列固定宽度。
- 来源和时间使用一行 metadata，不和标题争视觉焦点。
- 右侧信息栏只放辅助信息，不塞主要阅读内容。

### 4.3 详情页 `/items/[id]`

建议改成“阅读正文 + 证据侧栏”：

- 顶部：返回路径、标题、来源、发布时间。
- 主体左列：中文逐句翻译正文，保留段落和换行。
- 主体右列：证据侧栏。
- 底部：相关报道和同主题条目。

证据侧栏字段：

- 原文链接。
- 来源名称和类型。
- 采集时间。
- 所属日报日期和排名。
- LLM 影响力理由。
- LLM 热度理由。
- 原始互动数据。
- 翻译时间和 prompt 版本。
- 原始英文 / 中文翻译切换。

关键原则：

- 默认在站内读中文，不强跳原文。
- 原文永远可访问。
- AI 生成内容必须和来源证据在同页出现，减少“黑箱总结”感。

### 4.4 历史页 `/digests`

优化方向：

- 加搜索框：按标题、来源、主题、AI 解读搜索。
- 日期列表增加状态：已发布、草稿、失败、候选不足。
- 增加按主题过滤。
- 增加“本周回顾”入口：展示过去 7 天最常出现主题、公司、模型。

### 4.5 管理后台 `/admin`

现有单模块导航方向正确，继续优化为管理控制台：

- 概览：来源健康、失败任务、今日候选、翻译完成率、发布状态。
- 数据源：来源列表、批量启停、单源测试、抓取预览。
- 监听规则：主题、关键词、排除词、平台、语言、时间窗口。
- 候选池：最近采集候选、重复合并状态、手动候选审核。
- 任务：采集、正文回填、每日精选、逐句重译、发布草稿的时间线。
- 提醒：企业微信 / 邮件规则、发送记录、失败记录。
- 用户：角色、最近访问、阅读权限。

后台交互规则：

- 每个模块只显示当前内容，继续避免长页面。
- 表格工具栏固定在表格上方：搜索、筛选、主操作。
- 错误不只显示红色 badge，要能展开看到原因、最近失败时间、建议动作。
- 危险操作需要确认。
- 任务执行后直接写入 job run，并在当前模块刷新状态。

## 5. 功能优化方案

### 5.1 主题与标签体系

新增主题对象：

- 模型发布。
- 公司动态。
- AI Agent。
- AI 编程。
- 多模态。
- 开源模型。
- AI 基础设施。
- 监管政策。
- 投融资。

每条候选可以有多个标签，来源可以有默认标签，LLM 排序时也输出标签建议。前端用这些标签支持过滤、趋势和提醒。

### 5.2 事件簇与去重增强

当前 URL 去重不足以解决同一事件多源报道。建议增加事件簇：

- `CandidateCluster`：一个事件主实体。
- 候选项归属 cluster。
- 每个 cluster 选择主标题、主来源、补充来源。
- 每日精选优先展示 cluster，不重复展示同一事件。

前端效果：

- 卡片显示“3 个来源报道”。
- 详情页显示所有补充来源。
- 多源报道可提高可信度和影响力分。

### 5.3 排序解释增强

LLM 输出应拆成可展示字段：

- `impactReason`：为什么重要。
- `heatReason`：社区热度如何体现。
- `sourceReason`：来源可信度或多源支持。
- `riskNote`：是否只是传闻、预测、营销稿。
- `topicTags`：主题标签。

前端不需要展示所有字段，但详情页应该能展开查看。

### 5.4 提醒与分发

MVP 后优先做：

- 每日 08:00 生成后企业微信机器人提醒。
- 提醒内容只包含标题、Top 5、站内链接。
- 生成失败也提醒管理员。
- 发布草稿后可手动发送。

后续增强：

- 邮件版每日简报。
- 按主题订阅提醒。
- 高热度突发提醒。

### 5.5 搜索与保存视图

新增搜索能力：

- 全文搜索标题、摘要、翻译正文、AI 解读。
- 按来源、主题、日期、类型过滤。
- 保存视图：例如“OpenAI 过去 30 天”“AI 编程工具”“国产大模型”。

### 5.6 阅读状态与团队反馈

新增轻量协作：

- 已读 / 未读。
- 稍后看。
- 收藏。
- 复制摘要。
- 标记有用。
- 内部备注。

这些数据可以反向帮助排序：团队反复收藏的主题提高权重。

### 5.7 数据质量与运维

后台应增加：

- 来源成功率。
- 平均抓取耗时。
- 连续失败次数。
- 候选创建率。
- 重复率。
- 翻译完成率。
- 正文抓取成功率。
- 每日精选生成耗时。

这些指标比单纯任务日志更适合管理员判断系统是否健康。

## 6. 建议数据模型补充

优先级从高到低：

1. `TopicTag`
   - `id`
   - `name`
   - `slug`
   - `description`
   - `enabled`

2. `CandidateTopic`
   - `candidateId`
   - `topicId`
   - `confidence`
   - `source`: manual / llm / rule

3. `CandidateCluster`
   - `id`
   - `title`
   - `canonicalUrl`
   - `primaryCandidateId`
   - `createdAt`
   - `updatedAt`

4. `ReadState`
   - `userId`
   - `candidateId`
   - `readAt`
   - `savedAt`
   - `useful`
   - `note`

5. `SavedView`
   - `userId`
   - `name`
   - `filtersJson`

6. `AlertRule`
   - `name`
   - `channel`
   - `digestTime`
   - `filtersJson`
   - `enabled`

7. `PromptVersion`
   - `purpose`
   - `version`
   - `promptHash`
   - `description`

8. `SourceHealthSnapshot`
   - `sourceId`
   - `windowStart`
   - `successCount`
   - `failureCount`
   - `candidateCount`
   - `duplicateCount`

## 7. 分阶段实施路线

### Phase A：阅读端体验升级

目标：让首页和详情页更像“每天 5 分钟读完的情报简报”。

任务：

- 优化首页卡片字段和右侧主题雷达。
- 详情页改成中文正文 + 证据侧栏。
- 增加翻译状态和原文切换。
- 增加已读 / 稍后看 / 收藏的前端状态设计。

验收：

- 1440px 首屏能看到 Top 3 精选。
- 390px 卡片不横向溢出。
- 每条内容都能在站内进入详情阅读。
- 详情页能看到来源、原文、翻译和入选原因。

### Phase B：搜索、历史和主题体系

目标：从“今天日报”扩展为“可回查的团队知识库”。

任务：

- 建立 TopicTag。
- LLM 每日排序时输出 topic tags。
- 历史页增加搜索和主题过滤。
- 新增保存视图。

验收：

- 可以查找过去 30 天某个主题的所有精选。
- 可以保存一个主题视图。
- 历史页失败、草稿、已发布状态清楚。

### Phase C：提醒与分发

目标：避免团队成员漏看每日精选。

任务：

- 企业微信机器人提醒。
- 邮件简报模板。
- 发布草稿后手动发送。
- 生成失败管理员提醒。

验收：

- 每日精选发布后自动推送。
- 推送包含 Top 5 和站内链接。
- 失败任务能提醒管理员。

### Phase D：事件簇、趋势和质量评分

目标：降低重复内容，提高可信度和趋势判断能力。

任务：

- CandidateCluster。
- 多源报道合并。
- 来源影响力榜。
- 主题热度趋势。
- 热度速度评分。

验收：

- 同一事件不会重复占多个排名。
- 详情页显示补充来源。
- 管理后台能看到来源质量和趋势变化。

### Phase E：平台扩展

目标：决定是否进入 Twitter/X、抖音、小红书等高成本平台。

任务：

- Twitter/X 预算和采样策略。
- 抖音 / 小红书商业数据服务调研。
- 手动候选审核流。
- 平台监听规则抽象。

验收：

- 每个平台接入前都有成本、合规、质量评估。
- 不因为社媒噪声破坏每日精选质量。

## 8. 推荐下一批开发任务

建议下一步先做 Phase A，不要先做大规模新平台接入。

优先顺序：

1. 首页精选卡片升级：入选信号、翻译状态、站内阅读主操作。
2. 详情页证据侧栏：来源、原文、翻译、LLM 理由、相关报道。
3. 管理后台概览页：翻译完成率、正文抓取成功率、来源失败 Top 5。
4. 企业微信提醒最小闭环：发布后发 Top 5。
5. TopicTag 最小模型和 LLM 标签输出。

## 9. 设计验收清单

- 不做营销 hero。
- 首页默认仍是统一排序，不按来源分区。
- 管理后台继续独立入口。
- 所有主操作使用同一动作蓝。
- 卡片和表格使用同一半径规则。
- 状态色只用于真实状态。
- 长英文标题、长来源名、长中文翻译在 390px 不溢出。
- 详情页默认站内阅读，不强跳原文。
- AI 解读旁边必须能看到来源证据。
- 管理任务有执行中、成功、失败、重试和错误摘要状态。

## 10. 结论

AIxxts 不应该照搬 AlphaSense 或 Brandwatch 那种重型平台，也不应该变成 Feedly 式个人 RSS 阅读器。更合适的方向是：

- 阅读端学习 Techmeme 的高密度聚合、Feedly 的主题追踪、Readwise 的阅读工作流。
- 情报能力学习 AlphaSense 的证据可追溯、NewsWhip 的热度速度、Exploding Topics 的主题趋势。
- 管理端学习 Crayon 和 Brandwatch 的规则、告警、质量监控。

短期最有价值的优化不是接更多平台，而是把现有真实数据呈现成更清晰的“可读、可信、可回查、可提醒”的内部情报产品。
