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
    translationMode: "literal_sentence_by_sentence",
    rules: [
      "Return valid JSON only. Do not use Markdown.",
      "逐字逐句翻译，只允许基于提供的 title、summary、contentText，不得使用外部知识。",
      "translatedTitle 翻译 title，保持标题原意，不增加解释。",
      "如果 summary 非空，translatedSummary 必须逐句翻译 summary；如果 summary 为空，只能基于 title 写一句极短中文说明。",
      "如果 contentText 非空，translatedContent 必须逐段逐句翻译 contentText 的完整内容，不得总结、压缩、改写、跳句或合并段落。",
      "保留原文段落顺序和换行；原文分段处在 translatedContent 中也要分段。",
      "专有名词、产品名、公司名、数字、日期、代码标识保持原样，必要时只翻译其周围说明文字。",
      "不添加原文没有的事实、结论、日期、数字、背景或影响判断。",
      "如果 contentText 为空，translatedContent 设为 null。",
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
      "你是 AI 行业内容的精准中文翻译员。必须逐字逐句翻译，保留事实含义、句子顺序、段落结构、专有名词、数字、产品名和不确定性。输出只能是 JSON object。",
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
