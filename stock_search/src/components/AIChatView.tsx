import { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdClose,
  MdError,
  MdSend,
  MdSettings,
  MdSmartToy,
  MdStop,
} from "react-icons/md";
import { isTextUIPart } from "ai";
import type { UIMessage } from "ai";
import { usePersistedScreeningChat } from "../hooks/usePersistedScreeningChat";
import { useAISettings } from "../hooks/useAISettings";
import { setOllamaChatRuntimeCallbacks } from "../services/aiProviders";
import { ChatMarkdown } from "./ChatMarkdown";

function getMessageText(msg: UIMessage): string {
  return msg.parts.filter(isTextUIPart).map((p) => p.text).join("");
}

function MessageBubble({
  msg,
  embedded,
}: {
  msg: UIMessage;
  embedded?: boolean;
}) {
  const isUser = msg.role === "user";
  const text = getMessageText(msg);
  if (!text) return null;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div
          className={`mr-2.5 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            embedded
              ? "bg-white shadow-sm ring-1 ring-slate-200/80"
              : "bg-primary/10"
          }`}
        >
          <MdSmartToy
            className={`text-base ${embedded ? "text-indigo-600" : "text-primary"}`}
          />
        </div>
      )}
      <div
        className={`max-w-[min(92%,28rem)] break-words rounded-2xl px-3.5 py-2.5 text-[0.9375rem] leading-relaxed shadow-sm ${
          isUser
            ? embedded
              ? "rounded-br-md bg-indigo-600 text-white"
              : "rounded-br-md bg-primary text-primary-content"
            : embedded
              ? "rounded-bl-md border border-slate-200/90 bg-white text-slate-800"
              : "rounded-bl-md bg-base-200 text-base-content"
        }`}
      >
        <ChatMarkdown text={text} variant={isUser ? "user" : "assistant"} />
      </div>
    </div>
  );
}

export interface AIChatViewProps {
  isConfigured: boolean;
  className?: string;
  /** データビューア内パネル用のレイアウト・コンパクト説明 */
  embedded?: boolean;
  onClose?: () => void;
}

const TEXTAREA_MAX_PX = 200;

