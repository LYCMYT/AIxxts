# 部署与运行

本文档覆盖 Phase 1.4 的本地运行、生产部署、定时任务、环境变量、SQLite 备份恢复和首次推送检查。当前仓库已存在的脚本以 `package.json` 为准；采集、每日精选和数据源 seed 都已提供独立 Node.js 入口。当前版本取消登录拦截，管理员 seed 仅作为后续恢复权限控制的保留脚本。

## 技术栈基线

- 应用：Next.js App Router + TypeScript。
- 样式：Tailwind CSS。
- 数据库：SQLite。
- ORM 和迁移：Prisma。
- 包管理：pnpm。
- 进程运行：Node.js 自托管进程。
- 反向代理：Caddy。
- 定时任务：Windows Task Scheduler 或 WSL cron 调用独立 Node.js 任务脚本。

## Windows 本地运行

在 PowerShell 中执行：

```powershell
Set-Location -LiteralPath "C:\Users\Administrator\Desktop\AIxxts"
pnpm install
Copy-Item .env.example .env.local
notepad .env.local
pnpm check:env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

默认访问地址：

```text
http://127.0.0.1:3000
```

当前 `pnpm dev` 使用 `next dev --webpack -H 127.0.0.1`。在本机 Windows + Node 24 环境下，Next 16 的默认 Turbopack dev server 启用 Proxy 后出现过 `JavaScript heap out of memory`，因此开发环境先固定使用 webpack dev server；生产构建仍使用 `pnpm build`。

健康检查地址：

```text
http://127.0.0.1:3000/api/health
```

管理后台预留的任务触发 API 当前不做登录校验，供开放预览版本和后续按钮接入：

```text
POST http://127.0.0.1:3000/api/admin/jobs/collect
POST http://127.0.0.1:3000/api/admin/jobs/daily
```

`/api/admin/jobs/collect` 复用 `runCollectJob()` 并返回采集 summary。`/api/admin/jobs/daily` 复用 `runDailyDigestJob()` 并返回每日精选生成 summary；请求体可留空，也可传入指定日期：

```json
{
  "digestDate": "2026-07-06"
}
```

本地模拟生产构建：

```powershell
Set-Location -LiteralPath "C:\Users\Administrator\Desktop\AIxxts"
pnpm build
$env:NODE_ENV = "production"
pnpm start
```

## WSL2 本地运行

推荐在 WSL2 内安装 Node.js 和 pnpm 后运行。若项目仍放在 Windows 目录，可通过 `/mnt/c` 访问：

```bash
cd /mnt/c/Users/Administrator/Desktop/AIxxts
pnpm install
cp .env.example .env.local
nano .env.local
pnpm check:env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

生产或长时间运行时，建议把项目和 SQLite 数据库放在 WSL2 Linux 文件系统内，例如 `~/apps/AIxxts`，减少 Windows 挂载目录的文件锁和 IO 抖动。

## 生产环境变量

生产环境变量写入服务器环境、`.env.local` 或进程管理器的安全变量存储。不要把真实密钥、真实管理员密码、生产数据库文件、`.env.local` 提交到 Git。

| 变量 | 是否敏感 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | 否 | 生产运行使用 `production`。 |
| `DATABASE_URL` | 否 | SQLite 文件地址，例如 `file:./data/prod.db`。生产文件应在持久化磁盘上。 |
| `APP_BASE_URL` | 否 | 对外访问地址，例如 `https://ai.example.com`。 |
| `SESSION_SECRET` | 是 | HttpOnly session 密钥，至少 32 字符，生产必须独立生成。 |
| `LLM_BASE_URL` | 否 | OpenAI-compatible API base URL。 |
| `LLM_API_KEY` | 是 | LLM API key，不允许提交。 |
| `LLM_MODEL` | 否 | 每日精选使用的模型名，例如 `qwen-plus`。 |
| `YOUTUBE_API_KEY` | 是 | YouTube Data API key，不允许提交。 |
| `X_API_BEARER_TOKEN` | 是 | 后续 X 接入预留，不允许提交。 |
| `ADMIN_EMAIL` | 否 | 当前不启用登录，仅作为后续管理员 seed 预留变量。 |
| `ADMIN_PASSWORD` | 是 | 当前不启用登录，仅作为后续管理员 seed 预留变量。 |

生成 `SESSION_SECRET` 示例：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 首次部署顺序

以下顺序不要跳步。生产迁移建议使用 `prisma migrate deploy`；本地开发可继续使用 `pnpm db:migrate`。

```powershell
Set-Location -LiteralPath "C:\Users\Administrator\Desktop\AIxxts"
pnpm install --frozen-lockfile
pnpm check:env
pnpm db:prepare
pnpm db:generate
pnpm prisma migrate deploy
pnpm seed:sources
pnpm job:collect
pnpm job:daily
pnpm build
$env:NODE_ENV = "production"
pnpm start
```

`pnpm job:collect` 和 `pnpm job:daily` 可作为首次部署后的冒烟验证；如果未配置 `YOUTUBE_API_KEY`，YouTube source 会记录为 `SKIPPED`，不影响 RSS 类来源采集。若后续重新启用登录，先设置 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`，再执行 `pnpm seed:admin`。

## Caddy 反向代理示例

`Caddyfile` 示例：

```caddyfile
ai.example.com {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		X-Frame-Options "SAMEORIGIN"
	}
}
```

部署要点：

- `APP_BASE_URL` 必须与 Caddy 对外域名一致。
- Node.js 应用只监听 `127.0.0.1:3000`，外部流量只经 Caddy 进入。
- Caddy 负责 TLS 证书申请和续期。
- 防火墙只开放 80 和 443，除非有明确运维需求，不开放 3000。

## Windows Task Scheduler 任务示例

确认 `.env.local`、数据库迁移、管理员 seed 和数据源 seed 已完成后，可用管理员 PowerShell 创建计划任务：

```powershell
$Project = "C:\Users\Administrator\Desktop\AIxxts"

