import type { StockData } from "../types/stock";
import type { ColumnConfig } from "../components/ColumnSelector";

/**
 * CSVダウンロード機能のユーティリティ関数
 */

/**
 * データをCSV形式の文字列に変換
 */
export const convertToCSV = (
  data: StockData[],
  columns: ColumnConfig[],
): string => {
  if (data.length === 0) return "";

  // 表示される列のみを取得
  const visibleColumns = columns.filter((col) => col.visible);

  // ヘッダー行の作成
  const headers = visibleColumns.map((col) => col.label);
  const csvHeaders = headers.map((header) => `"${header}"`).join(",");

  // データ行の作成
  const csvRows = data.map((row) => {
    const rowData = visibleColumns.map((col) => {
      const value = row[col.key as keyof StockData];

      // null/undefinedの処理
      if (value === null || value === undefined) {
        return '""';
      }

      // 数値の処理
      if (typeof value === "number") {
        return value.toString();
      }

      // 文字列の処理（ダブルクォートをエスケープ）
      const stringValue = String(value);
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    });

    return rowData.join(",");
  });

  // CSV文字列の組み立て
  return [csvHeaders, ...csvRows].join("\n");
};

/**
 * CSVファイルをダウンロード
 */
export const downloadCSV = (
  csvContent: string,
  filename: string = "stock_data.csv",
): void => {
  // BOMを追加してExcelでの文字化けを防ぐ
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvContent;

  // Blobオブジェクトの作成
  const blob = new Blob([csvWithBOM], {
    type: "text/csv;charset=utf-8;",
  });

  // ダウンロードリンクの作成
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  // リンクをクリックしてダウンロード実行
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // メモリ解放
  URL.revokeObjectURL(url);
};

/**
 * ファイル名を生成（日時付き）
 */
export const generateFileName = (
  baseFileName: string = "stock_data",
): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${baseFileName}_${year}${month}${day}_${hours}${minutes}.csv`;
};

/**
 * フィルター情報付きファイル名を生成
 */
export const generateFileNameWithFilters = (
  baseFileName: string = "stock_data",
  filterCount: number,
  totalCount: number,
): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  if (filterCount < totalCount) {
    return `${baseFileName}_filtered_${filterCount}件_${year}${month}${day}_${hours}${minutes}.csv`;
  } else {
    return `${baseFileName}_full_${totalCount}件_${year}${month}${day}_${hours}${minutes}.csv`;
  }
};

/**
 * データサイズの計算（概算）
 */
export const estimateCSVSize = (
  data: StockData[],
  columns: ColumnConfig[],
): string => {
  if (data.length === 0) return "0 KB";

  // サンプルデータでサイズを推定
  const sampleRows = Math.min(data.length, 10);
  const sampleCSV = convertToCSV(data.slice(0, sampleRows), columns);
  const avgRowSize = sampleCSV.length / sampleRows;
  const totalSize = avgRowSize * data.length;

  if (totalSize < 1024) {
    return `${Math.round(totalSize)} B`;
  } else if (totalSize < 1024 * 1024) {
    return `${(totalSize / 1024).toFixed(1)} KB`;
  } else {
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  }
};
