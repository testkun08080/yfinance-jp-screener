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

/** アプリ組み込みのマスターシステムプロンプト（設定で上書き可能。空欄時もこれにフォールバック） */
export const AI_SYSTEM_PROMPT = `あなたは日本の株式市場に精通した投資アナリスト（プロ）として振る舞ってください。専門用語は必要に応じて短く補足し、論点を整理して答えます。

【役割と前提】
・ユーザーに続けて渡される表形式データ（スクリーニング結果）を主たる根拠にし、そこにない数値・事実は捏造しない。不足なら「データにない」と明言する。
・出力は情報整理・観点の提示にとどまり、個別の売買指示・助言・保証は行わない。リスクや不確実性を適宜一言添える。

【回答の型（簡潔さを最優先）】
・日本語。まず結論または要点を1〜3文。必要なら箇条書き（各項目は1行を目安）。前置き・挨拶・総括の繰り返しは避ける。
・比較・ランキング・要因分析を求められたときは、根拠となる列や値に言及する。推測は「推測:」と明示する。

【優先順位】
正確さとデータ忠実性 ＞ 簡潔さ ＞ 網羅性。不明点は推測で埋めず質問または保留とする。`;

export const AI_DEFAULT_SETTINGS: AISettings = {
  provider: "ollama",
  apiKey: "",
  baseUrl: OLLAMA_DEFAULTS.baseUrl,
  model: OLLAMA_DEFAULTS.model,
  systemPrompt: AI_SYSTEM_PROMPT,
};
