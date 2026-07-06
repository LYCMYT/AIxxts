# AI 行业情报聚合平台

Xone 团队内部使用的 AI / 大模型行业情报聚合与每日精选网页。

当前仓库处于项目启动阶段，已完成：

- PRD 深度分析与范围收敛
- MVP 技术栈确认
- 本地开发环境骨架配置
- 数据模型、采集任务、每日精选任务和前端工作台
- 登录拦截已按当前要求取消，网页可直接打开预览

## MVP 范围

Phase 1 只实现官方合规且路径清晰的闭环：

- RSS / 官方博客 / 开发者社区候选池
- YouTube Data API 候选池
- 每日固定时间生成 Top 10-20 精选
- 每条精选附 1-2 句基于原文的 AI 解读
- 首页展示当天精选
- 日期回看历史精选
- 开发进度页展示已完成内容和下一步计划

Twitter/X、抖音、小红书作为后续阶段保留接口边界，不进入 MVP 默认开发范围。

## 常用命令

```powershell
pnpm install
pnpm check:env
pnpm db:generate
pnpm db:migrate
pnpm job:collect
pnpm job:daily
pnpm job:enrich-articles
pnpm job:translate
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## 当前访问方式

当前版本取消登录，首页、历史回看、管理后台、开发进度和相关数据 API 都可直接访问：

```text
http://127.0.0.1:3000
http://127.0.0.1:3000/progress
```

认证相关代码和 `seed:admin` 脚本暂时保留，后续如果重新要求团队权限控制，可以在现有 session 基础上恢复。

## 文档入口

- [PRD 分析](docs/01-prd-analysis.md)
- [技术栈决策](docs/02-tech-stack.md)
- [开发环境](docs/03-development-environment.md)
- [架构设计](docs/04-architecture.md)
- [产品设计方案](docs/05-product-design.md)
- [GitHub 项目窗口设计](docs/06-github-window-design.md)
- [前端设计审查](docs/07-frontend-design-audit.md)
- [前端技能选择](docs/08-skill-selection.md)
- [部署与运行](docs/09-operations.md)
- [采集任务闭环](docs/09-collection-job.md)
- [每日精选 LLM 方案](docs/09-daily-ranking-llm.md)
- [原文正文抓取与清洗](docs/12-article-extraction.md)
