import crypto from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { env } from "@/server/env";
import type {
  DigestRankingResult,
  RankingCandidate,
  RankingLimits,
} from "@/server/ranking/types";
import { buildCandidateTranslationPrompt } from "@/server/translation/candidate-text";
import type { CandidateTranslationPromptInput } from "@/server/translation/candidate-text";

const llmRankingSchema = z.object({
  digestTitle: z.string().min(1).max(120),
  digestSummary: z.string().min(1).max(500),
  items: z
    .array(
      z.object({
        candidateId: z.string().min(1),
        rank: z.coerce.number().int().positive(),
        score: z.coerce.number().min(0).max(100),
        interpretation: z.string().min(1).max(500),
        impactReason: z.string().min(1).max(300).optional(),
        heatReason: z.string().min(1).max(300).optional(),
      }),
    )
    .max(20),
});

const candidateTranslationSchema = z.object({
  translatedTitle: z.string().min(1).max(500),
  translatedSummary: z.string().min(1).max(2_000),
  translatedContent: z.string().min(1).max(24_000).nullable().optional(),
});

export type LlmRankingResult = {
  ranking: DigestRankingResult;
  rawJson: Prisma.InputJsonValue;
  promptHash: string;
  inputTokens?: number;
  outputTokens?: number;
};

export type LlmCandidateTranslationResult = {
  translatedTitle: string;
  translatedSummary: string;
  translatedContent: string | null;
  rawJson: Prisma.InputJsonValue;
  promptHash: string;
  inputTokens?: number;
  outputTokens?: number;
};

export async function rankCandidatesWithLlm(
  candidates: RankingCandidate[],
  digestDate: string,
  limits: RankingLimits,
): Promise<LlmRankingResult> {
  const prompt = buildDailyRankingPrompt(candidates, digestDate, limits);
  const client = new OpenAI({
    apiKey: env.LLM_API_KEY,
    baseURL: env.LLM_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: env.LLM_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: prompt.system,
      },
      {
        role: "user",
        content: prompt.user,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("LLM response is empty.");
  }

  const rawJson = parseJsonObject(content);
  const ranking = validateLlmRanking(rawJson, candidates, limits);

  return {
    ranking,
    rawJson,
    promptHash: hashPrompt(prompt.system, prompt.user),
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
  };
}

export async function translateCandidateWithLlm(
  input: CandidateTranslationPromptInput,
): Promise<LlmCandidateTranslationResult> {
  const prompt = buildCandidateTranslationPrompt(input);
  const client = new OpenAI({
    apiKey: env.LLM_API_KEY,
    baseURL: env.LLM_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: env.LLM_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: prompt.system,
      },
      {
        role: "user",
        content: prompt.user,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("LLM translation response is empty.");
  }

  const rawJson = parseJsonObject(content);
  const parsed = candidateTranslationSchema.parse(rawJson);

  return {
    translatedTitle: parsed.translatedTitle,
    translatedSummary: parsed.translatedSummary,
    translatedContent: parsed.translatedContent?.trim() || null,
    rawJson,
    promptHash: hashPrompt(prompt.system, prompt.user),
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens,
  };
}

function buildDailyRankingPrompt(
  candidates: RankingCandidate[],
  digestDate: string,
  limits: RankingLimits,
) {
  const candidatePayload = candidates.map((candidate) => ({
    candidateId: candidate.id,
    title: candidate.title,
    summary: candidate.summary,
    sourceName: candidate.source.name,
    sourceType: candidate.source.type,
    publishedAt: candidate.publishedAt.toISOString(),
    hotScore: candidate.hotScore,
    influenceScore: candidate.influenceScore,
    canonicalUrl: candidate.canonicalUrl,
  }));

  return {
    system:
      "你是 AI 行业每日精选编辑。你必须只基于用户提供的候选材料进行排序和解读，不得补充输入材料之外的事实、数据、结论或背景。输出必须是合法 JSON object，不要使用 Markdown。",
    user: JSON.stringify(
      {
        task: "从候选材料中选择每日精选并排序。",
        digestDate,
        rules: [
          `候选数足够时输出 ${limits.minItems} 到 ${limits.maxItems} 条，候选数不足时只输出可用候选。`,
          "只允许使用输入材料中的 candidateId。",
          "rank 从 1 开始连续递增，不得重复。",
          "interpretation 必须只解释输入材料中标题和摘要可支持的内容，不得胡编。",
          "score 使用 0 到 100 数字，越重要越高。",
        ],
        outputSchema: {
          digestTitle: "string",
          digestSummary: "string",
          items: [
            {
              candidateId: "string",
              rank: "number",
              score: "number",
              interpretation: "string",
              impactReason: "string",
              heatReason: "string",
            },
          ],
        },
        candidates: candidatePayload,
      },
      null,
      2,
    ),
  };
}

function validateLlmRanking(
  value: unknown,
  candidates: RankingCandidate[],
  limits: RankingLimits,
): DigestRankingResult {
  const parsed = llmRankingSchema.parse(value);
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const seenIds = new Set<string>();
  const minItems = Math.min(limits.minItems, candidates.length);

  if (parsed.items.length < minItems) {
    throw new Error(`LLM returned ${parsed.items.length} items, expected at least ${minItems}.`);
  }

  const sortedItems = [...parsed.items].sort((left, right) => left.rank - right.rank);

  sortedItems.forEach((item, index) => {
    if (!candidateIds.has(item.candidateId)) {
      throw new Error(`LLM returned unknown candidateId: ${item.candidateId}`);
    }

    if (seenIds.has(item.candidateId)) {
      throw new Error(`LLM returned duplicate candidateId: ${item.candidateId}`);
    }

    if (item.rank !== index + 1) {
      throw new Error("LLM ranks must start at 1 and be consecutive.");
    }

    seenIds.add(item.candidateId);
  });

  return {
    digestTitle: parsed.digestTitle,
    digestSummary: parsed.digestSummary,
    items: sortedItems,
  };
}

function parseJsonObject(content: string): Prisma.InputJsonValue {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced?.[1] ?? trimmed;

  return JSON.parse(jsonText) as Prisma.InputJsonValue;
}

function hashPrompt(system: string, user: string) {
  return crypto.createHash("sha256").update(system).update("\n").update(user).digest("hex");
}
