import type { AISettings } from "../types/ai";
import { AI_SYSTEM_PROMPT } from "../constants/ai";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ---------- Custom fetch for useChat (TextStreamChatTransport) ----------

/**
 * useChat (TextStreamChatTransport) の fetch オプション用。
 * AI SDK v6 が送る UIMessage[] を受け取り、AI API を直接呼び出し、
 * plain text ReadableStream として返す。
 */
export function createCustomFetch(settings: AISettings): typeof fetch {
  return async (_url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const body = JSON.parse((init?.body as string) ?? "{}");

    // AI SDK v6 の UIMessage[] → {role, content}[] に変換
    const uiMessages: Array<{ role: string; parts: Array<{ type: string; text?: string }> }> =
      body.messages ?? [];
    const msgs = uiMessages.map((m) => ({
      role: m.role as string,
      content: m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join(""),
    }));

    const allMessages = [
      { role: "system", content: AI_SYSTEM_PROMPT },
      ...msgs,
    ];

    if (settings.provider === "anthropic") {
      return fetchAnthropicTextStream(settings, allMessages);
    }
    return fetchOpenAICompatTextStream(settings, allMessages);
  };
}

// ---------- OpenAI / Ollama / Custom (OpenAI-compatible) ----------

async function fetchOpenAICompatTextStream(
  settings: AISettings,
  messages: { role: string; content: string }[]
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (settings.apiKey) {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  const aiRes = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      stream: true,
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text().catch(() => aiRes.statusText);
    throw new Error(`API エラー (${aiRes.status}): ${err}`);
  }

  const textStream = sseToTextStream(aiRes.body!, (line) => {
    if (line === "[DONE]") return null;
    try {
      return (JSON.parse(line).choices?.[0]?.delta?.content as string) ?? null;
    } catch {
      return null;
    }
  });

  return new Response(textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ---------- Anthropic ----------

async function fetchAnthropicTextStream(
  settings: AISettings,
  messages: { role: string; content: string }[]
): Promise<Response> {
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const convMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const aiRes = await fetch(`${settings.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-allow-browser": "true",
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 2048,
      system,
      messages: convMsgs,
      stream: true,
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text().catch(() => aiRes.statusText);
    throw new Error(`API エラー (${aiRes.status}): ${err}`);
  }

  const textStream = sseToTextStream(aiRes.body!, (line) => {
    try {
      const p = JSON.parse(line);
      if (
        p.type === "content_block_delta" &&
        p.delta?.type === "text_delta"
      ) {
        return (p.delta.text as string) ?? null;
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  return new Response(textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ---------- SSE → plain text ReadableStream ----------

function sseToTextStream(
  body: ReadableStream<Uint8Array>,
  extractText: (dataLine: string) => string | null
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
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
            const text = extractText(trimmed.slice(6));
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
      }
      controller.close();
    },
  });
}

// ---------- Legacy API (for testConnection in SettingsPage) ----------

async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body = JSON.stringify({
    model,
    messages,
    stream: !!onChunk,
  });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
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

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? AI_SYSTEM_PROMPT;
  const conversationMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-allow-browser": "true",
  };

  const body = JSON.stringify({
    model,
    max_tokens: 2048,
    system: systemMsg,
    messages: conversationMsgs,
    stream: !!onChunk,
  });

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers,
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`API エラー (${res.status}): ${errText}`);
  }

  if (!onChunk) {
    const json = await res.json();
    return (json.content?.[0]?.text as string) ?? "";
  }

  let buffer = "";
  await readSSEStream(res, (line) => {
    if (!line) return;
    try {
      const parsed = JSON.parse(line);
      if (
        parsed.type === "content_block_delta" &&
        parsed.delta?.type === "text_delta"
      ) {
        const text = (parsed.delta.text as string) ?? "";
        if (text) {
          buffer += text;
          onChunk(text);
        }
      }
    } catch {
      /* ignore */
    }
  });
  return buffer;
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
    { role: "system", content: AI_SYSTEM_PROMPT },
    ...messages,
  ];

  if (settings.provider === "anthropic") {
    return callAnthropic(
      settings.baseUrl,
      settings.apiKey,
      settings.model,
      msgs,
      onChunk
    );
  }

  return callOpenAICompat(
    settings.baseUrl,
    settings.apiKey,
    settings.model,
    msgs,
    onChunk
  );
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
