import { useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useAISettings } from "./useAISettings";
import { createCustomFetch } from "../services/aiProviders";
import {
  loadPersistedChatMessages,
  persistChatMessages,
} from "../utils/aiChatPersistence";
import { AI_CHAT_ID, AI_CHAT_STORAGE_KEY } from "../constants/aiChat";

export function usePersistedScreeningChat() {
  const { settings } = useAISettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const customFetch = useRef<typeof fetch>(
    (...args: Parameters<typeof fetch>) =>
      createCustomFetch(settingsRef.current)(...args)
  ).current;

  const initialMessages = useMemo(() => loadPersistedChatMessages(), []);

  const {
    id,
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
  } = useChat({
    id: AI_CHAT_ID,
    messages: initialMessages,
    transport: new TextStreamChatTransport({ fetch: customFetch }),
  });

  useEffect(() => {
    persistChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AI_CHAT_STORAGE_KEY || e.newValue == null) return;
      if (status === "streaming" || status === "submitted") return;
      try {
        const parsed = JSON.parse(e.newValue) as UIMessage[];
        setMessages(parsed);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setMessages, status]);

  return {
    id,
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
  };
}
