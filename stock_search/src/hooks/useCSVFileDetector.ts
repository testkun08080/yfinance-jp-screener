import { useState, useEffect, useCallback } from "react";

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

interface UseCSVFileDetectorResult {
  files: CSVFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 日付パターンに基づいてCSVファイルを自動検出するフック
 * files.json不要で、YYYYMMDD_combined.csvパターンのファイルを探す
 */
export const useCSVFileDetector = (): UseCSVFileDetectorResult => {
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 直近N日分の日付配列を生成（新しい順）
   */
  const generateDateRange = (days: number): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      dates.push(`${year}${month}${day}`);
    }

    return dates;
  };

  /**
   * 指定したURLのファイルが存在するかHEADリクエストで確認
   */
  const checkFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  };

  /**
   * ファイルのメタデータを取得
   */
  const getFileMetadata = async (
    filename: string,
  ): Promise<CSVFile | null> => {
    const url = `/csv/${filename}`;

    try {
      const response = await fetch(url, { method: "HEAD" });

      if (!response.ok) return null;

      const contentLength = response.headers.get("content-length");
      const lastModified = response.headers.get("last-modified");

      return {
        name: filename,
        displayName: filename.replace(/\.csv$/, "").replace(/_/g, " "),
        size: contentLength ? parseInt(contentLength, 10) : 0,
        lastModified: lastModified || new Date().toISOString(),
        url,
      };
    } catch {
      return null;
    }
  };

  /**
   * CSVファイルを検出（直近30日分をチェック）
   */
  const detectCSVFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 直近30日分の日付パターンを生成
      const dateRange = generateDateRange(30);
      const detectedFiles: CSVFile[] = [];

      console.log("🔍 CSVファイル検出開始（直近30日分）");
      console.log("📅 検索対象日付:", dateRange.slice(0, 5).join(", "), "...");

      // 各日付パターンでファイル存在確認
      for (const dateStr of dateRange) {
        const filename = `${dateStr}_combined.csv`;
        const url = `/csv/${filename}`;

        console.log(`🔎 チェック中: ${url}`);

        const exists = await checkFileExists(url);

        if (exists) {
          console.log(`✅ ファイル検出: ${filename}`);
          const metadata = await getFileMetadata(filename);

          if (metadata) {
            detectedFiles.push(metadata);
            console.log(`📊 メタデータ取得成功:`, metadata);
          } else {
            console.warn(`⚠️ メタデータ取得失敗: ${filename}`);
          }
        }
      }

      if (detectedFiles.length === 0) {
        console.log("⚠️ CSVファイルが見つかりませんでした");
        console.log("💡 public/csv/ ディレクトリを確認してください");
      } else {
        console.log(`📊 ${detectedFiles.length}個のCSVファイルを検出`);
        console.log("検出されたファイル:", detectedFiles.map((f) => f.name));
      }

      setFiles(detectedFiles);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "CSVファイルの検出に失敗しました";
      setError(errorMessage);
      console.error("❌ CSVファイル検出エラー:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時に自動検出
  useEffect(() => {
    detectCSVFiles();
  }, [detectCSVFiles]);

  return {
    files,
    loading,
    error,
    refetch: detectCSVFiles,
  };
};
