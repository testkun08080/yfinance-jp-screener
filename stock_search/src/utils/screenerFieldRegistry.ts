import { FILTER_TOOLTIPS } from "../constants/tooltips";
import type { ScreenerCondition, ScreenerOperator } from "../types/stock";
import { CATEGORICAL_FIELD_LABELS, isCategoricalCondition } from "./screenerConditions";

export type ScreenerFieldKind =
  | "percent"
  | "currency_million"
  | "ratio"
  | "number"
  | "string";

export type ScreenerFieldCategory =
  | "basic"
  | "valuation"
  | "performance"
  | "balance"
  | "cash";

export interface ScreenerFieldMeta {
  field: string;
  label: string;
  kind: ScreenerFieldKind;
  category: ScreenerFieldCategory;
  unit?: string;
  aliases?: string[];
  tooltip?: string;
}

const NUMERIC_OPERATORS = ["gte", "lte", "between", "eq"] as const;

export function getAllowedOperators(kind: ScreenerFieldKind): readonly ScreenerOperator[] {
  if (kind === "string") return [];
  return NUMERIC_OPERATORS;
}

const BUILTIN_FIELDS: ScreenerFieldMeta[] = [
  { field: "時価総額", label: "時価総額", kind: "currency_million", category: "valuation", unit: "百万円", tooltip: FILTER_TOOLTIPS["時価総額"] },
  { field: "PBR", label: "PBR", kind: "ratio", category: "valuation", tooltip: FILTER_TOOLTIPS.PBR },
  { field: "ROE", label: "ROE", kind: "percent", category: "valuation", unit: "%", tooltip: FILTER_TOOLTIPS.ROE },
  { field: "自己資本比率", label: "自己資本比率", kind: "percent", category: "valuation", unit: "%", tooltip: FILTER_TOOLTIPS["自己資本比率"] },
  { field: "PER(会予)", label: "PER(会予)", kind: "ratio", category: "valuation", tooltip: FILTER_TOOLTIPS["PER(会予)"] },
  { field: "PER(過去12ヶ月)", label: "PER(過去12ヶ月)", kind: "ratio", category: "valuation", tooltip: FILTER_TOOLTIPS["PER(過去12ヶ月)"] },
  { field: "PER(前年度)", label: "PER(前年度)", kind: "ratio", category: "valuation", tooltip: FILTER_TOOLTIPS["PER(前年度)"] },
  { field: "配当方向性", label: "配当性向", kind: "percent", category: "valuation", unit: "%", tooltip: FILTER_TOOLTIPS["配当性向"] },
  { field: "配当利回り", label: "配当利回り", kind: "percent", category: "valuation", unit: "%", tooltip: FILTER_TOOLTIPS["配当利回り"] },
  { field: "EPS(過去12ヶ月)", label: "EPS(過去12ヶ月)", kind: "number", category: "valuation", tooltip: FILTER_TOOLTIPS["EPS(過去12ヶ月)"] },
  { field: "EPS(予想)", label: "EPS(予想)", kind: "number", category: "valuation", tooltip: FILTER_TOOLTIPS["EPS(予想)"] },
  { field: "EPS(前年度)", label: "EPS(前年度)", kind: "number", category: "valuation", tooltip: FILTER_TOOLTIPS["EPS(前年度)"] },
  { field: "売上高", label: "売上高", kind: "currency_million", category: "performance", unit: "百万円", tooltip: FILTER_TOOLTIPS["売上高"] },
  { field: "営業利益", label: "営業利益", kind: "currency_million", category: "performance", unit: "百万円", tooltip: FILTER_TOOLTIPS["営業利益"] },
  { field: "営業利益率", label: "営業利益率", kind: "percent", category: "performance", unit: "%", tooltip: FILTER_TOOLTIPS["営業利益率"] },
  { field: "当期純利益", label: "当期純利益", kind: "currency_million", category: "performance", unit: "百万円", tooltip: FILTER_TOOLTIPS["当期純利益"] },
  { field: "純利益率", label: "純利益率", kind: "percent", category: "performance", unit: "%", tooltip: FILTER_TOOLTIPS["純利益率"] },
  { field: "負債", label: "負債", kind: "currency_million", category: "balance", unit: "百万円", tooltip: FILTER_TOOLTIPS["負債"] },
  { field: "流動負債", label: "流動負債", kind: "currency_million", category: "balance", unit: "百万円", tooltip: FILTER_TOOLTIPS["流動負債"] },
  { field: "流動資産", label: "流動資産", kind: "currency_million", category: "balance", unit: "百万円", tooltip: FILTER_TOOLTIPS["流動資産"] },
  { field: "総負債", label: "総負債", kind: "currency_million", category: "balance", unit: "百万円", tooltip: FILTER_TOOLTIPS["総負債"] },
  { field: "現金及び現金同等物", label: "現金及び現金同等物", kind: "currency_million", category: "cash", unit: "百万円", tooltip: FILTER_TOOLTIPS["現金及び現金同等物"] },
  { field: "投資有価証券", label: "投資有価証券", kind: "currency_million", category: "balance", unit: "百万円", tooltip: FILTER_TOOLTIPS["投資有価証券"] },
  {
    field: "ネットキャッシュ",
    label: "ネットキャッシュ",
    kind: "currency_million",
    category: "cash",
    unit: "百万円",
    aliases: ["ネットキャッシュ（流動資産-負債）"],
    tooltip: FILTER_TOOLTIPS["ネットキャッシュ"],
  },
  {
    field: "ネットキャッシュ（流動資産-負債）",
    label: "ネットキャッシュ",
    kind: "currency_million",
    category: "cash",
    unit: "百万円",
    aliases: ["ネットキャッシュ"],
    tooltip: FILTER_TOOLTIPS["ネットキャッシュ"],
  },
  { field: "ネットキャッシュ比率", label: "ネットキャッシュ比率", kind: "percent", category: "cash", unit: "%", tooltip: FILTER_TOOLTIPS["ネットキャッシュ比率"] },
];

