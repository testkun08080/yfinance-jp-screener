import type { FC } from "react";

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

const categoryLabels = {
  basic: "📋 基本情報",
  valuation: "📊 バリュエーション",
  performance: "📈 業績・収益性",
  balance: "🏦 バランスシート",
  cash: "💰 キャッシュ関連",
};

export const ColumnSelector: FC<ColumnSelectorProps> = ({
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
