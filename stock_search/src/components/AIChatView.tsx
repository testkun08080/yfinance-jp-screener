import { useEffect, useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { MdSend, MdSmartToy, MdStop } from "react-icons/md";
import { isTextUIPart } from "ai";
import type { UIMessage } from "ai";
import { usePersistedScreeningChat } from "../hooks/usePersistedScreeningChat";
import { ChatMarkdown } from "./ChatMarkdown";

function getMessageText(msg: UIMessage): string {
  return msg.parts.filter(isTextUIPart).map((p) => p.text).join("");
}

function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";
  const text = getMessageText(msg);
  if (!text) return null;
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
          <MdSmartToy className="text-primary text-sm" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${
          isUser
            ? "bg-primary text-primary-content rounded-br-sm"
            : "bg-base-200 text-base-content rounded-bl-sm"
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
}

const TEXTAREA_MAX_PX = 200;

export const AIChatView = ({
  isConfigured,
  className = "",
}: AIChatViewProps) => {
  const { messages, setMessages, sendMessage, status, stop } =
    usePersistedScreeningChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isActive = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

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

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 bg-base-100 ${className}`.trim()}
    >
      {!isConfigured && (
        <div className="px-4 py-3 bg-warning/10 border-b border-warning/20 flex items-start gap-2 flex-shrink-0">
          <span className="text-sm text-warning-content/80">
            AI が設定されていません。
          </span>
          <Link
            to="/settings"
            className="text-sm text-primary font-semibold hover:underline whitespace-nowrap"
          >
            設定する →
          </Link>
        </div>
      )}

      {isConfigured && (
        <div className="px-4 py-2 border-b border-base-100 flex-shrink-0">
          <p className="text-[11px] text-base-content/55 leading-relaxed">
            データビューアの絞り込みは、列は
            <strong className="font-medium text-base-content/75">全カラム</strong>
            をタブ区切りで、
            <strong className="font-medium text-base-content/75">
              送信のたびに自動でモデルへ渡ります
            </strong>
            （件数が極端に多い場合は先頭のみ。チャット欄には出しません。サーバーには保存されません）。
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar min-h-0">
        {messages.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full min-h-[12rem] text-center text-base-content/40">
            <MdSmartToy className="text-5xl mb-3" />
            <p className="text-sm font-medium">スクリーニングを AI に分析できます</p>
            <p className="text-xs mt-1 max-w-xs">
              データビューアで CSV を開いてから、ここで質問してください。絞り込み内容は裏側でモデルに渡ります。
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {status === "submitted" && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
              <MdSmartToy className="text-primary text-sm" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-base-200 text-sm">
              <span className="loading loading-dots loading-xs text-base-content/40" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-3 pb-4 pt-2 border-t border-base-200 flex-shrink-0 bg-base-100">
        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <textarea
            ref={textareaRef}
            name="message"
            className="textarea textarea-bordered flex-1 resize-none text-sm min-h-[48px] max-h-[200px] leading-snug rounded-2xl py-3 px-4"
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
              className="btn btn-outline btn-error btn-sm flex-shrink-0 min-h-[48px] px-3 rounded-2xl gap-1"
              onClick={() => stop()}
              aria-label="生成を中断"
              title="生成を中断"
            >
              <MdStop className="text-lg" />
              <span className="hidden sm:inline text-xs font-semibold">中断</span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-sm flex-shrink-0 min-h-[48px] min-w-[48px] rounded-2xl"
              disabled={!input.trim() || !isConfigured}
              aria-label="送信"
            >
              <MdSend className="text-lg" />
            </button>
          )}
        </form>
        {messages.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-base-content/40 mt-2 w-full"
            onClick={() => setMessages([])}
          >
            会話をリセット
          </button>
        )}
      </div>
    </div>
  );
};