const registryByField = new Map<string, ScreenerFieldMeta>();
for (const meta of BUILTIN_FIELDS) {
  registryByField.set(meta.field, meta);
}

export function getFieldMeta(field: string): ScreenerFieldMeta | undefined {
  return registryByField.get(field);
}

export function resolveStockFieldValue(
  stock: Record<string, string | number | null | undefined>,
  field: string
): number | string | null | undefined {
  const meta = getFieldMeta(field);
  const keys = [field, ...(meta?.aliases ?? [])];
  for (const key of keys) {
    const v = stock[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return stock[field];
}

export function uiValueToStored(kind: ScreenerFieldKind, uiValue: number): number {
  switch (kind) {
    case "percent":
      return uiValue / 100;
    case "currency_million":
      return uiValue * 1_000_000;
    default:
      return uiValue;
  }
}

export function storedValueToUi(kind: ScreenerFieldKind, stored: number): number {
  switch (kind) {
    case "percent":
      return stored * 100;
    case "currency_million":
      return stored / 1_000_000;
    default:
      return stored;
  }
}

const EXCLUDED_COLUMNS = new Set([
  "会社名",
  "銘柄コード",
  "コード",
  "業種",
  "優先市場",
  "市場タイプ",
  "決算月",
  "都道府県",
  "_source_file",
  "_row_index",
]);

function inferKindFromSample(sample: unknown): ScreenerFieldKind {
  if (typeof sample !== "number") return "string";
  if (sample >= 0 && sample <= 1 && !Number.isInteger(sample)) return "percent";
  return "number";
}

export function buildScreenableFields(
  columns: string[],
  sampleRow?: Record<string, unknown>
): ScreenerFieldMeta[] {
  const seen = new Set<string>();
  const result: ScreenerFieldMeta[] = [];

  for (const col of columns) {
    if (EXCLUDED_COLUMNS.has(col) || col.startsWith("_")) continue;
    const builtin = registryByField.get(col);
    if (builtin) {
      if (!seen.has(builtin.field)) {
        seen.add(builtin.field);
        result.push(builtin);
      }
      continue;
    }
    const sample = sampleRow?.[col];
    const kind =
      typeof sample === "number"
        ? inferKindFromSample(sample)
        : sample === undefined || sample === null
          ? "number"
          : "string";
    if (kind === "string") continue;
    if (!seen.has(col)) {
      seen.add(col);
      result.push({
        field: col,
        label: col,
        kind,
        category: "basic",
        unit: kind === "percent" ? "%" : kind === "currency_million" ? "百万円" : undefined,
      });
    }
  }

  const categoryOrder: ScreenerFieldCategory[] = [
    "valuation",
    "performance",
    "balance",
    "cash",
    "basic",
  ];
  result.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label, "ja");
  });

  return result;
}

export const OPERATOR_LABELS: Record<ScreenerOperator, string> = {
  gte: "以上",
  lte: "以下",
  between: "範囲",
  eq: "等しい",
};

export function formatConditionSummary(
  condition: ScreenerCondition,
  meta?: ScreenerFieldMeta
): string {
  if (isCategoricalCondition(condition)) {
    const label = CATEGORICAL_FIELD_LABELS[condition.field];
    const n = condition.values.length;
    if (n === 0) return `${label}: 未選択`;
    if (n <= 2) return `${label}: ${condition.values.join("・")}`;
    return `${label}: ${condition.values[0]} 他${n - 1}件`;
  }
  const label = meta?.label ?? condition.field;
  const unit = meta?.unit ?? "";
  const op = OPERATOR_LABELS[condition.operator];
  if (condition.operator === "between" && Array.isArray(condition.value)) {
    const [a, b] = condition.value;
    return `${label} ${a}〜${b}${unit}`;
  }
  const v = condition.value as number;
  return `${label} ${op} ${v}${unit}`;
}
