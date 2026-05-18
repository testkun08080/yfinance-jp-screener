import type { ScreenerCondition } from "../types/stock";

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  conditions: ScreenerCondition[];
}

function cond(
  field: string,
  operator: ScreenerCondition["operator"],
  value: ScreenerCondition["value"]
): ScreenerCondition {
  return {
    id: `preset-${field}-${operator}`,
    field,
    operator,
    value,
  };
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "value",
    label: "バリュー株",
    description: "PBR 1倍未満 ＋ ROE 8%以上の割安・高収益株",
    conditions: [cond("PBR", "lte", 1.0), cond("ROE", "gte", 8)],
  },
  {
    id: "high-dividend",
    label: "高配当",
    description: "配当利回り 3%以上の高配当銘柄",
    conditions: [cond("配当利回り", "gte", 3)],
  },
  {
    id: "net-cash",
    label: "ネットキャッシュ豊富",
    description: "ネットキャッシュ比率 50%以上（現金が時価総額の半分超）",
    conditions: [cond("ネットキャッシュ比率", "gte", 50)],
  },
  {
    id: "quality",
    label: "優良収益",
    description: "営業利益率10%以上 ＋ 自己資本比率50%以上の財務健全株",
    conditions: [cond("営業利益率", "gte", 10), cond("自己資本比率", "gte", 50)],
  },
  {
    id: "low-pbr-high-roe",
    label: "低PBR高ROE",
    description: "PBR 1.5倍未満 ＋ ROE 15%以上。割安かつ高収益の優良株",
    conditions: [cond("PBR", "lte", 1.5), cond("ROE", "gte", 15)],
  },
];
