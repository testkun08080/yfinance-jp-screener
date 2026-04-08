import type { AISettings } from "../types/ai";
import { AI_SYSTEM_PROMPT } from "../constants/ai";

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ---------- OpenAI / Ollama / Custom (OpenAI-compatible) ----------

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
    return json.choices?.[0]?.message?.content ?? "";
  }

  // Streaming
  return readSSEStream(res, (line) => {
    if (line === "[DONE]") return;
    try {
      const parsed = JSON.parse(line);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) onChunk(delta);
    } catch {
      /* ignore malformed lines */
    }
  });
}

// ---------- Anthropic ----------

async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: AIMessage[],
  onChunk?: (text: string) => void
): Promise<string> {
  // Separate system messages from conversation messages
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
    return json.content?.[0]?.text ?? "";
  }

  // Anthropic SSE streaming
  let buffer = "";
  return readSSEStream(res, (line) => {
    if (!line) return;
    try {
      const parsed = JSON.parse(line);
      if (
        parsed.type === "content_block_delta" &&
        parsed.delta?.type === "text_delta"
      ) {
        const text = parsed.delta.text ?? "";
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

// ---------- SSE stream reader ----------

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
        // Accumulate non-Anthropic delta text for return value
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

// ---------- Public API ----------

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

  // openai / ollama / custom — all OpenAI-compatible
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
