# 每日精选排序和 LLM 生成

每日精选由 `src/server/jobs/daily.ts` 生成。任务默认使用当天日期作为 `digestDate`，读取生成窗口过去 24 小时的 `CandidateItem`，并排除 `DUPLICATE` 和 `REJECTED`。

LLM 使用 OpenAI-compatible Chat Completions 配置：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

当 `LLM_API_KEY` 为空时，任务只对真实候选池使用确定性规则排序。排序依据依次为 `hotScore`、`influenceScore`、发布时间和来源类型。规则解读只引用标题和摘要，并明确不补充外部事实；系统不会为了填充页面而注入演示数据。

当启用 LLM 时，prompt 要求模型只基于输入候选材料输出 JSON object。服务端用 zod 校验 `digestTitle`、`digestSummary` 和 10 到 20 条 `items`，候选不足时允许输出全部候选。校验还会拒绝未知 `candidateId`、重复候选和不连续 rank。

生成成功会创建 `LlmRun`，并在未发布状态下 upsert 当天 `DailyDigest` 和替换 `DigestItem`。如果当天 digest 已是 `PUBLISHED`，任务只记录新的 `LlmRun`，不覆盖已发布内容。生成失败会创建带错误信息的 `LlmRun`，并在未发布状态下写入 `FAILED` digest。
