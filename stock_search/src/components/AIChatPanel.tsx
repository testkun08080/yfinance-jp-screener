import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MdClose, MdSend, MdSmartToy, MdSettings } from "react-icons/md";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, isTextUIPart } from "ai";
import type { UIMessage } from "ai";
import type { StockData } from "../types/stock";
import { useAISettings } from "../hooks/useAISettings";
import { createCustomFetch } from "../services/aiProviders";
import { buildStockContext } from "../utils/aiContext";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filteredData: StockData[];
  isConfigured: boolean;
}

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
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-primary text-primary-content rounded-br-sm"
            : "bg-base-200 text-base-content rounded-bl-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export const AIChatPanel = ({
  isOpen,
  onClose,
  filteredData,
  isConfigured,
}: AIChatPanelProps) => {
  const { settings } = useAISettings();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // settings が変わっても customFetch は安定した参照を保つ（ref で最新を参照）
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const customFetch = useRef<typeof fetch>(
    (...args: Parameters<typeof fetch>) =>
      createCustomFetch(settingsRef.current)(...args)
  ).current;

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ fetch: customFetch }),
  });

  const isActive = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isActive || !isConfigured) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendContext = () => {
    if (!filteredData.length || isActive || !isConfigured) return;
    sendMessage({ text: buildStockContext(filteredData) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="閉じる"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:w-[400px] h-full bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-base-200 flex-shrink-0">
          <MdSmartToy className="text-primary text-xl" />
          <span className="font-semibold text-base-content flex-1">AI 分析</span>
          <Link
            to="/settings"
            className="btn btn-ghost btn-xs gap-1 text-base-content/50 hover:text-base-content"
            title="AI設定"
            onClick={onClose}
          >
            <MdSettings className="text-sm" />
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="閉じる"
          >
            <MdClose />
          </button>
        </div>

        {/* Not configured notice */}
        {!isConfigured && (
          <div className="px-4 py-3 bg-warning/10 border-b border-warning/20 flex items-start gap-2 flex-shrink-0">
            <span className="text-sm text-warning-content/80">
              AI が設定されていません。
            </span>
            <Link
              to="/settings"
              className="text-sm text-primary font-semibold hover:underline whitespace-nowrap"
              onClick={onClose}
            >
              設定する →
            </Link>
          </div>
        )}

        {/* Context send button */}
        {filteredData.length > 0 && (
          <div className="px-4 py-2 border-b border-base-100 flex-shrink-0">
            <button
              type="button"
              className="btn btn-outline btn-primary btn-xs w-full gap-1"
              onClick={handleSendContext}
              disabled={isActive || !isConfigured}
            >
              <MdSmartToy className="text-sm" />
              現在の絞り込み結果 {filteredData.length.toLocaleString()} 件を送信して分析
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {messages.length === 0 && !isActive && (
            <div className="flex flex-col items-center justify-center h-full text-center text-base-content/40">
              <MdSmartToy className="text-5xl mb-3" />
              <p className="text-sm font-medium">
                スクリーニング結果を AI に送って分析できます
              </p>
              <p className="text-xs mt-1">
                上のボタンで現在の絞り込み結果を一括送信、
                <br />
                または下のテキスト入力で自由に質問できます
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Streaming / submitted indicator */}
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

        {/* Input */}
        <div className="px-3 pb-4 pt-2 border-t border-base-200 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              className="textarea textarea-bordered flex-1 resize-none text-sm min-h-[44px] max-h-32 leading-snug"
              placeholder={
                isConfigured
                  ? "メッセージを入力（Enter で送信、Shift+Enter で改行）"
                  : "AI設定が必要です"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isActive || !isConfigured}
              rows={1}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm flex-shrink-0 h-[44px]"
              onClick={handleSend}
              disabled={isActive || !input.trim() || !isConfigured}
              aria-label="送信"
            >
              {isActive ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <MdSend className="text-base" />
              )}
            </button>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-base-content/40 mt-1 w-full"
              onClick={() => setMessages([])}
            >
              会話をリセット
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
