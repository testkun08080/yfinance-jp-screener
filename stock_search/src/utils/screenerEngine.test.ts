import { describe, it, expect } from "vitest";
import type { StockData, ScreenerState } from "../types/stock";
import { evaluateRow, filterStocks } from "./screenerEngine";
import { initialScreenerState } from "./searchFiltersMigration";

const baseStock: StockData = {
  会社名: "テスト株式会社",
  銘柄コード: "7203",
  業種: "輸送用機器",
  優先市場: "プライム（内国株式）",
  市場タイプ: "JP",
  PBR: 0.8,
  ROE: 0.15,
  時価総額: 50_000_000_000_000,
  ネットキャッシュ: 1_000_000_000_000,
  "ネットキャッシュ（流動資産-負債）": 1_000_000_000_000,
};

function stateWith(overrides: Partial<ScreenerState>): ScreenerState {
  return { ...initialScreenerState(), ...overrides };
}

describe("screenerEngine", () => {
  it("converts percent UI values for ROE", () => {
    const state = stateWith({
      conditions: [{ id: "1", kind: "numeric", field: "ROE", operator: "gte", value: 10 }],
    });
    expect(evaluateRow({ ...baseStock, ROE: 0.08 }, state)).toBe(false);
    expect(evaluateRow({ ...baseStock, ROE: 0.12 }, state)).toBe(true);
  });

  it("converts market cap from million yen UI", () => {
    const state = stateWith({
      conditions: [{ id: "1", kind: "numeric", field: "時価総額", operator: "gte", value: 100 }],
    });
    expect(evaluateRow(baseStock, state)).toBe(true);
    expect(evaluateRow({ ...baseStock, 時価総額: 50_000_000 }, state)).toBe(false);
  });

  it("excludes rows with missing values when excludeMissing is true", () => {
    const state = stateWith({
      excludeMissing: true,
      conditions: [{ id: "1", field: "ROE", operator: "gte", value: 5 }],
    });
    expect(evaluateRow({ ...baseStock, ROE: null }, state)).toBe(false);
    expect(evaluateRow({ ...baseStock, ROE: 0.1 }, state)).toBe(true);
  });

  it("passes rows with missing values when excludeMissing is false", () => {
    const state = stateWith({
      excludeMissing: false,
      conditions: [{ id: "1", field: "ROE", operator: "gte", value: 99 }],
    });
    expect(evaluateRow({ ...baseStock, ROE: null }, state)).toBe(true);
  });

  it("AND-combines multiple conditions", () => {
    const state = stateWith({
      conditions: [
        { id: "1", kind: "numeric", field: "PBR", operator: "lte", value: 1 },
        { id: "2", kind: "numeric", field: "ROE", operator: "gte", value: 15 },
      ],
    });
    expect(evaluateRow(baseStock, state)).toBe(true);
    expect(evaluateRow({ ...baseStock, PBR: 2 }, state)).toBe(false);
  });

  it("resolves net cash field aliases", () => {
    const state = stateWith({
      conditions: [{ id: "1", kind: "numeric", field: "ネットキャッシュ", operator: "gte", value: 500 }],
    });
    const stock = {
      ...baseStock,
      ネットキャッシュ: undefined,
      "ネットキャッシュ（流動資産-負債）": 600_000_000,
    };
    expect(evaluateRow(stock, state)).toBe(true);
  });

  it("filters by categorical industry condition", () => {
    const state = stateWith({
      conditions: [
        {
          id: "1",
          kind: "categorical",
          field: "industries",
          operator: "in",
          values: ["輸送用機器"],
        },
      ],
    });
    expect(evaluateRow(baseStock, state)).toBe(true);
    expect(evaluateRow({ ...baseStock, 業種: "銀行業" }, state)).toBe(false);
  });

  it("AND-combines numeric and categorical conditions", () => {
    const state = stateWith({
      conditions: [
        {
          id: "1",
          kind: "categorical",
          field: "market",
          operator: "in",
          values: ["プライム（内国株式）"],
        },
        { id: "2", kind: "numeric", field: "PBR", operator: "lte", value: 1 },
      ],
    });
    expect(evaluateRow(baseStock, state)).toBe(true);
    expect(evaluateRow({ ...baseStock, 優先市場: "グロース（内国株式）" }, state)).toBe(false);
  });

  it("filters and sorts dataset", () => {
    const rows: StockData[] = [
      { ...baseStock, 銘柄コード: "1", ROE: 0.2 },
      { ...baseStock, 銘柄コード: "2", ROE: 0.05 },
    ];
    const state = stateWith({
      conditions: [{ id: "1", kind: "numeric", field: "ROE", operator: "gte", value: 10 }],
      sort: { key: "ROE", direction: "desc" },
    });
    const result = filterStocks(rows, state);
    expect(result).toHaveLength(1);
    expect(result[0].銘柄コード).toBe("1");
  });
});
