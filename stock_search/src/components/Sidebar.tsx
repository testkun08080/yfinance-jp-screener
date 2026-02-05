import {
  MdClose,
  MdFolderOpen,
  MdExpandMore,
  MdFilterList,
} from "react-icons/md";
import type { SearchFilters as SearchFiltersType } from "../types/stock";
import { CSV_FILE_CONFIG } from "../constants/csv";
import { FILE_SIZE } from "../constants/formatting";

interface FileInfo {
  name: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZE.kilobyte) return `${bytes} B`;
  if (bytes < FILE_SIZE.megabyte)
    return `${(bytes / FILE_SIZE.kilobyte).toFixed(2)} KB`;
  return `${(bytes / FILE_SIZE.megabyte).toFixed(2)} MB`;
}

interface SidebarProps {
  hasFile: boolean;
  fileInfo: FileInfo | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  /** データ読み込み後、別のファイルを選択するためにファイルダイアログを開く */
  onOpenFileSelect?: () => void;
  filters: SearchFiltersType;
  onFilterChange: (
    key: keyof SearchFiltersType,
    value: string | number | string[] | null
  ) => void;
  onClearFilters: () => void;
  availableIndustries: string[];
  availableMarkets: string[];
  availablePrefectures: string[];
  /** モバイルドロワー時に閉じるコールバック（指定時は閉じるボタンを表示） */
  onClose?: () => void;
  /** モバイル用ドロワーとして表示する場合 true */
  isDrawer?: boolean;
}

function NumRange({
  label,
  minKey,
  maxKey,
  unit = "",
  filters,
  onFilterChange,
}: {
  label: string;
  minKey: keyof SearchFiltersType;
  maxKey: keyof SearchFiltersType;
  unit?: string;
  filters: SearchFiltersType;
  onFilterChange: SidebarProps["onFilterChange"];
}) {
  const minVal = filters[minKey] as number | null | undefined;
  const maxVal = filters[maxKey] as number | null | undefined;
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
        {label} {unit && `(${unit})`}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className="text-[11px] p-1.5 border border-slate-200 rounded w-full focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          placeholder="最小"
          value={minVal ?? ""}
          onChange={(e) =>
            onFilterChange(
              minKey,
              e.target.value ? parseFloat(e.target.value) : null
            )
          }
        />
        <input
          type="number"
          className="text-[11px] p-1.5 border border-slate-200 rounded w-full focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          placeholder="最大"
          value={maxVal ?? ""}
          onChange={(e) =>
            onFilterChange(
              maxKey,
              e.target.value ? parseFloat(e.target.value) : null
            )
          }
        />
      </div>
    </div>
  );
}

