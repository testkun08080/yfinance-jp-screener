import type { ColumnConfig } from "../components/ColumnSelector";

/**
 * デフォルトの列設定を生成
 * @param availableColumns 利用可能な列名のリスト
 * @returns ColumnConfig配列
 */
export const getDefaultColumns = (
  availableColumns: string[],
): ColumnConfig[] => {
  const columnDefinitions: Record<
    string,
    Omit<ColumnConfig, "key" | "visible">
  > = {
    会社名: { label: "会社名", category: "basic", essential: true },
    銘柄コード: { label: "銘柄コード", category: "basic", essential: true },
    コード: { label: "コード", category: "basic" },
    業種: { label: "業種", category: "basic" },
    優先市場: { label: "優先市場", category: "basic" },
    都道府県: { label: "都道府県", category: "basic" },
    決算月: { label: "決算月", category: "basic" },

    // バリュエーション指標
    時価総額: { label: "時価総額", category: "valuation" },
    PBR: { label: "PBR", category: "valuation" },
    ROE: { label: "ROE", category: "valuation" },
    自己資本比率: { label: "自己資本比率", category: "valuation" },
    "PER(会予)": { label: "PER(会予)", category: "valuation" },

    // 業績・収益性
    売上高: { label: "売上高", category: "performance" },
    営業利益: { label: "営業利益", category: "performance" },
    営業利益率: { label: "営業利益率", category: "performance" },
    当期純利益: { label: "当期純利益", category: "performance" },
    純利益率: { label: "純利益率", category: "performance" },

    // バランスシート
    負債: { label: "負債", category: "balance" },
    流動負債: { label: "流動負債", category: "balance" },
    流動資産: { label: "流動資産", category: "balance" },
    総負債: { label: "総負債", category: "balance" },
    投資有価証券: { label: "投資有価証券", category: "balance" },

    // キャッシュ関連
    現金及び現金同等物: { label: "現金及び現金同等物", category: "cash" },
    ネットキャッシュ: { label: "ネットキャッシュ", category: "cash" },
    "ネットキャッシュ（流動資産-負債）": {
      label: "ネットキャッシュ",
      category: "cash",
    },
    ネットキャッシュ比率: { label: "ネットキャッシュ比率", category: "cash" },
  };

  return availableColumns.map((col) => ({
    key: col,
    ...(columnDefinitions[col] || { label: col, category: "basic" }),
    visible: true,
  }));
};
