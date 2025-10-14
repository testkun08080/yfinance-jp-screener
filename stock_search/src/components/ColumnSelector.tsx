import React from "react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  category: "basic" | "valuation" | "performance" | "balance" | "cash";
  essential?: boolean; // 必須項目（非表示にできない）
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnChange: (key: string, visible: boolean) => void;
  onCategoryToggle: (category: string, visible: boolean) => void;
}

// デフォルトの列設定
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
    // '会計基準': { label: '会計基準', category: 'basic' }, // コメントアウト

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
    visible: !["都道府県"].includes(col), // 都道府県はデフォルトで非表示、他はデフォルトで表示
    ...(columnDefinitions[col] || { label: col, category: "basic" }),
  }));
};

const categoryLabels = {
  basic: "📋 基本情報",
  valuation: "📊 バリュエーション",
  performance: "📈 業績・収益性",
  balance: "🏦 バランスシート",
  cash: "💰 キャッシュ関連",
};

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onColumnChange,
  onCategoryToggle,
}) => {
  const categorizedColumns = columns.reduce(
    (acc, col) => {
      if (!acc[col.category]) acc[col.category] = [];
      acc[col.category].push(col);
      return acc;
    },
    {} as Record<string, ColumnConfig[]>,
  );

  const visibleCount = columns.filter((col) => col.visible).length;
  const totalCount = columns.length;

  const handleCategoryToggle = (category: string) => {
    const categoryColumns = categorizedColumns[category];
    const allVisible = categoryColumns.every(
      (col) => col.visible || col.essential,
    );
    const newVisible = !allVisible;

    onCategoryToggle(category, newVisible);
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
        👁️ 表示項目を選択
        <span className="badge badge-sm ml-1">
          {visibleCount}/{totalCount}
        </span>
      </div>

      <div
        tabIndex={0}
        className="dropdown-content z-[1] bg-base-100 rounded-lg shadow-lg border border-base-300 w-80 sm:w-96 p-4 mt-2 max-w-[90vw]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">表示項目の選択</h3>
          <button
            onClick={() => (document.activeElement as HTMLElement)?.blur()}
            className="btn btn-ghost btn-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(categorizedColumns).map(([category, cols]) => {
            const visibleInCategory = cols.filter((col) => col.visible).length;
            const totalInCategory = cols.length;
            const allVisible = cols.every(
              (col) => col.visible || col.essential,
            );

            return (
              <div
                key={category}
                className="border border-base-300 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={allVisible}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <span className="font-medium text-sm">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  <span className="text-xs text-base-content/60">
                    {visibleInCategory}/{totalInCategory}
                  </span>
                </div>

                <div className="space-y-1 ml-6">
                  {cols.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={col.visible}
                        disabled={col.essential}
                        onChange={(e) =>
                          onColumnChange(col.key, e.target.checked)
                        }
                      />
                      <span
                        className={`text-xs ${col.essential ? "text-base-content/50" : "text-base-content/80"}`}
                      >
                        {col.label}
                        {col.essential && (
                          <span className="text-xs text-warning ml-1">*</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-base-content/60 border-t border-base-300 pt-2">
          * 必須項目は非表示にできません
        </div>
      </div>
    </div>
  );
};
