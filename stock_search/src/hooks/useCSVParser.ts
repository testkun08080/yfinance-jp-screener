import { useState, useEffect, useRef, useCallback } from "react";
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
  /** 古い fetch / parse をキャンセルするためのコントローラ */
  const abortRef = useRef<AbortController | null>(null);

  const loadCSVData = useCallback(async (csvFile: CSVFile) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(csvFile.url, { signal });

      if (signal.aborted) return;
      if (!response.ok) {
        throw new Error(
          `CSVファイルの読み込みに失敗しました (${response.status})`
        );
      }

      const csvText = await response.text();
      if (signal.aborted) return;

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (signal.aborted) return;
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }

          const parsedData = results.data as Record<string, unknown>[];
          if (parsedData.length === 0) {
            setError("CSVファイルにデータがありません");
            setData([]);
            return;
          }

          const stockData: StockData[] = parsedData.map((row) => {
            const processedRow: Record<string, string | number | null> = {};

            Object.keys(row).forEach((key) => {
              const value = row[key];

              if (value === "" || value === "-" || value === "N/A") {
                processedRow[key] = null;
                return;
              }

              const trimmed = String(value).trim();

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
        error: (err: Error) => {
          if (signal.aborted) return;
          setError(`CSV解析エラー: ${err.message}`);
        },
      });
    } catch (err) {
      if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      console.error("CSV loading error:", err);
      setError(
        err instanceof Error ? err.message : "データの読み込みに失敗しました"
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!file) {
      abortRef.current?.abort();
      abortRef.current = null;
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    void loadCSVData(file);

    return () => {
      abortRef.current?.abort();
    };
  }, [file, loadCSVData]);

  return {
    data,
    loading,
    error,
    reload: () => {
      if (file) void loadCSVData(file);
    },
  };
};
