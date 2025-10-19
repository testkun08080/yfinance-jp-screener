import Papa from "papaparse";
import type { StockData } from "../types/stock";

export const parseCSVFile = (file: File): Promise<StockData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: "UTF-8",
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // ヘッダーのトリミング
        return header.trim();
      },
      transform: (value: string, header: string) => {
        // 数値フィールドの処理
        const numericFields = [
          "時価総額",
          "PBR",
          "売上高",
          "営業利益",
          "営業利益率",
          "当期純利益",
          "純利益率",
          "ROE",
          "自己資本比率",
          "PER(会予)",
          "負債",
          "流動負債",
          "流動資産",
          "総負債",
          "現金及び現金同等物",
          "投資有価証券",
          "ネットキャッシュ（流動資産-負債）",
          "ネットキャッシュ比率",
        ];

        if (numericFields.includes(header)) {
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
  return formatNumber(value / 1000000, 0);
};

export const formatPercentage = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return `${formatNumber(value * 100, 2)}%`;
};
