/**
 * Ollama OpenAI 互換 API で tools を使うエージェントループ。
 * ツールラウンドは非ストリーム、最終回答のみテキストストリームとして返す。
 */

import type { AISettings } from "../types/ai";
import { executeOllamaTool, OLLAMA_CHAT_TOOLS } from "./ollamaTools";

export type OllamaToolStatusCallback = (status: string | null) => void;

/** OpenAI 互換メッセージ（tool_calls / tool 対応） */
export type OllamaChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

const MAX_TOOL_ROUNDS = 8;

function getOllamaRootFromOpenAIBaseUrl(baseUrl: string): string {
  const u = baseUrl.replace(/\/$/, "");
  if (u.endsWith("/v1")) return u.slice(0, -3);
  return u;
}

async function postChatCompletions(
  ollamaRoot: string,
  apiKey: string | undefined,
  body: Record<string, unknown>
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey?.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }
  return fetch(`${ollamaRoot}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function extractAssistantMessage(data: unknown): {
  content: string | null;
  tool_calls?: OllamaChatMessage["tool_calls"];
} | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: unknown };
  const msg = first.message;
  if (!msg || typeof msg !== "object") return null;
  const m = msg as {
    content?: unknown;
    tool_calls?: OllamaChatMessage["tool_calls"];
  };
  const content =
    m.content === null || m.content === undefined
      ? null
      : typeof m.content === "string"
        ? m.content
        : String(m.content);
  return {
    content,
    tool_calls: m.tool_calls,
  };
}

function streamFromString(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(text));
      controller.close();
    },
  });
}

/**
 * tools 付きでチャットを完了し、最終 assistant のテキストを SSE 風ストリームとして返す。
 * useChat / TextStreamChatTransport が期待する OpenAI 互換ストリーム形式に合わせる。
 */
export async function runOllamaChatWithToolsAndStream(
  settings: AISettings,
  messages: OllamaChatMessage[],
  onToolStatus?: OllamaToolStatusCallback,
  onCitationUrl?: (url: string) => void
): Promise<Response> {
  const base = settings.baseUrl.trim();
  const ollamaRoot = getOllamaRootFromOpenAIBaseUrl(base);
  const model = settings.model.trim() || "llama3.2";
  const apiKey = settings.apiKey?.trim() || undefined;

  let working: OllamaChatMessage[] = messages.map((m) => ({ ...m }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await postChatCompletions(ollamaRoot, apiKey, {
      model,
      messages: working,
      tools: OLLAMA_CHAT_TOOLS,
      stream: false,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      onToolStatus?.(null);
      return new Response(
        streamFromString(
          `Ollama エラー (${res.status}): ${errText || res.statusText}`
        ),
        {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }
      );
    }

    const data: unknown = await res.json();
    const assistant = extractAssistantMessage(data);
    if (!assistant) {
      onToolStatus?.(null);
      return new Response(streamFromString("応答の解析に失敗しました"), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const tcs = assistant.tool_calls;
    if (tcs && tcs.length > 0) {
      const ac =
        assistant.content && assistant.content.trim().length > 0
          ? assistant.content
          : null;
      working.push({
        role: "assistant",
        content: ac,
        tool_calls: tcs,
      });

      for (const tc of tcs) {
        if (tc.type !== "function") continue;
        const fn = tc.function;
        const label =
          fn.name === "get_screening_context"
            ? "スクリーニングデータを取得中…"
            : fn.name === "fetch_public_page_text"
              ? "公開ページを取得中…"
              : `ツール実行: ${fn.name}`;
        onToolStatus?.(label);
        if (fn.name === "fetch_public_page_text") {
          try {
            const parsed = JSON.parse(fn.arguments ?? "{}") as { url?: string };
            if (typeof parsed.url === "string" && parsed.url.trim()) {
              onCitationUrl?.(parsed.url.trim());
            }
          } catch {
            /* ignore */
          }
        }
        const result = await executeOllamaTool(fn.name, fn.arguments ?? "{}");
        working.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      onToolStatus?.(null);
      continue;
    }

    onToolStatus?.(null);
    const finalText = assistant.content ?? "";
    return new Response(streamFromString(finalText), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  onToolStatus?.(null);
  return new Response(
    streamFromString("ツール実行の最大回数に達しました。会話を短くしてください。"),
    {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
