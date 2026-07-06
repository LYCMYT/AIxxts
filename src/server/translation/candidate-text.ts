const MAX_TRANSLATION_SOURCE_CHARS = 12_000;

export type CandidateTranslationPromptInput = {
  title: string;
  summary: string | null;
  contentText: string | null;
};

export type CandidateDetailTextInput = CandidateTranslationPromptInput & {
  translatedTitle: string | null;
  translatedSummary: string | null;
  translatedContent: string | null;
  translatedAt: Date | null;
  digestInterpretation: string | null;
};

export type CandidateDetailText = {
  displayTitle: string;
  originalTitle: string;
  originalSummary: string;
  chineseSummary: string;
  chineseContent: string | null;
  translationStatus: "ready" | "missing";
};

export function resolveCandidateDetailText(input: CandidateDetailTextInput): CandidateDetailText {
  const translatedTitle = nonEmpty(input.translatedTitle);
  const translatedSummary = usableTranslatedText(input.translatedSummary);
  const translatedContent = usableTranslatedText(input.translatedContent);
  const digestInterpretation = nonEmpty(input.digestInterpretation);
  const originalSummary = nonEmpty(input.summary) ?? nonEmpty(input.contentText) ?? "暂无原文摘要。";

  return {
    displayTitle: translatedTitle ?? input.title,
    originalTitle: input.title,
    originalSummary,
    chineseSummary: translatedSummary ?? digestInterpretation ?? originalSummary,
    chineseContent: translatedContent,
    translationStatus:
      translatedTitle || translatedSummary || translatedContent || input.translatedAt ? "ready" : "missing",
  };
}

export function buildCandidateTranslationPrompt(input: CandidateTranslationPromptInput) {
  const payload = {
    task: "Translate an AI industry candidate item into Simplified Chinese for an internal intelligence dashboard.",
    rules: [
      "Return valid JSON only. Do not use Markdown.",
      "Translate faithfully based only on the provided title, summary, and contentText.",
      "Do not add facts, conclusions, dates, figures, or background that are not present in the provided text.",
      "If contentText is empty, set translatedContent to null.",
      "If summary is empty, write a short Chinese summary based only on the title.",
    ],
    outputSchema: {
      translatedTitle: "string",
      translatedSummary: "string",
      translatedContent: "string | null",
    },
    item: {
      title: input.title,
      summary: sourceTextForTranslation(input.summary),
      contentText: truncateForTranslation(input.contentText),
    },
  };

  return {
    system:
      "You are a precise English-to-Chinese translator for AI industry news. Preserve factual meaning, names, numbers, product names, and uncertainty. Output only a JSON object.",
    user: JSON.stringify(payload),
  };
}

function truncateForTranslation(value: string | null) {
  const text = sourceTextForTranslation(value);

  if (!text) {
    return null;
  }

  return text.length > MAX_TRANSLATION_SOURCE_CHARS
    ? text.slice(0, MAX_TRANSLATION_SOURCE_CHARS)
    : text;
}

function nonEmpty(value: string | null | undefined) {
  const text = value?.trim();

  return text ? text : null;
}

function sourceTextForTranslation(value: string | null | undefined) {
  const text = nonEmpty(value);

  if (!text || isMetadataOnlyText(text)) {
    return null;
  }

  return text;
}

function usableTranslatedText(value: string | null | undefined) {
  const text = nonEmpty(value);

  if (!text || isMetadataOnlyText(text)) {
    return null;
  }

  return text;
}

function isMetadataOnlyText(value: string) {
  const normalized = value.toLowerCase();
  const hasUrl = /https?:\/\//i.test(value);
  const hasEnglishMetadata =
    normalized.includes("article url") &&
    normalized.includes("comments url") &&
    (normalized.includes("points") || normalized.includes("comments"));
  const hasChineseMetadata =
    value.includes("文章网址") &&
    value.includes("评论网址") &&
    (value.includes("积分") || value.includes("评论数"));

  return hasUrl && (hasEnglishMetadata || hasChineseMetadata);
}
