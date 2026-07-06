# 技术栈决策

## 结论

MVP 采用单体全栈架构：

- 前端 / 后端：Next.js App Router + TypeScript
- 样式：Tailwind CSS
- 数据库：SQLite
- ORM / Migration：Prisma
- 定时任务：独立 Node.js 脚本，由系统级计划任务触发
- LLM：OpenAI-compatible 客户端配置，当前默认使用 DeepSeek API，可替换为 Qwen / OpenRouter / OpenAI 等兼容接口
- 采集：RSS parser + YouTube Data API；后续通过 source adapter 扩展
- 部署：自托管 Node.js 进程 + Caddy 反向代理
- 访问控制：当前取消登录，开放预览；保留轻量账号密码 + HttpOnly session cookie 代码，后续可恢复管理员/只读角色

## 为什么这样选

### Next.js App Router

需求同时包含网页展示、轻量 API、内部管理页和服务器端渲染。Next.js 可以减少前后端分裂成本，适合团队内部小型平台。当前配置使用 `output: "standalone"`，便于自托管部署。

### SQLite + Prisma

MVP 数据量主要是候选内容、精选结果、数据源配置和用户表，SQLite 足够。Prisma 负责 schema、migration 和类型安全。后续迁移 PostgreSQL 时可以保留大部分应用层接口。

### 系统级定时任务

采集和每日生成不应绑在网页请求生命周期里。MVP 使用 `pnpm job:collect`、`pnpm job:daily` 这类脚本，再由 Windows Task Scheduler、WSL cron 或 systemd timer 调度。这样比把 node-cron 常驻在 Next.js 进程里更可控。

### OpenAI-compatible LLM 接口

PRD 提到 Qwen 或其他模型；当前项目已按 DeepSeek OpenAI-compatible API 配置默认示例。使用兼容 OpenAI Chat Completions 风格的配置项可以降低供应商绑定：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

业务层只依赖内部 `llmClient` 抽象。

## 目录原则

```text
src/app/                 Next.js 页面和 route handlers
src/server/              只在服务端运行的业务代码
src/server/collectors/   数据源采集适配器
src/server/jobs/         定时任务入口
src/server/ranking/      LLM 排序与解读
src/server/db/           Prisma client 和数据访问
prisma/                  数据模型和迁移
docs/                    项目文档
```

## 暂缓引入

- Redis：MVP 不需要队列和缓存集群。
- PostgreSQL：数据规模扩大或并发写入明显增加后再迁移。
- 企业 SSO：第一阶段不接入；如后续恢复权限控制，先使用已保留的轻量账号体系。
- 商业社媒数据 SDK：待预算和供应商确认后再接入。
