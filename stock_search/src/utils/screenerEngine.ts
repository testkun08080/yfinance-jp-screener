import type { StockData, ScreenerCondition, ScreenerState, SortConfig } from "../types/stock";
import {
  getFieldMeta,
  resolveStockFieldValue,
  uiValueToStored,
  type ScreenerFieldKind,
} from "./screenerFieldRegistry";

export function detectMarketTypeFromTicker(ticker: string): "JP" | "US" {
  if (!ticker) return "JP";
  const tickerStr = String(ticker).trim();
  if (tickerStr.endsWith(".T")) return "JP";
  if (/^\d{4}$/.test(tickerStr)) return "JP";
  if (/^[A-Z]{1,5}$/i.test(tickerStr)) return "US";
  return "JP";
}

function getNumericValue(
  stock: StockData,
  field: string
): number | null {
  const raw = resolveStockFieldValue(stock, field);
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const parsed = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function compareCondition(
  stock: StockData,
  condition: ScreenerCondition,
  excludeMissing: boolean
): boolean {
  const meta = getFieldMeta(condition.field);
  const kind: ScreenerFieldKind = meta?.kind ?? "number";
  const value = getNumericValue(stock, condition.field);

  if (value === null) {
    return !excludeMissing;
  }

  const toStored = (ui: number) => uiValueToStored(kind, ui);

  switch (condition.operator) {
    case "gte":
      return value >= toStored(condition.value as number);
    case "lte":
      return value <= toStored(condition.value as number);
    case "eq": {
      const target = toStored(condition.value as number);
      const epsilon = kind === "ratio" ? 0.0001 : 0.000001;
      return Math.abs(value - target) <= epsilon;
    }
    case "between": {
      const [minUi, maxUi] = condition.value as [number, number];
      const min = toStored(minUi);
      const max = toStored(maxUi);
      return value >= min && value <= max;
    }
    default:
      return true;
  }
}

export function evaluateRow(stock: StockData, state: ScreenerState): boolean {
  if (state.companyName) {
    const companyNameStr = (stock.会社名 || "").toLowerCase();
    if (!companyNameStr.includes(state.companyName.toLowerCase())) return false;
  }

  if (state.stockCode) {
    const stockCode = stock.銘柄コード || stock.コード || "";
    if (!stockCode.toString().includes(state.stockCode)) return false;
  }

  if (state.industries.length > 0 && !state.industries.includes(stock.業種 || "")) {
    return false;
  }

  if (state.marketType && state.marketType.length > 0) {
    const stockMarketType =
      stock.市場タイプ || detectMarketTypeFromTicker(stock.銘柄コード || stock.コード || "");
    if (!state.marketType.includes(stockMarketType as "JP" | "US")) return false;
  }

  if (state.market.length > 0 && !state.market.includes(stock.優先市場 || "")) {
    return false;
  }

  if (state.prefecture.length > 0) {
    const stockMarketType =
      stock.市場タイプ || detectMarketTypeFromTicker(stock.銘柄コード || stock.コード || "");
    if (stockMarketType === "JP" && !state.prefecture.includes(stock.都道府県 || "")) {
      return false;
    }
  }

  for (const condition of state.conditions) {
    if (!compareCondition(stock, condition, state.excludeMissing)) {
      return false;
    }
  }

  return true;
}

function sortRows(data: StockData[], sort: SortConfig | null): StockData[] {
  if (!sort) return data;
  const sorted = [...data];
  sorted.sort((a, b) => {
    const aValue = a[sort.key];
    const bValue = b[sort.key];
    if (aValue === null && bValue === null) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    let result = 0;
    if (typeof aValue === "string" && typeof bValue === "string") {
      result = aValue.localeCompare(bValue, "ja-JP");
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      result = aValue - bValue;
    }
    return sort.direction === "desc" ? -result : result;
  });
  return sorted;
}

export function filterStocks(data: StockData[], state: ScreenerState): StockData[] {
  const filtered = data.filter((stock) => evaluateRow(stock, state));
  return sortRows(filtered, state.sort);
}
