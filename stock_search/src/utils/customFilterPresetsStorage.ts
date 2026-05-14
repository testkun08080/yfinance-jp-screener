import type { SavedFilterPreset, SearchFilters } from "../types/stock";

const STORAGE_KEY = "yfinance-jp-screener-custom-filter-presets";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function looksLikeSearchFilters(obj: Record<string, unknown>): boolean {
  return typeof obj.companyName === "string" && Array.isArray(obj.industries);
}

export function loadCustomFilterPresets(): SavedFilterPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: SavedFilterPreset[] = [];
    for (const item of parsed) {
      if (!isRecord(item)) continue;
      const id = item.id;
      const label = item.label;
      const filters = item.filters;
      if (typeof id !== "string" || typeof label !== "string" || !isRecord(filters)) continue;
      if (!looksLikeSearchFilters(filters)) continue;
      out.push({ id, label, filters: filters as unknown as SearchFilters });
    }
    return out;
  } catch {
    return [];
  }
}

export function persistCustomFilterPresets(presets: SavedFilterPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // quota / private mode
  }
}
