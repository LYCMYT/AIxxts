import { env } from "@/server/env";

const configured = {
  database: Boolean(env.DATABASE_URL),
  appBaseUrl: env.APP_BASE_URL,
  llmModel: env.LLM_MODEL,
  hasLlmKey: Boolean(env.LLM_API_KEY),
  hasYoutubeKey: Boolean(env.YOUTUBE_API_KEY),
};

console.log(JSON.stringify(configured, null, 2));