export const Sidebar = ({
  hasFile,
  fileInfo,
  onFileSelect,
  onClear,
  onOpenFileSelect,
  filters,
  onFilterChange,
  onClearFilters,
  availableIndustries,
  availableMarkets,
  availablePrefectures,
  onClose,
  isDrawer = false,
}: SidebarProps) => {
  const handleDatasetDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === CSV_FILE_CONFIG.mimeType) onFileSelect(file);
  };
  const handleDatasetDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const current = filters.industries || [];
    if (checked) onFilterChange("industries", [...current, industry]);
    else
      onFilterChange(
        "industries",
        current.filter((i) => i !== industry)
      );
  };
  const handleMarketChange = (market: string, checked: boolean) => {
    const current = filters.market || [];
    if (checked) onFilterChange("market", [...current, market]);
    else
      onFilterChange(
        "market",
        current.filter((m) => m !== market)
      );
  };
  const handlePrefectureChange = (prefecture: string, checked: boolean) => {
    const current = filters.prefecture || [];
    if (checked) onFilterChange("prefecture", [...current, prefecture]);
    else
      onFilterChange(
        "prefecture",
        current.filter((p) => p !== prefecture)
      );
  };

  return (
    <aside
      className={`w-72 flex-shrink-0 border-r border-[var(--border)] bg-white flex flex-col h-full ${
        isDrawer ? "shadow-xl" : ""
      }`}
    >
      {/* モバイルドロワー用: 閉じるボタン */}
      {onClose && (
        <div className="flex items-center justify-end p-2 border-b border-[var(--border)] md:hidden">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={onClose}
            aria-label="閉じる"
          >
            <MdClose />
          </button>
        </div>
      )}
      {/* データセット */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            データセット
          </span>
          {hasFile && (
            <button
              type="button"
              className="text-[10px] text-[var(--primary)] font-bold hover:underline"
              onClick={onClear}
            >
              すべてクリア
            </button>
          )}
        </div>
        {hasFile && fileInfo ? (
          <div
            className="relative border-2 border-slate-200 rounded-lg p-3 pr-10 text-center bg-slate-50 hover:border-[var(--primary)] transition-colors"
            onDragOver={handleDatasetDragOver}
            onDrop={handleDatasetDrop}
          >
            <button
              type="button"
              className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-[var(--primary)] transition-colors"
              onClick={onOpenFileSelect}
              title="データセットを変更"
              aria-label="データセットを変更"
            >
              <MdFolderOpen className="text-lg" />
            </button>
            <p
              className="text-[11px] font-semibold text-slate-600 truncate pr-6"
              title={fileInfo.name}
            >
              {fileInfo.name}
            </p>
            <p className="text-[10px] text-slate-400">
              {formatFileSize(fileInfo.size)} • 準備完了
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              ドロップで差し替え
            </p>
          </div>
        ) : (
          <div className="border-2 border-slate-100 rounded-lg p-3 text-center bg-slate-50/50">
            <p className="text-[11px] text-slate-400">未読み込み</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              メインエリアでCSVを読み込み
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* 検索 */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
            🔍 検索
          </label>
          <div className="space-y-2">
            <input
              type="text"
              className="w-full text-xs py-2 px-3 rounded border border-slate-200 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              placeholder="会社名"
              value={filters.companyName}
              onChange={(e) => onFilterChange("companyName", e.target.value)}
            />
            <input
              type="text"
              className="w-full text-xs py-2 px-3 rounded border border-slate-200 font-mono focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              placeholder="銘柄コード（例: 7203）"
              value={filters.stockCode ?? ""}
              onChange={(e) => onFilterChange("stockCode", e.target.value)}
            />
          </div>
        </div>

        {/* 基本フィルター */}
        <div className="space-y-1">
          <details className="group border-b border-slate-100 pb-2" open>
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                📋 基本フィルター
              </span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
              <NumRange
                label="時価総額"
                unit="百万円"
                minKey="marketCapMin"
                maxKey="marketCapMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                  業種
                </label>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {availableIndustries.map((industry) => (
                    <label
                      key={industry}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--primary)] focus:ring-0"
                        checked={filters.industries.includes(industry)}
                        onChange={(e) =>
                          handleIndustryChange(industry, e.target.checked)
                        }
                      />
                      <span className="text-[11px] text-slate-600 truncate">
                        {industry}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                  市場
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {availableMarkets.map((market) => (
                    <label
                      key={market}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--primary)] focus:ring-0"
                        checked={filters.market.includes(market)}
                        onChange={(e) =>
                          handleMarketChange(market, e.target.checked)
                        }
                      />
                      <span className="text-[11px] text-slate-600">
                        {market.replace("（内国株式）", "")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {availablePrefectures.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                    都道府県
                  </label>
                  <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                    {availablePrefectures.map((prefecture) => (
                      <label
                        key={prefecture}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--primary)] focus:ring-0"
                          checked={filters.prefecture.includes(prefecture)}
                          onChange={(e) =>
                            handlePrefectureChange(prefecture, e.target.checked)
                          }
                        />
                        <span className="text-[11px] text-slate-600 truncate">
                          {prefecture}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* バリュエーション */}
          <details className="group border-b border-slate-100 pb-2">
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                📊 バリュエーション
              </span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
              <NumRange
                label="PBR"
                minKey="pbrMin"
                maxKey="pbrMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="ROE"
                unit="%"
                minKey="roeMin"
                maxKey="roeMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="自己資本比率"
                unit="%"
                minKey="equityRatioMin"
                maxKey="equityRatioMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="PER(会予)"
                minKey="forwardPEMin"
                maxKey="forwardPEMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="PER(過去12ヶ月)"
                minKey="trailingPEMin"
                maxKey="trailingPEMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="PER(前年度)"
                minKey="previousYearPEMin"
                maxKey="previousYearPEMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="配当性向"
                unit="%"
                minKey="dividendDirectionMin"
                maxKey="dividendDirectionMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="配当利回り"
                unit="%"
                minKey="dividendYieldMin"
                maxKey="dividendYieldMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="EPS(過去12ヶ月)"
                minKey="trailingEpsMin"
                maxKey="trailingEpsMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="EPS(予想)"
                minKey="forwardEpsMin"
                maxKey="forwardEpsMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="EPS(前年度)"
                minKey="previousYearEpsMin"
                maxKey="previousYearEpsMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
            </div>
          </details>

          {/* 業績 */}
          <details className="group border-b border-slate-100 pb-2">
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                💹 業績・収益性
              </span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
              <NumRange
                label="売上高"
                unit="百万円"
                minKey="revenueMin"
                maxKey="revenueMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="営業利益"
                unit="百万円"
                minKey="operatingProfitMin"
                maxKey="operatingProfitMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="営業利益率"
                unit="%"
                minKey="operatingMarginMin"
                maxKey="operatingMarginMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="当期純利益"
                unit="百万円"
                minKey="netProfitMin"
                maxKey="netProfitMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="純利益率"
                unit="%"
                minKey="netMarginMin"
                maxKey="netMarginMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
            </div>
          </details>

          {/* バランスシート */}
          <details className="group border-b border-slate-100 pb-2">
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                🏛️ バランスシート
              </span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
              <NumRange
                label="負債"
                unit="百万円"
                minKey="totalLiabilitiesMin"
                maxKey="totalLiabilitiesMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="流動負債"
                unit="百万円"
                minKey="currentLiabilitiesMin"
                maxKey="currentLiabilitiesMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="流動資産"
                unit="百万円"
                minKey="currentAssetsMin"
                maxKey="currentAssetsMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="総負債"
                unit="百万円"
                minKey="totalDebtMin"
                maxKey="totalDebtMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="投資有価証券"
                unit="百万円"
                minKey="investmentsMin"
                maxKey="investmentsMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
            </div>
          </details>

          {/* キャッシュ */}
          <details className="group border-b border-slate-100 pb-2">
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">
                💰 キャッシュ
              </span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
              <NumRange
                label="現金及び現金同等物"
                unit="百万円"
                minKey="cashMin"
                maxKey="cashMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="ネットキャッシュ"
                unit="百万円"
                minKey="netCashMin"
                maxKey="netCashMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
              <NumRange
                label="ネットキャッシュ比率"
                unit="%"
                minKey="netCashRatioMin"
                maxKey="netCashRatioMax"
                filters={filters}
                onFilterChange={onFilterChange}
              />
            </div>
          </details>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-[var(--border)]">
        <button
          type="button"
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
          onClick={onClearFilters}
        >
          <MdFilterList className="text-lg" />
          🗑️ フィルターをクリア
        </button>
      </div>
    </aside>
  );
};
