import { useState, useCallback } from "react";
import type { AISettings } from "../types/ai";
import { AI_STORAGE_KEY, AI_DEFAULT_SETTINGS } from "../constants/ai";

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return { ...AI_DEFAULT_SETTINGS };
    return { ...AI_DEFAULT_SETTINGS, ...JSON.parse(raw) } as AISettings;
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
      const next = { ...prev, ...patch };
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
    settings.provider === "ollama"
      ? settings.baseUrl.trim() !== ""
      : settings.apiKey.trim() !== "";

  return { settings, updateSettings, resetSettings, isConfigured };
}
