import type { CategoricalConditionField, SearchFilters, ScreenerCondition, ScreenerState } from "../types/stock";
import { createCategoricalCondition, normalizeScreener } from "./screenerConditions";

function newId(): string {
  return crypto.randomUUID();
}

type RangeMapping = {
  field: string;
  minKey: keyof SearchFilters;
  maxKey: keyof SearchFilters;
};

const RANGE_MAPPINGS: RangeMapping[] = [
  { field: "時価総額", minKey: "marketCapMin", maxKey: "marketCapMax" },
  { field: "PBR", minKey: "pbrMin", maxKey: "pbrMax" },
  { field: "ROE", minKey: "roeMin", maxKey: "roeMax" },
  { field: "売上高", minKey: "revenueMin", maxKey: "revenueMax" },
  { field: "営業利益", minKey: "operatingProfitMin", maxKey: "operatingProfitMax" },
  { field: "営業利益率", minKey: "operatingMarginMin", maxKey: "operatingMarginMax" },
  { field: "当期純利益", minKey: "netProfitMin", maxKey: "netProfitMax" },
  { field: "純利益率", minKey: "netMarginMin", maxKey: "netMarginMax" },
  { field: "自己資本比率", minKey: "equityRatioMin", maxKey: "equityRatioMax" },
  { field: "PER(会予)", minKey: "forwardPEMin", maxKey: "forwardPEMax" },
  { field: "PER(過去12ヶ月)", minKey: "trailingPEMin", maxKey: "trailingPEMax" },
  { field: "PER(前年度)", minKey: "previousYearPEMin", maxKey: "previousYearPEMax" },
  { field: "配当方向性", minKey: "dividendDirectionMin", maxKey: "dividendDirectionMax" },
  { field: "配当利回り", minKey: "dividendYieldMin", maxKey: "dividendYieldMax" },
  { field: "EPS(過去12ヶ月)", minKey: "trailingEpsMin", maxKey: "trailingEpsMax" },
  { field: "EPS(予想)", minKey: "forwardEpsMin", maxKey: "forwardEpsMax" },
  { field: "EPS(前年度)", minKey: "previousYearEpsMin", maxKey: "previousYearEpsMax" },
  { field: "負債", minKey: "totalLiabilitiesMin", maxKey: "totalLiabilitiesMax" },
  { field: "流動負債", minKey: "currentLiabilitiesMin", maxKey: "currentLiabilitiesMax" },
  { field: "流動資産", minKey: "currentAssetsMin", maxKey: "currentAssetsMax" },
  { field: "総負債", minKey: "totalDebtMin", maxKey: "totalDebtMax" },
  { field: "現金及び現金同等物", minKey: "cashMin", maxKey: "cashMax" },
  { field: "投資有価証券", minKey: "investmentsMin", maxKey: "investmentsMax" },
  { field: "ネットキャッシュ", minKey: "netCashMin", maxKey: "netCashMax" },
  { field: "ネットキャッシュ比率", minKey: "netCashRatioMin", maxKey: "netCashRatioMax" },
];

export function searchFiltersToConditions(filters: Partial<SearchFilters>): ScreenerCondition[] {
  const conditions: ScreenerCondition[] = [];

  for (const { field, minKey, maxKey } of RANGE_MAPPINGS) {
    const minVal = filters[minKey];
    const maxVal = filters[maxKey];
    if (minVal !== null && minVal !== undefined && maxVal !== null && maxVal !== undefined) {
      conditions.push({
        id: newId(),
        kind: "numeric",
        field,
        operator: "between",
        value: [minVal as number, maxVal as number],
      });
      continue;
    }
    if (minVal !== null && minVal !== undefined) {
      conditions.push({
        id: newId(),
        kind: "numeric",
        field,
        operator: "gte",
        value: minVal as number,
      });
    }
    if (maxVal !== null && maxVal !== undefined) {
      conditions.push({
        id: newId(),
        kind: "numeric",
        field,
        operator: "lte",
        value: maxVal as number,
      });
    }
  }

  const categorical: { field: CategoricalConditionField; key: keyof SearchFilters }[] = [
    { field: "industries", key: "industries" },
    { field: "market", key: "market" },
    { field: "prefecture", key: "prefecture" },
  ];
  for (const { field, key } of categorical) {
    const values = filters[key];
    if (Array.isArray(values) && values.length > 0) {
      conditions.push(createCategoricalCondition(field, [...values]));
    }
  }

  return conditions;
}

export const initialScreenerState = (): ScreenerState => ({
  conditions: [],
  companyName: "",
  stockCode: "",
  industries: [],
  market: [],
  prefecture: [],
  marketType: ["JP", "US"],
  excludeMissing: false,
  sort: null,
});

export function searchFiltersToScreenerState(filters: Partial<SearchFilters>): ScreenerState {
  return normalizeScreener({
    ...initialScreenerState(),
    companyName: filters.companyName ?? "",
    stockCode: filters.stockCode ?? "",
    industries: filters.industries ?? [],
    market: filters.market ?? [],
    prefecture: filters.prefecture ?? [],
    marketType: filters.marketType ?? ["JP", "US"],
    conditions: searchFiltersToConditions(filters),
  });
}
