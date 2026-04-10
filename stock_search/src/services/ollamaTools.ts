/**
 * Ollama（OpenAI 互換）の tools 配列用スキーマとブラウザ側実行。
 * @see https://docs.ollama.com/capabilities/tool-calling
 */

import { loadChatStockContext } from "../utils/chatStockContextStorage";

/** OpenAI Chat Completions 形式の tools 配列 */
export const OLLAMA_CHAT_TOOLS: Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> = [
  {
    type: "function",
    function: {
      name: "get_screening_context",
      description:
        "このブラウザに保存されているスクリーニング（絞り込み）結果のテキストを取得する。件数・条件・銘柄に関する質問で使う。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_public_page_text",
      description:
        "公開 Web ページの本文をプレーンテキスト（Markdown 風）で取得する。ニュース・IR・一次情報の確認に使う。https の公開 URL のみ。",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "https:// で始まる公開ページの URL",
          },
        },
        required: ["url"],
      },
    },
  },
];

const MAX_CONTEXT_CHARS = 14_000;
const MAX_FETCH_CHARS = 12_000;

function isBlockedUrl(url: URL): string | null {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "http(s) のみ利用できます";
  }
  const h = url.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    h === "[::1]"
  ) {
    return "ローカル・ループバック URL はブロックしています";
  }
  if (/^10\./.test(h) || /^192\.168\./.test(h)) return "プライベート IP はブロックしています";
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h))
    return "プライベート IP はブロックしています";
  return null;
}

/**
 * Jina Reader 経由で公開ページのテキストを取得（ブラウザからの直接 fetch 向け）。
 * @see https://jina.ai/reader
 */
async function fetchViaJinaReader(canonicalUrl: string): Promise<string> {
  const readerUrl = `https://r.jina.ai/${encodeURIComponent(canonicalUrl)}`;
  const res = await fetch(readerUrl, {
    method: "GET",
    headers: { Accept: "text/plain,text/markdown,*/*" },
  });
  if (!res.ok) {
    return `取得に失敗しました (HTTP ${res.status})`;
  }
  const text = await res.text();
  if (text.length > MAX_FETCH_CHARS) {
    return `${text.slice(0, MAX_FETCH_CHARS)}\n\n…（省略）`;
  }
  return text;
}

export async function executeOllamaTool(
  name: string,
  argumentsJson: string
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    if (argumentsJson?.trim()) {
      args = JSON.parse(argumentsJson) as Record<string, unknown>;
    }
  } catch {
    return "ツール引数の JSON が不正です";
  }

  switch (name) {
    case "get_screening_context": {
      const raw = (await loadChatStockContext())?.trim() ?? "";
      if (!raw) {
        return "スクリーニングデータがまだありません。データビューアで CSV を読み込み、絞り込みを行ってください。";
      }
      if (raw.length > MAX_CONTEXT_CHARS) {
        return `${raw.slice(0, MAX_CONTEXT_CHARS)}\n\n…（長いため先頭のみ）`;
      }
      return raw;
    }
    case "fetch_public_page_text": {
      const urlStr = String(args.url ?? "").trim();
      if (!urlStr) return "url が空です";
      let u: URL;
      try {
        u = new URL(urlStr);
      } catch {
        return "URL の形式が不正です";
      }
      const block = isBlockedUrl(u);
      if (block) return block;
      if (u.protocol === "http:") {
        return "セキュリティのため https の URL のみ利用できます";
      }
      try {
        return await fetchViaJinaReader(u.toString());
      } catch (e) {
        return e instanceof Error ? e.message : "ページ取得に失敗しました";
      }
    }
    default:
      return `未知のツール: ${name}`;
  }
}
