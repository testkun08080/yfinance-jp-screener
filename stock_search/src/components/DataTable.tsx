import type { FC } from "react";
import type { StockData, SortConfig } from "../types/stock";
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
} from "../utils/csvParser";
import type { ColumnConfig } from "./ColumnSelector";

interface DataTableProps {
  data: StockData[];
  sortConfig: SortConfig | null;
  onSort: (key: keyof StockData) => void;
  currentPage: number;
  itemsPerPage: number;
  visibleColumns: ColumnConfig[];
}

export const DataTable: FC<DataTableProps> = ({
  data,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  visibleColumns,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const getSortIcon = (key: keyof StockData) => {
    if (!sortConfig || sortConfig.key !== key) {
      return "↕️";
    }
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const SortableHeader: FC<{
    label: string;
    sortKey: keyof StockData;
    align?: "left" | "right";
    className?: string;
  }> = ({ label, sortKey, align = "left", className = "" }) => (
    <th
      className={`px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-[var(--border)] cursor-pointer hover:bg-slate-100 transition-colors ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span>{label}</span>
      <span className="ml-1 opacity-60">{getSortIcon(sortKey)}</span>
    </th>
  );

  // 金額フィールドかどうかを判定
  const isCurrencyField = (key: keyof StockData): boolean => {
    const currencyFields = [
      "時価総額",
      "売上高",
      "営業利益",
      "当期純利益",
      "負債",
      "流動負債",
      "流動資産",
      "総負債",
      "現金及び現金同等物",
      "投資有価証券",
      "ネットキャッシュ",
      "ネットキャッシュ（流動資産-負債）",
    ];
    return currencyFields.includes(String(key));
  };

  // 表示する列のみを取得
  const getDisplayColumns = (): Array<{
    key: keyof StockData;
    label: string;
    format: string;
  }> => {
    const displayColumns: Array<{
      key: keyof StockData;
      label: string;
      format: string;
    }> = [];

    visibleColumns
      .filter((col) => col.visible)
      .forEach((col) => {
        const key = col.key as keyof StockData;

        let format = "string";
        if (col.key === "銘柄コード") {
          format = "string";
        } else if (
          String(col.key).includes("率") ||
          String(col.key).includes("ROE") ||
          String(col.key).includes("配当方向性") ||
          String(col.key).includes("配当利回り")
        )
          format = "percentage";
        else if (isCurrencyField(key)) format = "currency";
        else if (
          String(col.key).includes("PBR") ||
          String(col.key).includes("PER")
        )
          format = "decimal";
        else if (typeof currentData[0]?.[key] === "number") format = "number";

        displayColumns.push({ key, label: col.label, format });
      });

    return displayColumns;
  };

  const columns = getDisplayColumns();

  const formatValue = (value: unknown, format: string) => {
    if (value === null || value === undefined) return "-";

    // Type guard for number values
    const numValue = typeof value === "number" ? value : Number(value);
    if (isNaN(numValue)) return String(value);

    switch (format) {
      case "currency":
        return formatCurrency(numValue);
      case "percentage":
        return formatPercentage(numValue);
      case "decimal":
        return formatNumber(numValue, 2);
      case "number":
        return formatNumber(numValue, 0);
      default:
        return String(value);
    }
  };

  const isNumericColumn = (format: string) => format !== "string";

  return (
    <div
      className="overflow-x-auto custom-scrollbar"
      style={{ maxWidth: "100%" }}
    >
      <table className="w-full border-separate border-spacing-0 min-w-max">
        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-[var(--border)]">
          <tr>
            {columns.map((column, index) => (
              <SortableHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                align={isNumericColumn(column.format) ? "right" : "left"}
                className={index === 0 ? "min-w-[4rem]" : ""}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {currentData.map((stock, index) => (
            <tr
              key={`${stock.銘柄コード ?? stock.コード}-${index}`}
              className={`transition-colors group ${
                index % 2 === 1 ? "bg-slate-50/50" : ""
              } hover:bg-indigo-50/30`}
            >
              {columns.map((column) => {
                const value = stock[column.key];
                const isNetCash =
                  column.key === "ネットキャッシュ（流動資産-負債）" ||
                  column.key === "ネットキャッシュ";

                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm ${
                      column.format === "string" ? "text-left" : "text-right"
                    }`}
                  >
                    {column.format === "string" && column.key === "会社名" ? (
                      <span
                        className="font-bold text-slate-800 group-hover:text-[var(--primary)] transition-colors truncate block max-w-[12rem]"
                        title={String(value)}
                      >
                        {String(value || "-")}
                      </span>
                    ) : column.format === "string" &&
                      (column.key === "銘柄コード" ||
                        column.key === "コード") ? (
                      <span className="font-mono font-medium text-slate-500">
                        {String(value || "-")}
                      </span>
                    ) : column.format === "string" &&
                      (column.key === "業種" || column.key === "優先市場") ? (
                      <span
                        className="font-medium text-slate-600 text-xs truncate block max-w-[8rem]"
                        title={String(value)}
                      >
                        {String(value || "-").replace("（内国株式）", "")}
                      </span>
                    ) : isNetCash ? (
                      <span
                        className={
                          value != null &&
                          typeof value === "number" &&
                          value > 0
                            ? "font-bold text-emerald-600"
                            : "font-bold text-rose-600"
                        }
                      >
                        {formatValue(value, column.format)}
                      </span>
                    ) : (
                      <span
                        className={
                          column.key === "時価総額"
                            ? "font-semibold"
                            : "text-slate-600"
                        }
                      >
                        {formatValue(value, column.format)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {currentData.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          データがありません
        </div>
      )}
    </div>
  );
};
