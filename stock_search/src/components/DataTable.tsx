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
    className?: string;
  }> = ({ label, sortKey, className = "" }) => (
    <th
      className={`cursor-pointer hover:bg-base-200 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        <span className="text-xs opacity-60">{getSortIcon(sortKey)}</span>
      </div>
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
        if (
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

  // 金額フィールドが表示されているかチェック
  const hasCurrencyFields = columns.some((col) => isCurrencyField(col.key));

  return (
    <div
      className="overflow-x-auto bg-white rounded-lg shadow-sm"
      style={{ maxWidth: "100vw" }}
    >
      {/* 単位表示 */}
      {hasCurrencyFields && (
        <div className="px-2 sm:px-4 py-2 bg-base-100  text-xs sm:text-sm text-base-content/70">
          💰 金額単位: 百万円
        </div>
      )}
      <table className="table table-zebra w-full min-w-max">
        <thead className="bg-base-200">
          <tr className="text-center">
            {columns.map((column, index) => (
              <SortableHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                className={`min-w-24 ${
                  index === 0 || index === 1 ? " z-10 bg-base-200" : ""
                } ${
                  index === 0
                    ? "left-0 min-w-20 max-w-20"
                    : index === 1
                    ? "left-20 min-w-16 max-w-16"
                    : ""
                }`}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {currentData.map((stock, index) => (
            <tr
              key={`${stock.銘柄コード}-${index}`}
              className="hover:bg-base-50"
            >
              {columns.map((column, colIndex) => {
                const value = stock[column.key];
                const isNetCash =
                  column.key === "ネットキャッシュ（流動資産-負債）";
                // const isSticky = colIndex === 0 || colIndex === 1;
                const isSticky = false;
                const stickyClass = isSticky
                  ? `sticky z-10 bg-white ${
                      colIndex === 0
                        ? "left-0 min-w-20 max-w-20"
                        : "left-20 min-w-16 max-w-16"
                    }`
                  : "";

                return (
                  <td
                    key={column.key}
                    className={`text-xs ${
                      column.format === "string" ? "text-left" : "text-right"
                    } ${stickyClass} px-1`}
                  >
                    {column.format === "string" && column.key === "会社名" ? (
                      <div
                        className="max-w-20 truncate font-medium text-xs"
                        title={String(value)}
                      >
                        {String(value || "-")}
                      </div>
                    ) : column.format === "string" &&
                      column.key === "銘柄コード" ? (
                      <span className="font-mono text-xs">
                        {String(value || "-")}
                      </span>
                    ) : column.format === "string" &&
                      (column.key === "業種" || column.key === "優先市場") ? (
                      <div
                        className="max-w-20 truncate text-xs"
                        title={String(value)}
                      >
                        {String(value || "-").replace("（内国株式）", "")}
                      </div>
                    ) : isNetCash ? (
                      <span
                        className={
                          value && typeof value === "number" && value > 0
                            ? "text-success"
                            : "text-error"
                        }
                      >
                        {formatValue(value, column.format)}
                      </span>
                    ) : (
                      formatValue(value, column.format)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {currentData.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          データがありません
        </div>
      )}
    </div>
  );
};
