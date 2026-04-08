import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MdClose, MdSend, MdSmartToy, MdSettings } from "react-icons/md";
import type { StockData } from "../types/stock";
import type { ChatMessage } from "../types/ai";
import { useAISettings } from "../hooks/useAISettings";
import { callAI } from "../services/aiProviders";
import { buildStockContext } from "../utils/aiContext";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filteredData: StockData[];
  isConfigured: boolean;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
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
        {msg.content}
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingText("");

      const history = [
        ...messages,
        userMsg,
      ].map((m) => ({ role: m.role, content: m.content }));

      let accumulated = "";

      try {
        await callAI(settings, history, (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        });

        const assistantMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          content: accumulated,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        const errMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          content: `エラーが発生しました: ${e instanceof Error ? e.message : String(e)}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [messages, settings, isStreaming]
  );

  const handleSendContext = useCallback(() => {
    if (filteredData.length === 0) return;
    const context = buildStockContext(filteredData);
    sendMessage(context);
  }, [filteredData, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
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
              disabled={isStreaming || !isConfigured}
            >
              <MdSmartToy className="text-sm" />
              現在の絞り込み結果 {filteredData.length.toLocaleString()} 件を送信して分析
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {messages.length === 0 && !isStreaming && (
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

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex justify-start mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <MdSmartToy className="text-primary text-sm" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-base-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {streamingText || (
                  <span className="flex gap-1 items-center text-base-content/40">
                    <span className="loading loading-dots loading-xs" />
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 pb-4 pt-2 border-t border-base-200 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              className="textarea textarea-bordered flex-1 resize-none text-sm min-h-[44px] max-h-32 leading-snug"
              placeholder={
                isConfigured
                  ? "メッセージを入力（Enter で送信、Shift+Enter で改行）"
                  : "AI設定が必要です"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || !isConfigured}
              rows={1}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm flex-shrink-0 h-[44px]"
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim() || !isConfigured}
              aria-label="送信"
            >
              {isStreaming ? (
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
