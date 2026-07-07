import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCandidateTranslationPrompt,
  resolveCandidateDetailText,
} from "./candidate-text";

test("resolveCandidateDetailText prefers cached Chinese translation", () => {
  const text = resolveCandidateDetailText({
    title: "OpenAI ships a model update",
    summary: "The update improves coding and reasoning.",
    contentText: "Original long article body.",
    translatedTitle: "OpenAI 发布模型更新",
    translatedSummary: "该更新提升了编程和推理能力。",
    translatedContent: "原文正文的中文翻译。",
    translatedAt: new Date("2026-07-06T12:00:00.000Z"),
    digestInterpretation: "日报中文解读",
  });

  assert.equal(text.displayTitle, "OpenAI 发布模型更新");
  assert.equal(text.originalTitle, "OpenAI ships a model update");
  assert.equal(text.chineseSummary, "该更新提升了编程和推理能力。");
  assert.equal(text.chineseContent, "原文正文的中文翻译。");
  assert.equal(text.translationStatus, "ready");
});

test("resolveCandidateDetailText falls back to digest interpretation when translation is missing", () => {
  const text = resolveCandidateDetailText({
    title: "AI regulation is moving quickly",
    summary: null,
    contentText: null,
    translatedTitle: null,
    translatedSummary: null,
    translatedContent: null,
    translatedAt: null,
    digestInterpretation: "这条内容说明监管正在加速。",
  });

  assert.equal(text.displayTitle, "AI regulation is moving quickly");
  assert.equal(text.chineseSummary, "这条内容说明监管正在加速。");
  assert.equal(text.chineseContent, null);
  assert.equal(text.translationStatus, "missing");
});

test("resolveCandidateDetailText ignores metadata-only translated summaries", () => {
  const text = resolveCandidateDetailText({
    title: "UN chief warns AI is developing faster than rules can keep up",
    summary:
      "Article URL: https://example.com/article Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 Comments: 0",
    contentText:
      "Article URL: https://example.com/article Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 Comments: 0",
    translatedTitle: "联合国秘书长警告人工智能发展速度超过规则制定能力",
    translatedSummary:
      "文章网址：https://example.com/article 评论网址：https://news.ycombinator.com/item?id=1 积分：2 评论数：0",
    translatedContent:
      "文章网址：https://example.com/article 评论网址：https://news.ycombinator.com/item?id=1 积分：2 评论数：0",
    translatedAt: new Date("2026-07-06T12:00:00.000Z"),
    digestInterpretation: "联合国最高领导人公开表示 AI 发展速度超过规则制定能力。",
  });

  assert.equal(text.displayTitle, "联合国秘书长警告人工智能发展速度超过规则制定能力");
  assert.equal(text.chineseSummary, "联合国最高领导人公开表示 AI 发展速度超过规则制定能力。");
  assert.equal(text.chineseContent, null);
  assert.equal(text.translationStatus, "ready");
});

test("buildCandidateTranslationPrompt caps long source content before sending to the LLM", () => {
  const prompt = buildCandidateTranslationPrompt({
    title: "Long source item",
    summary: "Summary",
    contentText: "a".repeat(20_000),
  });

  const payload = JSON.parse(prompt.user);

  assert.equal(payload.item.contentText.length, 12_000);
  assert.equal(payload.outputSchema.translatedTitle, "string");
  assert.equal(payload.outputSchema.translatedSummary, "string");
  assert.equal(payload.outputSchema.translatedContent, "string | null");
});

test("buildCandidateTranslationPrompt drops metadata-only source text", () => {
  const prompt = buildCandidateTranslationPrompt({
    title: "Metadata source item",
    summary:
      "Article URL: https://example.com/article Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 Comments: 0",
    contentText:
      "Article URL: https://example.com/article Comments URL: https://news.ycombinator.com/item?id=1 Points: 2 Comments: 0",
  });

  const payload = JSON.parse(prompt.user);

  assert.equal(payload.item.summary, null);
  assert.equal(payload.item.contentText, null);
});

test("buildCandidateTranslationPrompt requires literal sentence-by-sentence translation", () => {
  const prompt = buildCandidateTranslationPrompt({
    title: "OpenAI releases a new model",
    summary: "The model improves coding. It is available today.",
    contentText: "First paragraph. Keep this sentence.\n\nSecond paragraph with a product name: DeepSeek.",
  });

  const payload = JSON.parse(prompt.user);
  const rulesText = payload.rules.join("\n");

  assert.match(prompt.system, /逐字逐句/);
  assert.match(rulesText, /逐段逐句翻译/);
  assert.match(rulesText, /保留原文段落顺序和换行/);
  assert.match(rulesText, /不得总结、压缩、改写/);
  assert.match(rulesText, /专有名词、产品名、公司名、数字、日期、代码标识保持原样/);
});
