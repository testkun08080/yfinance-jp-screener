import { useState, useCallback } from "react";
import type { StockData } from "../types/stock";
import { parseCSVFile } from "../utils/csvParser";

export const useCSVData = () => {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCSVFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const parsedData = await parseCSVFile(file);
      setData(parsedData);
      console.log(`✅ ${parsedData.length}件のデータを読み込みました`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "データの読み込みに失敗しました";
      setError(errorMessage);
      console.error("❌ CSVデータ読み込みエラー:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    loadCSVFile,
    clearData,
  };
};