schtasks /Create /F /TN "AIxxts Collect" /SC MINUTE /MO 30 /TR "powershell -NoProfile -ExecutionPolicy Bypass -Command ""Set-Location -LiteralPath '$Project'; pnpm job:collect >> output\collect.log 2>&1"""

schtasks /Create /F /TN "AIxxts Daily Digest" /SC DAILY /ST 08:00 /TR "powershell -NoProfile -ExecutionPolicy Bypass -Command ""Set-Location -LiteralPath '$Project'; pnpm job:daily >> output\daily.log 2>&1"""
```

检查任务：

```powershell
schtasks /Query /TN "AIxxts Collect"
schtasks /Query /TN "AIxxts Daily Digest"
```

删除任务：

```powershell
schtasks /Delete /F /TN "AIxxts Collect"
schtasks /Delete /F /TN "AIxxts Daily Digest"
```

注意事项：

- 运行账号必须能读取项目目录、`.env.local` 和 SQLite 数据库。
- `output/` 已在 `.gitignore` 中，不要提交任务日志。
- 若任务依赖 pnpm 的用户级安装路径，应在任务命令中使用 pnpm 的绝对路径。

## WSL cron 任务示例

确认 `.env.local`、数据库迁移、管理员 seed 和数据源 seed 已完成后，在 WSL 中执行 `crontab -e`：

```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

*/30 * * * * cd /mnt/c/Users/Administrator/Desktop/AIxxts && pnpm job:collect >> output/collect.log 2>&1
0 8 * * * cd /mnt/c/Users/Administrator/Desktop/AIxxts && pnpm job:daily >> output/daily.log 2>&1
```

如果项目部署在 WSL Linux 文件系统中，把路径替换为实际部署目录，例如 `~/apps/AIxxts`。cron 的时区以 WSL 系统时区为准，首次启用后要检查日志时间是否符合预期。

## SQLite 备份策略

推荐策略：

- 每日自动备份一次，时间放在每日精选任务之前。
- 重要发布、迁移、seed 前手动备份一次。
- 至少保留最近 7 天每日备份和最近 4 周每周备份。
- 定期做恢复演练，确认备份文件可用。

在线备份优先使用 SQLite `.backup`，减少复制运行中数据库文件的风险。

PowerShell 示例：

```powershell
Set-Location -LiteralPath "C:\Users\Administrator\Desktop\AIxxts"
New-Item -ItemType Directory -Force backups | Out-Null
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
sqlite3 .\data\prod.db ".backup '.\backups\prod-$Timestamp.db'"
```

WSL 示例：

```bash
cd /mnt/c/Users/Administrator/Desktop/AIxxts
mkdir -p backups
sqlite3 ./data/prod.db ".backup './backups/prod-$(date +%Y%m%d-%H%M%S).db'"
```

如果只能使用文件复制方式，先停止应用进程和定时任务，再同时保留主数据库文件以及可能存在的 `*.db-wal`、`*.db-shm` 文件。

## SQLite 恢复说明

恢复前必须先停止应用进程和采集任务，避免恢复期间继续写入。

PowerShell 示例：

```powershell
Set-Location -LiteralPath "C:\Users\Administrator\Desktop\AIxxts"
New-Item -ItemType Directory -Force backups\pre-restore | Out-Null
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item .\data\prod.db ".\backups\pre-restore\prod-before-restore-$Timestamp.db"
Copy-Item .\backups\prod-YYYYMMDD-HHMMSS.db .\data\prod.db
pnpm check:env
pnpm start
```

恢复后检查：

```text
http://127.0.0.1:3000/api/health
```

并检查首页、历史精选页和管理页是否能读取数据。

## GitHub 首次 push 前检查清单

提交前：

```powershell
git status --short
pnpm check:env
pnpm lint
pnpm typecheck
pnpm build
```

人工检查：

- `git status --short` 中不得出现 `.env.local`、真实数据库、日志、`.next/`、`node_modules/`。
- `.env.example` 只能包含示例值和变量说明，不能包含真实密钥。
- `README.md` 已包含文档入口。
- `docs/09-operations.md` 已记录部署、运行、任务、备份和恢复说明。
- 如果 `package.json` 和 `pnpm-lock.yaml` 后续由其他任务修改，首次 push 前必须确认二者一致。
- 检查 README、docs 和 `.env.example` 为 UTF-8 中文文本。

敏感信息搜索示例：

```powershell
rg -n "sk-|AIza|Bearer [A-Za-z0-9._-]+|LLM_API_KEY=.+|YOUTUBE_API_KEY=.+|X_API_BEARER_TOKEN=.+|SESSION_SECRET=.+|ADMIN_PASSWORD=.+" . --glob "!node_modules/**" --glob "!.git/**" --glob "!.next/**"
```

首次推送示例：

```powershell
git add README.md docs/09-operations.md .env.example
git commit -m "docs: add operations guide"
git branch -M main
git remote add origin <github-repo-url>
git push -u origin main
```
