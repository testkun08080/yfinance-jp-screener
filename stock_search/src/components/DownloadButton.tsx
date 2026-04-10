import React, { useState } from "react";
import { MdDownload } from "react-icons/md";
import type { StockData } from "../types/stock";
import type { ColumnConfig } from "./ColumnSelector";
import {
  convertToCSV,
  downloadCSV,
  generateFileNameWithFilters,
  estimateCSVSize,
} from "../utils/csvDownload";
import SponsorshipModal from "./SponsorshipModal";

interface DownloadButtonProps {
  data: StockData[];
  columns: ColumnConfig[];
  fileName?: string;
  totalCount?: number;
  className?: string;
  /** ツールバー用: ダウンロードアイコンのみ（詳細は title） */
  compactTrigger?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  data,
  columns,
  fileName = "stock_data",
  totalCount,
  className = "",
  compactTrigger = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [lastDownloadTime, setLastDownloadTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // クールダウン時間（ミリ秒）
  const COOLDOWN_DURATION = 1000; // 3秒

  // クールダウンタイマーの更新
  React.useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 100) {
            return 0;
          }
          return prev - 100;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const handleDownload = async () => {
    const now = Date.now();

    // データチェック
    if (data.length === 0) {
      setDownloadMessage("❗ ダウンロードするデータがありません");
      setTimeout(() => setDownloadMessage(null), 3000);
      return;
    }

    // クールダウンチェック
    const timeSinceLastDownload = now - lastDownloadTime;
    if (timeSinceLastDownload < COOLDOWN_DURATION) {
      const remaining = COOLDOWN_DURATION - timeSinceLastDownload;
      setCooldownRemaining(remaining);
      setDownloadMessage(
        `⏱️ ${Math.ceil(remaining / 1000)}秒後に再度お試しください`
      );
      setTimeout(() => setDownloadMessage(null), remaining + 500);
      return;
    }

    setIsDownloading(true);
    setDownloadMessage(null);

    try {
      // CSVデータの生成
      const csvContent = convertToCSV(data, columns);

      // ファイル名の生成
      const downloadFileName = generateFileNameWithFilters(
        fileName,
        data.length,
        totalCount || data.length
      );

      // ダウンロード実行
      downloadCSV(csvContent, downloadFileName);

      // ダウンロード時間を記録
      setLastDownloadTime(now);

      // 成功メッセージ
      setDownloadMessage(`✅ ${downloadFileName} をダウンロードしました`);
      setTimeout(() => setDownloadMessage(null), 4000);

      // 3回に1回の確率でドネーションモーダルを表示
      const downloadCount =
        parseInt(localStorage.getItem("downloadCount") || "0", 10) + 1;
      localStorage.setItem("downloadCount", downloadCount.toString());

      if (downloadCount % 3 === 0) {
        setShowDonationModal(true);
      }
    } catch (error) {
      console.error("CSV download error:", error);
      setDownloadMessage("❗ ダウンロードに失敗しました");
      setTimeout(() => setDownloadMessage(null), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const estimatedSize = estimateCSVSize(data, columns);
  const visibleColumnCount = columns.filter((col) => col.visible).length;
  const isDisabled =
    isDownloading || data.length === 0 || cooldownRemaining > 0;

  const downloadTitle =
    cooldownRemaining > 0
      ? `クールダウン中: あと${Math.ceil(cooldownRemaining / 1000)}秒`
      : `CSVをダウンロード（${data.length}件・${visibleColumnCount}列・約${estimatedSize}）`;

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <button
        onClick={handleDownload}
        disabled={isDisabled}
        title={downloadTitle}
        aria-label={downloadTitle}
        className={`inline-flex items-center justify-center whitespace-nowrap ${
          compactTrigger
            ? `h-9 w-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 ${
                data.length === 0 ? "cursor-not-allowed opacity-40" : ""
              } ${cooldownRemaining > 0 ? "opacity-60" : ""}`
            : `btn btn-outline btn-sm min-h-10 gap-1.5 px-3 md:gap-2 md:px-4 ${
                data.length === 0 ? "btn-disabled" : ""
              } ${cooldownRemaining > 0 ? "btn-disabled opacity-60" : ""}`
        }`}
      >
        {isDownloading ? (
          compactTrigger ? (
            <span className="loading loading-spinner loading-sm text-[var(--primary)]" />
          ) : (
            <>
              <span className="loading loading-spinner loading-xs" />
              生成中...
            </>
          )
        ) : cooldownRemaining > 0 ? (
          compactTrigger ? (
            <span className="text-xs font-bold tabular-nums">
              {Math.ceil(cooldownRemaining / 1000)}
            </span>
          ) : (
            <>
              ⏱️ CSV
              <span className="text-xs opacity-70">
                {Math.ceil(cooldownRemaining / 1000)}秒
              </span>
            </>
          )
        ) : compactTrigger ? (
          <MdDownload className="text-xl" aria-hidden />
        ) : (
          <>
            📥 CSVダウンロード
            <span className="text-xs opacity-70">
              {data.length > 0 ? `(${data.length}件)` : ""}
            </span>
          </>
        )}
      </button>

      {/* ダウンロード状況メッセージ */}
      {downloadMessage && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-base-100 border border-base-300 text-sm rounded-lg shadow-lg whitespace-nowrap z-20 min-w-max">
          {downloadMessage}
        </div>
      )}

      {/* データがない場合の説明 */}
      {data.length === 0 && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-warning/10 border border-warning/30 text-warning-content text-sm rounded-lg shadow-lg whitespace-nowrap z-20">
          データがありません
        </div>
      )}

      {/* ドネーションモーダル */}
      <SponsorshipModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </div>
  );
};
