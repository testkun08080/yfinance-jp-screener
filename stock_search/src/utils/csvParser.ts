import Papa from "papaparse";
import type { StockData } from "../types/stock";
import { CSV_PARSER_CONFIG, CSV_NUMERIC_FIELDS } from "../constants/csv";
import { CURRENCY_FORMAT, PERCENTAGE_FORMAT } from "../constants/formatting";

export const parseCSVFile = (file: File): Promise<StockData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: CSV_PARSER_CONFIG.header,
      encoding: CSV_PARSER_CONFIG.encoding,
      skipEmptyLines: CSV_PARSER_CONFIG.skipEmptyLines,
      transformHeader: (header: string) => {
        // ヘッダーのトリミング
        return header.trim();
      },
      transform: (value: string, header: string) => {
        // 数値フィールドの処理
        if (
          CSV_NUMERIC_FIELDS.includes(
            header as (typeof CSV_NUMERIC_FIELDS)[number],
          )
        ) {
          // 単位表記を除去（倍、%、円など）
          const cleanValue = value
            .replace(/,/g, "")
            .replace(/倍$/, "")
            .replace(/%$/, "")
            .replace(/円$/, "")
            .trim();
          const numValue = parseFloat(cleanValue);
          return isNaN(numValue) ? null : numValue;
        }

        // 文字列フィールドの処理
        return value.trim() || null;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          reject(new Error("CSVファイルの解析中にエラーが発生しました"));
          return;
        }

        try {
          const stockData = results.data as StockData[];
          resolve(stockData.filter((row) => row.会社名 && row.銘柄コード));
        } catch (error) {
          reject(new Error("データの変換中にエラーが発生しました"));
        }
      },
      error: (error: Error) => {
        reject(
          new Error(`CSVファイルの読み込みに失敗しました: ${error.message}`),
        );
      },
    });
  });
};

export const formatNumber = (value: number | null, decimals = 0): string => {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return "-";

  // 全て百万円単位で表示（単位サフィックスなし）
  return formatNumber(
    value / CURRENCY_FORMAT.millionDivisor,
    CURRENCY_FORMAT.decimals,
  );
};

export const formatPercentage = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return `${formatNumber(
    value * PERCENTAGE_FORMAT.multiplier,
    PERCENTAGE_FORMAT.decimals,
  )}%`;
};
