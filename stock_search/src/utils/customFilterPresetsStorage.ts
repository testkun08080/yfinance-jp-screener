import type { SavedFilterPreset, ScreenerCondition, SearchFilters } from "../types/stock";
import { searchFiltersToConditions } from "./searchFiltersMigration";

const STORAGE_KEY = "yfinance-jp-screener-custom-filter-presets";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function looksLikeSearchFilters(obj: Record<string, unknown>): boolean {
  return typeof obj.companyName === "string" && Array.isArray(obj.industries);
}

function isScreenerConditionArray(arr: unknown): arr is ScreenerCondition[] {
  if (!Array.isArray(arr) || arr.length === 0) return Array.isArray(arr);
  return arr.every(
    (c) =>
      isRecord(c) &&
      typeof c.id === "string" &&
      typeof c.field === "string" &&
      typeof c.operator === "string"
  );
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
      if (typeof id !== "string" || typeof label !== "string") continue;

      if (isScreenerConditionArray(item.conditions)) {
        out.push({
          id,
          label,
          conditions: item.conditions as ScreenerCondition[],
          screener: isRecord(item.screener)
            ? (item.screener as SavedFilterPreset["screener"])
            : undefined,
        });
        continue;
      }

      const filters = item.filters;
      if (isRecord(filters) && looksLikeSearchFilters(filters)) {
        out.push({
          id,
          label,
          conditions: searchFiltersToConditions(filters as unknown as SearchFilters),
          screener: {
            companyName: (filters.companyName as string) ?? "",
            stockCode: (filters.stockCode as string) ?? "",
            industries: (filters.industries as string[]) ?? [],
            market: (filters.market as string[]) ?? [],
            prefecture: (filters.prefecture as string[]) ?? [],
            marketType: (filters.marketType as ("JP" | "US")[]) ?? ["JP", "US"],
            excludeMissing: false,
          },
        });
      }
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
