import type { ScreenerCondition, ScreenerState, SortConfig } from "../types/stock";
import { urlParamsToFilters } from "./urlParamsLegacy";
import { searchFiltersToScreenerState } from "./searchFiltersMigration";

function encodeCondition(c: ScreenerCondition): string {
  if (c.operator === "between" && Array.isArray(c.value)) {
    return `${encodeURIComponent(c.field)}:between:${c.value[0]}~${c.value[1]}`;
  }
  return `${encodeURIComponent(c.field)}:${c.operator}:${c.value}`;
}

function decodeCondition(token: string): ScreenerCondition | null {
  const parts = token.split(":");
  if (parts.length < 3) return null;
  const field = decodeURIComponent(parts[0]);
  const operator = parts[1] as ScreenerCondition["operator"];
  const raw = parts.slice(2).join(":");
  if (!["gte", "lte", "between", "eq"].includes(operator)) return null;

  if (operator === "between") {
    const [a, b] = raw.split("~");
    const min = parseFloat(a);
    const max = parseFloat(b);
    if (Number.isNaN(min) || Number.isNaN(max)) return null;
    return { id: crypto.randomUUID(), field, operator, value: [min, max] };
  }
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return null;
  return { id: crypto.randomUUID(), field, operator, value: num };
}

export const screenerToUrlParams = (screener: ScreenerState): URLSearchParams => {
  const params = new URLSearchParams();

  if (screener.companyName) params.set("company", screener.companyName);
  if (screener.stockCode) params.set("code", screener.stockCode);
  if (screener.market.length > 0) params.set("market", screener.market.join(","));
  if (screener.prefecture.length > 0) params.set("prefecture", screener.prefecture.join(","));
  if (screener.industries.length > 0) params.set("industries", screener.industries.join(","));
  if (screener.marketType.length > 0) params.set("marketType", screener.marketType.join(","));
  if (screener.excludeMissing) params.set("excludeMissing", "1");

  if (screener.conditions.length > 0) {
    params.set("sc", screener.conditions.map(encodeCondition).join(","));
  }

  if (screener.sort) {
    params.set("sort", String(screener.sort.key));
    params.set("sortDir", screener.sort.direction);
  }

  return params;
};

export const urlParamsToScreener = (searchParams: URLSearchParams): Partial<ScreenerState> => {
  const partial: Partial<ScreenerState> = {};

  const company = searchParams.get("company");
  if (company) partial.companyName = company;

  const code = searchParams.get("code");
  if (code) partial.stockCode = code;

  const market = searchParams.get("market");
  if (market) partial.market = market.split(",").filter(Boolean);

  const prefecture = searchParams.get("prefecture");
  if (prefecture) partial.prefecture = prefecture.split(",").filter(Boolean);

  const industries = searchParams.get("industries");
  if (industries) partial.industries = industries.split(",").filter(Boolean);

  const marketType = searchParams.get("marketType");
  if (marketType) {
    partial.marketType = marketType.split(",").filter(Boolean) as ("JP" | "US")[];
  }

  if (searchParams.get("excludeMissing") === "1") {
    partial.excludeMissing = true;
  }

  const sc = searchParams.get("sc");
  if (sc) {
    const conditions: ScreenerCondition[] = [];
    for (const token of sc.split(",")) {
      const decoded = decodeCondition(token.trim());
      if (decoded) conditions.push(decoded);
    }
    if (conditions.length > 0) partial.conditions = conditions;
  }

  const sortKey = searchParams.get("sort");
  const sortDir = searchParams.get("sortDir");
  if (sortKey && (sortDir === "asc" || sortDir === "desc")) {
    partial.sort = { key: sortKey, direction: sortDir } as SortConfig;
  }

  return partial;
};

/** 新形式 + 旧 SearchFilters 形式の読み取り互換 */
export function mergeUrlIntoScreener(
  current: ScreenerState,
  searchParams: URLSearchParams
): ScreenerState {
  const fromNew = urlParamsToScreener(searchParams);
  const hasNew =
    searchParams.has("sc") ||
    searchParams.has("code") ||
    searchParams.has("excludeMissing") ||
    searchParams.has("sort");

  if (hasNew || Object.keys(fromNew).length > 0) {
    return {
      ...current,
      ...fromNew,
      conditions: fromNew.conditions ?? current.conditions,
      sort: fromNew.sort !== undefined ? fromNew.sort : current.sort,
    };
  }

  const legacy = urlParamsToFilters(searchParams);
  if (Object.keys(legacy).length === 0) return current;

  const migrated = searchFiltersToScreenerState(legacy);
  return {
    ...current,
    ...migrated,
    conditions: migrated.conditions.length > 0 ? migrated.conditions : current.conditions,
  };
}

export const updateUrlWithScreener = (screener: ScreenerState) => {
  const params = screenerToUrlParams(screener);
  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
};

export const generateShareUrl = (screener: ScreenerState): string => {
  const params = screenerToUrlParams(screener);
  const qs = params.toString();
  return qs
    ? `${window.location.origin}${window.location.pathname}?${qs}`
    : `${window.location.origin}${window.location.pathname}`;
};
