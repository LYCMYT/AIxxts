# 开发环境

## 本机基线

已检查当前机器：

- Node.js: 24.16.0
- npm: 11.10.0
- pnpm: 11.7.0
- Git: 2.52.0.windows.1

## 初始化

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm check:env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

默认开发服务地址：

```text
http://127.0.0.1:3000
```

健康检查：

```text
http://127.0.0.1:3000/api/health
```

## 环境变量

`.env.example` 只放非密钥样例。真实密钥写入 `.env.local` 或部署环境变量，不提交 Git。

关键变量：

- `DATABASE_URL`: SQLite 文件地址，默认 `file:./data/dev.db`
- `APP_BASE_URL`: 本地或线上访问地址
- `SESSION_SECRET`: 登录 session 密钥，生产环境必须替换
- `LLM_BASE_URL`: OpenAI-compatible API base URL
- `LLM_API_KEY`: LLM API key
- `LLM_MODEL`: 每日精选模型，当前示例为 `deepseek-v4-flash`
- `YOUTUBE_API_KEY`: YouTube Data API key

`pnpm db:migrate` 会先执行 `db:prepare`，自动创建本地 SQLite 目录和空文件，避免 Prisma 7 在空文件不存在时初始化失败。

## 调度建议

本地开发阶段手动执行任务脚本。部署后建议：

- 采集任务：每 30-60 分钟执行一次。
- 每日精选：每天 08:00 执行一次。
- 任务入口保持幂等，重复执行不应产生重复精选。

Windows 自托管可用 Task Scheduler；WSL2 内可用 cron 或 systemd timer。
