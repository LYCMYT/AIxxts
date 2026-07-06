# GitHub 项目窗口设计

## 当前状态

仓库地址：[LYCMYT/AIxxts](https://github.com/LYCMYT/AIxxts)

当前 GitHub 页面显示该仓库为 public，且仓库为空。本地仓库已经初始化项目骨架，但尚未提交，也尚未绑定远端。

## 定位

这个仓库应作为项目的协作窗口，而不是产品最终使用入口。它承担三件事：

1. 让团队成员知道项目是什么、怎么运行、当前做到哪一步。
2. 让开发者明确技术栈、目录结构、环境变量和验证命令。
3. 让后续需求、缺陷和阶段任务可以被追踪。

## 首屏 README 设计

README 第一屏建议包含：

- 项目名称：AI 行业情报聚合平台。
- 一句话定位：为 Xone 团队生成每日 AI 行业精选。
- 当前阶段：MVP 开发准备完成。
- 本地启动命令。
- 文档入口。
- 当前范围和不做事项。

README 不应堆长篇 PRD，详细内容放到 `docs/`。

## 仓库目录设计

```text
docs/
  01-prd-analysis.md
  02-tech-stack.md
  03-development-environment.md
  04-architecture.md
  05-product-design.md
  06-github-window-design.md
prisma/
src/
scripts/
```

原则：

- `README.md` 负责快速进入项目。
- `docs/` 负责决策沉淀。
- `src/` 负责应用代码。
- `scripts/` 负责本地检查、任务入口和运维辅助。
- `prisma/` 负责数据库 schema 和 migration。

## Issue 使用设计

建议启用 GitHub Issues，并用以下标签：

- `phase-1`: MVP 范围内任务。
- `collector`: 数据采集。
- `ranking`: LLM 排序和解读。
- `dashboard`: 页面展示。
- `admin`: 管理后台。
- `infra`: 部署、环境、调度。
- `decision`: 需要产品或预算确认。

初始 issue 建议：

1. Phase 1.1 开放预览基础页面与开发进度页。
2. Phase 1.2 RSS 采集 adapter。
3. Phase 1.2 YouTube 采集 adapter。
4. Phase 1.3 每日精选 LLM prompt 与 schema 校验。
5. Phase 1.4 自托管部署与定时任务。

## Branch 与提交设计

推荐：

- 主分支：`main`。
- 功能分支：`feature/<short-topic>`。
- 修复分支：`fix/<short-topic>`。

提交信息：

```text
docs: add product design
feat: add rss collector
fix: handle duplicate candidate url
chore: configure prisma migration
```

## Pull Request 设计

每个 PR 至少包含：

- 做了什么。
- 不做什么。
- 验证命令与结果。
- 影响范围。

PR 模板建议：

```markdown
## Summary

## Scope

## Verification

- [ ] pnpm lint
- [ ] pnpm typecheck
- [ ] pnpm build

## Notes
```

## GitHub Actions 设计

MVP 初始 CI 只需要三步：

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

数据库 migration 检查可以在后续加入。当前本地已经能通过这些命令，适合作为第一版 CI 基线。

## 发布窗口

GitHub 仓库只发布源码和文档，不发布密钥。

禁止提交：

- `.env.local`
- SQLite 实际数据库文件
- API key
- LLM key
- YouTube key

允许提交：

- `.env.example`
- Prisma migration
- 文档
- 源码
- 验证脚本

## 首次推送建议

本地确认后执行：

```powershell
git remote add origin https://github.com/LYCMYT/AIxxts.git
git branch -M main
git add .env.example .gitignore AGENTS.md README.md docs eslint.config.mjs next-env.d.ts next.config.ts package.json pnpm-lock.yaml pnpm-workspace.yaml postcss.config.mjs prisma.config.ts prisma scripts src tsconfig.json data/.gitkeep
git commit -m "chore: initialize ai intelligence platform"
git push -u origin main
```

如果远端后续出现 README 或其他文件，推送前先 `git pull --rebase origin main`，避免覆盖远端内容。
