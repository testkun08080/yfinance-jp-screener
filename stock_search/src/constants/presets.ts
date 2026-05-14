import type { SearchFilters } from "../types/stock";

export interface FilterPreset {
  id: string;
  label: string;
  description: string;
  filters: Partial<SearchFilters>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: "value",
    label: "バリュー株",
    description: "PBR 1倍未満 ＋ ROE 8%以上の割安・高収益株",
    filters: {
      pbrMax: 1.0,
      roeMin: 8,
    },
  },
  {
    id: "high-dividend",
    label: "高配当",
    description: "配当利回り 3%以上の高配当銘柄",
    filters: {
      dividendYieldMin: 3,
    },
  },
  {
    id: "net-cash",
    label: "ネットキャッシュ豊富",
    description: "ネットキャッシュ比率 50%以上（現金が時価総額の半分超）",
    filters: {
      netCashRatioMin: 50,
    },
  },
  {
    id: "quality",
    label: "優良収益",
    description: "営業利益率10%以上 ＋ 自己資本比率50%以上の財務健全株",
    filters: {
      operatingMarginMin: 10,
      equityRatioMin: 50,
    },
  },
  {
    id: "low-pbr-high-roe",
    label: "低PBR高ROE",
    description: "PBR 1.5倍未満 ＋ ROE 15%以上。割安かつ高収益の優良株",
    filters: {
      pbrMax: 1.5,
      roeMin: 15,
    },
  },
];
