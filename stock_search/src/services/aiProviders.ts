import type { AISettings } from "../types/ai";
import { AI_SYSTEM_PROMPT } from "../constants/ai";
import { loadChatStockContext } from "../utils/chatStockContextStorage";
import {
  runOllamaChatWithToolsAndStream,
  type OllamaChatMessage,
} from "./ollamaAgentLoop";

/** チャット送信時に UI（ツール実行中表示・出典 URL）へ通知するコールバック */
export type OllamaChatRuntimeCallbacks = {
  onToolStatus?: (status: string | null) => void;
  onCitationUrl?: (url: string) => void;
};

let ollamaChatRuntimeCallbacks: OllamaChatRuntimeCallbacks | null = null;

export function setOllamaChatRuntimeCallbacks(
  cb: OllamaChatRuntimeCallbacks | null
): void {
  ollamaChatRuntimeCallbacks = cb;
}

/** 設定のマスタープロンプト。空・空白のみなら組み込み既定を使う（末尾改行などは保持） */
export function getMasterSystemPrompt(settings: AISettings): string {
  const raw = settings.systemPrompt ?? "";
  if (raw.trim() === "") return AI_SYSTEM_PROMPT;
  return raw;
}

/** チャット送信ごとに、ブラウザに保存したスクリーニング要約をシステムプロンプトへ合流（ユーザーが手動で貼らなくてよい） */
async function getEffectiveSystemPromptForChat(
  settings: AISettings
): Promise<string> {
  const base = getMasterSystemPrompt(settings);
  const stock = (await loadChatStockContext())?.trim();
  const toolHint = `

【ツール】
モデルが tool calling に対応している場合、必要に応じて get_screening_context（スクリーニング要約の再取得）または fetch_public_page_text（https:// の公開ページ本文・Jina Reader 経由）を使えます。`;
  if (!stock) return `${base}${toolHint}`;
  return `${base}${toolHint}

【以下はユーザーがこのブラウザで読み込んだスクリーニング結果です（当アプリのサーバーには送信されません）。回答では必ず参照してください。】
${stock}`;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * useChat (TextStreamChatTransport) の fetch オプション用。
 * AI SDK が送る UIMessage[] を受け取り、Ollama（OpenAI 互換）へ転送し、
 * plain text ReadableStream として返す。
 */
export function createCustomFetch(settings: AISettings): typeof fetch {
  return async (_url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse((init?.body as string) ?? "{}");

    const uiMessages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];
    const msgs = uiMessages.map((m) => ({
      role: m.role as string,
      content: m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join(""),
    }));

    const systemContent = await getEffectiveSystemPromptForChat(settings);
    const ollamaMessages: OllamaChatMessage[] = [
      { role: "system", content: systemContent },
      ...msgs
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];

    const cb = ollamaChatRuntimeCallbacks;
    return runOllamaChatWithToolsAndStream(
      settings,
      ollamaMessages,
      cb?.onToolStatus,
      cb?.onCitationUrl
    );
  };
}

async function callOllamaChat(
  baseUrl: string,
  model: string,
  messages: AIMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const body = JSON.stringify({
    model,
    messages,
    stream: !!onChunk,
  });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`API エラー (${res.status}): ${errText}`);
  }

  if (!onChunk) {
    const json = await res.json();
    return (json.choices?.[0]?.message?.content as string) ?? "";
  }

  return readSSEStream(res, (line) => {
    if (line === "[DONE]") return;
    try {
      const parsed = JSON.parse(line);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) onChunk(delta as string);
    } catch {
      /* ignore malformed lines */
    }
  });
}

async function readSSEStream(
  res: Response,
  onLine: (dataContent: string) => void
): Promise<string> {
  if (!res.body) throw new Error("レスポンスボディがありません");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const content = trimmed.slice(6);
        onLine(content);
        if (content !== "[DONE]") {
          try {
            const parsed = JSON.parse(content);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) accumulated += delta;
          } catch {
            /* ignore */
          }
        }
      }
    }
  }

  return accumulated;
}

export async function callAI(
  settings: AISettings,
  messages: AIMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const msgs: AIMessage[] = [
    { role: "system", content: getMasterSystemPrompt(settings) },
    ...messages,
  ];

  return callOllamaChat(settings.baseUrl, settings.model, msgs, onChunk);
}

export async function testConnection(
  settings: AISettings
): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await callAI(settings, [
      { role: "user", content: "日本語で「接続OK」とだけ返してください。" },
    ]);
    if (result) {
      return { ok: true, message: `接続成功: ${result.slice(0, 50)}` };
    }
    return { ok: false, message: "レスポンスが空でした" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "不明なエラー",
    };
  }
}

/** OpenAI 互換ベース URL（例: `http://localhost:11434/v1`）から Ollama ルート（`/api/tags` 用）を得る */
export function getOllamaRootFromOpenAIBaseUrl(baseUrl: string): string {
  const u = baseUrl.trim().replace(/\/+$/, "");
  if (u.endsWith("/v1")) return u.slice(0, -3);
  return u;
}

/** Ollama `GET /api/tags` の1モデル */
export interface OllamaTagModel {
  name: string;
  model: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  remote_model?: string;
  remote_host?: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
  };
}

/** ブラウザから Ollama の `GET /api/tags` で API 有効確認とモデル一覧取得 */
export async function fetchOllamaTags(
  openAiCompatibleBaseUrl: string
): Promise<{
  ok: boolean;
  models: OllamaTagModel[];
  httpStatus?: number;
  error?: string;
}> {
  const root = getOllamaRootFromOpenAIBaseUrl(openAiCompatibleBaseUrl);
  const url = `${root}/api/tags`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        models: [],
        httpStatus: res.status,
        error: `HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { models?: OllamaTagModel[] };
    return { ok: true, models: data.models ?? [], httpStatus: res.status };
  } catch (e) {
    return {
      ok: false,
      models: [],
      error: e instanceof Error ? e.message : "不明なエラー",
    };
  }
}
