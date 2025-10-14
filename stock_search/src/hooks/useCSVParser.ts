import { useState, useEffect } from "react";
import Papa from "papaparse";
import type { StockData } from "../types/stock";

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

export const useCSVParser = (file: CSVFile | null) => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setData([]);
      return;
    }

    loadCSVData(file);
  }, [file]);

  const loadCSVData = async (csvFile: CSVFile) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(csvFile.url);

      if (!response.ok) {
        throw new Error(
          `CSVファイルの読み込みに失敗しました (${response.status})`,
        );
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }

          const parsedData = results.data as any[];
          if (parsedData.length === 0) {
            throw new Error("CSVファイルにデータがありません");
          }

          // データを StockData 形式に変換
          const stockData: StockData[] = parsedData.map((row) => {
            const processedRow: any = {};

            Object.keys(row).forEach((key) => {
              const value = row[key];

              if (value === "" || value === "-" || value === "N/A") {
                processedRow[key] = null;
                return;
              }

              // 数値変換の試行
              const trimmed = String(value).trim();

              // 日本の数値フォーマット対応
              const numericValue = trimmed.replace(/[,円%倍]/g, "");
              if (!isNaN(Number(numericValue)) && numericValue !== "") {
                processedRow[key] = Number(numericValue);
              } else {
                processedRow[key] = trimmed;
              }
            });

            return processedRow as StockData;
          });

          setData(stockData);
        },
        error: (error: any) => {
          throw new Error(`CSV解析エラー: ${error.message}`);
        },
      });
    } catch (err) {
      console.error("CSV loading error:", err);
      setError(
        err instanceof Error ? err.message : "データの読み込みに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    reload: () => file && loadCSVData(file),
  };
};
