import type { AISettings } from "../types/ai";

export const AI_STORAGE_KEY = "yfsc-ai-settings";

export const AI_MAX_STOCKS_IN_CONTEXT = 50;

export const AI_PROVIDER_DEFAULTS = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com",
    model: "claude-3-5-haiku-20241022",
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "llama3.2",
  },
  custom: {
    baseUrl: "",
    model: "",
  },
} as const;

export const AI_DEFAULT_SETTINGS: AISettings = {
  provider: "openai",
  apiKey: "",
  baseUrl: AI_PROVIDER_DEFAULTS.openai.baseUrl,
  model: AI_PROVIDER_DEFAULTS.openai.model,
};

export const AI_SYSTEM_PROMPT = `あなたは日本株のスクリーニング分析を支援するAIアシスタントです。
ユーザーが提供する株式データを分析し、投資判断の参考となる洞察を提供してください。
あなたの分析は情報提供であり、投資助言ではありません。回答は日本語で行ってください。`;
