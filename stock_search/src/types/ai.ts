/** 現状はローカル Ollama のみ対応 */
export type AIProvider = "ollama";

export interface AISettings {
  provider: "ollama";
  /** 互換のため残すが未使用（常に空） */
  apiKey: string;
  baseUrl: string;
  model: string;
  /**
   * チャットの system 先頭に使うマスタープロンプト。
   * 空（または空白のみ）のときは `AI_SYSTEM_PROMPT` 既定を使う。
   * スクリーニング表は送信時にこの後ろへ自動で付与される。
   */
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
