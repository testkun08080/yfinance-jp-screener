import type { AISettings } from "../types/ai";

export const AI_STORAGE_KEY = "yfsc-ai-settings";

/**
 * モデル・ブラウザ保護のための最大行数（絞り込みがこれを超える場合は先頭からこの件数まで）。
 * 列は CSV の全カラムを TSV で渡す。
 */
export const AI_STOCK_CONTEXT_HARD_CAP = 15_000;

/** @deprecated 互換用。AI_STOCK_CONTEXT_HARD_CAP を参照 */
export const AI_MAX_STOCKS_IN_CONTEXT = AI_STOCK_CONTEXT_HARD_CAP;

/** データビューアの絞り込み要約（buildStockContext の結果）を保存 — 同一ブラウザの AI チャットから参照 */
export const CHAT_STOCK_CONTEXT_STORAGE_KEY = "yfsc-chat-stock-context-v1";

/** OpenAI 互換 `/v1/chat/completions` 用（末尾は `/v1`） */
export const OLLAMA_DEFAULTS = {
  baseUrl: "http://localhost:11434/v1",
  model: "llama3.2",
} as const;

export const AI_DEFAULT_SETTINGS: AISettings = {
  provider: "ollama",
  apiKey: "",
  baseUrl: OLLAMA_DEFAULTS.baseUrl,
  model: OLLAMA_DEFAULTS.model,
};

export const AI_SYSTEM_PROMPT = `あなたは日本株のスクリーニング分析を支援するAIアシスタントです。
ユーザーが提供する株式データを分析し、投資判断の参考となる洞察を提供してください。
あなたの分析は情報提供であり、投資助言ではありません。回答は日本語で行ってください。`;