export const AIChatView = ({
  isConfigured,
  className = "",
  embedded = false,
  onClose,
}: AIChatViewProps) => {
  const { settings } = useAISettings();
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
  } = usePersistedScreeningChat();

  const [input, setInput] = useState("");
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [citationUrls, setCitationUrls] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isActive = status === "streaming" || status === "submitted";

  useEffect(() => {
    setOllamaChatRuntimeCallbacks({
      onToolStatus: setToolStatus,
      onCitationUrl: (url) => {
        setCitationUrls((prev) =>
          prev.includes(url) ? prev : [...prev, url]
        );
      },
    });
    return () => {
      setOllamaChatRuntimeCallbacks(null);
      setToolStatus(null);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, toolStatus]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleSend = () => {
    if (!input.trim() || isActive || !isConfigured) return;
    clearError();
    setCitationUrls([]);
    sendMessage({ text: input.trim() });
    setInput("");
    requestAnimationFrame(resizeTextarea);
  };

  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key !== "Enter") return;
    const ne = e.nativeEvent;
    if (ne.isComposing || ne.keyCode === 229) return;
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  };

  const shell = embedded
    ? "flex flex-col flex-1 min-h-0 bg-[#f4f4f5]"
    : "flex flex-col flex-1 min-h-0 bg-base-100";

  return (
    <div className={`${shell} ${className}`.trim()}>
      {(embedded || onClose) && (
        <header className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-sm md:rounded-none">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900">
              アシスタント
            </h2>
            {settings.model ? (
              <p className="truncate font-mono text-[10px] text-slate-500">
                {settings.model}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">モデル未選択</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-0.5">
            <Link
              to="/settings"
              className="btn btn-ghost btn-sm btn-square text-slate-500"
              title="AI 設定"
              aria-label="AI 設定を開く"
            >
              <MdSettings className="text-xl" />
            </Link>
            {onClose && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square text-slate-600"
                onClick={onClose}
                aria-label="チャットを閉じる"
                title="閉じる"
              >
                <MdClose className="text-xl" />
              </button>
            )}
          </div>
        </header>
      )}

      {!isConfigured && (
        <div className="flex flex-shrink-0 items-start gap-2 border-b border-amber-200/60 bg-amber-50/90 px-4 py-3">
          <span className="text-sm text-amber-950/80">
            AI が設定されていません。
          </span>
          <Link
            to="/settings"
            className="whitespace-nowrap text-sm font-semibold text-indigo-600 hover:underline"
          >
            設定する →
          </Link>
        </div>
      )}

      {isConfigured && (
        <div
          className={`flex-shrink-0 border-b ${
            embedded
              ? "border-slate-200/70 bg-slate-100/60 px-3 py-2"
              : "border-base-200 bg-base-100 px-4 py-2"
          }`}
        >
          {embedded ? (
            <p className="text-[11px] leading-snug text-slate-600">
              絞り込みは<strong className="font-medium text-slate-800">全カラム</strong>
              をタブ区切りで、送信時にモデルへ渡します（件数が多い場合は先頭のみ。サーバー送信なし）。
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-base-content/55">
              データビューアの絞り込みは、列は
              <strong className="font-medium text-base-content/75">
                全カラム
              </strong>
              をタブ区切りで、
              <strong className="font-medium text-base-content/75">
                送信のたびに自動でモデルへ渡ります
              </strong>
              （件数が極端に多い場合は先頭のみ。チャット欄には出しません。サーバーには保存されません）。
            </p>
          )}
        </div>
      )}

      {isConfigured && toolStatus && (
        <div
          className={`mx-3 mt-3 mb-1 flex flex-shrink-0 items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/95 px-3 py-2 text-xs text-indigo-950 ${
            embedded ? "" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="loading loading-spinner loading-xs text-indigo-600" />
          <span className="font-medium">{toolStatus}</span>
        </div>
      )}

      {isConfigured && citationUrls.length > 0 && !toolStatus && (
        <div
          className={`mx-3 mt-3 mb-1 flex flex-shrink-0 flex-col gap-1 rounded-xl border border-slate-200/90 bg-slate-50/95 px-3 py-2 text-[11px] text-slate-700 ${
            embedded ? "" : ""
          }`}
        >
          <span className="font-semibold text-slate-800">参照したページ（ツール）</span>
          <ul className="list-inside list-disc space-y-0.5 break-all">
            {citationUrls.map((u) => (
              <li key={u}>
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline hover:text-indigo-800"
                >
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isConfigured && error && (
        <div
          className="mx-3 mt-3 mb-1 flex flex-shrink-0 gap-2 rounded-xl border border-red-200/80 bg-red-50/95 px-3 py-2.5 text-sm text-red-950"
          role="alert"
        >
          <MdError className="mt-0.5 flex-shrink-0 text-xl text-red-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-red-800">
              AI（Ollama）との接続に失敗しました
            </p>
            <p className="mt-1 break-words text-xs text-red-900/85">
              {error.message}
            </p>
            <p className="mt-2 text-[11px] text-red-800/70">
              Ollama が起動しているか、設定のベース URL・モデル名が正しいか確認してください。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/settings"
                className="btn btn-xs border-red-300 bg-white text-red-800 hover:bg-red-50"
              >
                AI 設定を開く
              </Link>
              <button
                type="button"
                className="btn btn-xs btn-ghost text-red-800/80"
                onClick={() => clearError()}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-4 ${
          embedded ? "bg-[#ececf0]" : ""
        }`}
      >
        {messages.length === 0 && !isActive && (
          <div className="flex h-full min-h-[10rem] flex-col items-center justify-center px-4 text-center text-slate-500">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                embedded
                  ? "bg-white shadow-md ring-1 ring-slate-200/80"
                  : "bg-base-200/80"
              }`}
            >
              <MdSmartToy
                className={`text-3xl ${embedded ? "text-indigo-600" : "text-base-content/35"}`}
              />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              スクリーニングを AI に分析できます
            </p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
              {embedded
                ? "下の欄に質問を入力してください。絞り込みは送信時にモデルへ渡ります。"
                : "データビューアで CSV を開いてから、ここで質問してください。絞り込み内容は裏側でモデルに渡ります。"}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} embedded={embedded} />
        ))}

        {status === "submitted" && (
          <div className="mb-4 flex justify-start">
            <div
              className={`mr-2.5 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                embedded
                  ? "bg-white shadow-sm ring-1 ring-slate-200/80"
                  : "bg-primary/10"
              }`}
            >
              <MdSmartToy
                className={`text-base ${embedded ? "text-indigo-600" : "text-primary"}`}
              />
            </div>
            <div
              className={`rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm ${
                embedded
                  ? "border-slate-200/90 bg-white"
                  : "bg-base-200"
              }`}
            >
              <span className="loading loading-dots loading-xs text-slate-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className={`flex-shrink-0 border-t px-3 pb-4 pt-2 ${
          embedded
            ? "border-slate-200/80 bg-white/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
            : "border-base-200 bg-base-100 pb-4"
        }`}
      >
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div
            className={`flex items-end gap-2 rounded-2xl border px-2 py-1.5 shadow-inner transition-[box-shadow,border-color] focus-within:border-indigo-400/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] ${
              embedded
                ? "border-slate-200/90 bg-white"
                : "border-base-300 bg-base-100"
            }`}
          >
            <textarea
              ref={textareaRef}
              name="message"
              className="max-h-[200px] min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-snug text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
              placeholder={
                isConfigured
                  ? "メッセージを入力…（Enter で送信 · Shift+Enter で改行）"
                  : "AI設定が必要です"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              disabled={isActive || !isConfigured}
              rows={1}
              autoComplete="off"
              aria-label="チャット入力"
            />
            {isActive ? (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm mb-0.5 min-h-10 flex-shrink-0 gap-1 rounded-xl px-3"
                onClick={() => stop()}
                aria-label="生成を中断"
                title="生成を中断"
              >
                <MdStop className="text-lg" />
                <span className="hidden text-xs font-semibold sm:inline">
                  中断
                </span>
              </button>
            ) : (
              <button
                type="submit"
                className={`btn btn-sm mb-0.5 min-h-10 min-w-10 flex-shrink-0 rounded-xl ${
                  embedded ? "btn-primary border-0 bg-indigo-600 hover:bg-indigo-700" : ""
                }`}
                disabled={!input.trim() || !isConfigured}
                aria-label="送信"
              >
                <MdSend className="text-lg" />
              </button>
            )}
          </div>
        </form>
        {messages.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-xs mt-1 w-full text-slate-400 hover:text-slate-600"
            onClick={() => setMessages([])}
          >
            会話をリセット
          </button>
        )}
      </div>
    </div>
  );
};
