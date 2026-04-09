import type { UIMessage } from "ai";
import { AI_CHAT_STORAGE_KEY } from "../constants/aiChat";

export function loadPersistedChatMessages(): UIMessage[] {
  try {
    const raw = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as UIMessage[];
  } catch {
    return [];
  }
}

export function persistChatMessages(messages: UIMessage[]): void {
  try {
    localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* quota 等 */
  }
}
