import { useState, useCallback } from "react";
import type { AISettings } from "../types/ai";
import { AI_STORAGE_KEY, AI_DEFAULT_SETTINGS } from "../constants/ai";

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return { ...AI_DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AISettings> & { provider?: string };
    // 以前のクラウド系プロバイダは廃止 — 設定を初期化
    if (parsed.provider && parsed.provider !== "ollama") {
      return { ...AI_DEFAULT_SETTINGS };
    }
    const merged = {
      ...AI_DEFAULT_SETTINGS,
      ...parsed,
      provider: "ollama" as const,
      apiKey: "",
    };
    // 旧デフォルト（…/11434 のみ）→ OpenAI 互換パス用に /v1 を付与
    if (
      merged.baseUrl === "http://localhost:11434" ||
      merged.baseUrl === "http://127.0.0.1:11434"
    ) {
      merged.baseUrl = `${merged.baseUrl}/v1`;
    }
    return merged;
  } catch {
    return { ...AI_DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: AISettings): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(loadSettings);

  const updateSettings = useCallback((patch: Partial<AISettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, provider: "ollama" as const, apiKey: "" };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = { ...AI_DEFAULT_SETTINGS };
    saveSettings(defaults);
    setSettings(defaults);
  }, []);

  const isConfigured =
    settings.baseUrl.trim() !== "" && settings.model.trim() !== "";

  return { settings, updateSettings, resetSettings, isConfigured };
}
