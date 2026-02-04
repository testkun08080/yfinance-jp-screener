import { useState, useCallback } from "react";
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

const categoryLabels: Record<string, string> = {
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
  const [isOpen, setIsOpen] = useState(false);

  const categorizedColumns = columns.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, ColumnConfig[]>);

  const visibleCount = columns.filter((col) => col.visible).length;
  const totalCount = columns.length;

  const handleCategoryToggle = useCallback(
    (category: string) => {
      const categoryColumns = categorizedColumns[category];
      const allVisible = categoryColumns.every(
        (col) => col.visible || col.essential
      );
      onCategoryToggle(category, !allVisible);
    },
    [categorizedColumns, onCategoryToggle]
  );

  const closeModal = useCallback(() => setIsOpen(false), []);

  const panelContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 id="column-selector-title" className="font-semibold text-lg">
          表示項目の選択
        </h3>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          onClick={closeModal}
          aria-label="閉じる"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {Object.entries(categorizedColumns).map(([category, cols]) => {
          const visibleInCategory = cols.filter((col) => col.visible).length;
          const totalInCategory = cols.length;
          const allVisible = cols.every((col) => col.visible || col.essential);

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
                    {categoryLabels[category] ?? category}
                  </span>
                </div>
                <span className="text-xs text-base-content/70">
                  {visibleInCategory}/{totalInCategory}
                </span>
              </div>

              <div className="space-y-1 ml-6">
                {cols.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={col.visible}
                      disabled={col.essential}
                      onChange={(e) =>
                        onColumnChange(col.key, e.target.checked)
                      }
                    />
                    <span
                      className={`text-sm ${
                        col.essential
                          ? "text-base-content/70"
                          : "text-base-content"
                      }`}
                    >
                      {col.label}
                      {col.essential && (
                        <span className="text-warning ml-1">*</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-base-content/70 border-t border-base-300 pt-2">
        * 必須項目は非表示にできません
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0 min-h-10"
      >
        <span className="material-symbols-outlined text-lg">view_column</span>
        <span className="whitespace-nowrap">
          表示列 ({visibleCount}/{totalCount})
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="column-selector-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="閉じる"
            onClick={closeModal}
          />
          <div
            className="relative bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-xl border border-base-300 w-full sm:max-w-md max-h-[85vh] flex flex-col p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
};
