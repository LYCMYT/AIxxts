import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).default("file:./data/dev.db"),
  APP_BASE_URL: z.string().url().default("http://127.0.0.1:3000"),
  SESSION_SECRET: z.string().min(32),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("qwen-plus"),
  YOUTUBE_API_KEY: z.string().optional(),
  X_API_BEARER_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
