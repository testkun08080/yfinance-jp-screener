/** 現状はローカル Ollama のみ対応 */
export type AIProvider = "ollama";

export interface AISettings {
  provider: "ollama";
  /** 互換のため残すが未使用（常に空） */
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
