import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  MdClose,
  MdChevronLeft,
  MdFolderOpen,
  MdExpandMore,
  MdFilterList,
  MdAnalytics,
  MdBookmarkAdd,
} from "react-icons/md";
import type { ScreenerState, SavedFilterPreset, ScreenerCategoricalKey } from "../types/stock";
import type { FilterPreset } from "../constants/presets";
import { CSV_FILE_CONFIG } from "../constants/csv";
import { FILE_SIZE } from "../constants/formatting";
import { FILTER_PRESETS } from "../constants/presets";
import {
  loadHiddenBuiltinPresetIds,
  persistHiddenBuiltinPresetIds,
} from "../utils/builtinPresetHiddenStorage";
import { NAVIGATION_ITEMS } from "../constants/ui";

interface FileInfo {
  name: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZE.kilobyte) return `${bytes} B`;
  if (bytes < FILE_SIZE.megabyte) return `${(bytes / FILE_SIZE.kilobyte).toFixed(2)} KB`;
  return `${(bytes / FILE_SIZE.megabyte).toFixed(2)} MB`;
}

interface SidebarProps {
  hasFile: boolean;
  fileInfo: FileInfo | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  /** データ読み込み後、別のファイルを選択するためにファイルダイアログを開く */
  onOpenFileSelect?: () => void;
  filters: ScreenerState;
  onFilterChange: (
    key: ScreenerCategoricalKey | "companyName" | "stockCode",
    value: string | number | string[] | boolean | null
  ) => void;
  onClearFilters: () => void;
  onApplyPreset?: (preset: FilterPreset) => void;
  customPresets?: SavedFilterPreset[];
  onSaveCustomPreset?: (name: string) => string | null;
  onApplyCustomPreset?: (preset: SavedFilterPreset) => void;
  onDeleteCustomPreset?: (id: string) => void;
  availableIndustries: string[];
  availableMarkets: string[];
  availablePrefectures: string[];
  /** モバイルドロワー時に閉じるコールバック（指定時は閉じるボタンを表示） */
  onClose?: () => void;
  /** モバイル用ドロワーとして表示する場合 true */
  isDrawer?: boolean;
  /** デスクトップでサイドバーを折りたたむコールバック（指定時は折りたたみボタンを表示） */
  onCollapse?: () => void;
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
  onApplyPreset,
  customPresets = [],
  onSaveCustomPreset,
  onApplyCustomPreset,
  onDeleteCustomPreset,
  availableIndustries,
  availableMarkets,
  availablePrefectures,
  onClose,
  isDrawer = false,
  onCollapse,
}: SidebarProps) => {
  const [savePresetModalOpen, setSavePresetModalOpen] = useState(false);
  const [modalPresetName, setModalPresetName] = useState("");
  const [modalPresetErr, setModalPresetErr] = useState<string | null>(null);
  const [hiddenBuiltinPresetIds, setHiddenBuiltinPresetIds] = useState<string[]>(() =>
    loadHiddenBuiltinPresetIds()
  );

  useEffect(() => {
    persistHiddenBuiltinPresetIds(hiddenBuiltinPresetIds);
  }, [hiddenBuiltinPresetIds]);

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
      className={`flex-shrink-0 bg-white flex flex-col overflow-hidden ${
        isDrawer
          ? "w-full h-full rounded-t-2xl border-t border-[var(--border)] shadow-2xl"
          : "w-72 h-full border-r border-[var(--border)]"
      }`}
    >
      {/* アプリ chrome（旧トップヘッダー相当）: ブランド・ナビ・閉じる/折りたたみ */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-white">
        <div className="flex items-center gap-2 px-3 py-2 min-h-[44px]">
          <Link
            to="/"
            className="flex items-center gap-2 min-w-0 flex-1 no-underline text-inherit hover:opacity-90"
            aria-label="ホーム"
            onClick={() => {
              if (isDrawer && onClose) onClose();
            }}
          >
            <div className="w-7 h-7 shrink-0 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white">
              <MdAnalytics className="text-lg" aria-hidden />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800 truncate">
              <span className="text-[var(--primary)]">yfsc</span>
            </span>
          </Link>
          <div className="flex items-center gap-0.5 shrink-0">
            {onCollapse && (
              <button
                type="button"
                className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                onClick={onCollapse}
                aria-label="サイドバーを折りたたむ"
                title="サイドバーを折りたたむ"
              >
                <MdChevronLeft className="text-lg" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 md:hidden"
                onClick={onClose}
                aria-label="閉じる"
              >
                <MdClose className="text-lg" />
              </button>
            )}
          </div>
        </div>
        <nav
          className="flex flex-wrap gap-x-1 gap-y-1 px-2 pb-2 border-t border-slate-100/90"
          aria-label="サイト内"
        >
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => {
                if (isDrawer && onClose) onClose();
              }}
              className={({ isActive }) =>
                `inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold no-underline transition-colors ${
                  isActive
                    ? "bg-[var(--primary)]/12 text-[var(--primary)]"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              <span className="truncate max-w-[9.5rem]">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
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
            <p className="text-[10px] text-slate-400">{formatFileSize(fileInfo.size)} • 準備完了</p>
            <p className="text-[10px] text-slate-400 mt-1">ドロップで差し替え</p>
          </div>
        ) : (
          <div className="border-2 border-slate-100 rounded-lg p-3 text-center bg-slate-50/50">
            <p className="text-[11px] text-slate-400">未読み込み</p>
            <p className="text-[10px] text-slate-400 mt-0.5">メインエリアでCSVを読み込み</p>
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

        {/* プリセットフィルター（標準＋マイプリセットを同一一覧） */}
        {onApplyPreset && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
              スクリーニングプリセット
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_PRESETS.filter((p) => !hiddenBuiltinPresetIds.includes(p.id)).map((preset) => (
                <span
                  key={preset.id}
                  className="inline-flex items-stretch rounded-full border border-[var(--primary)] text-[var(--primary)] overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    title={preset.description}
                    className="text-[11px] font-semibold px-2.5 py-1 leading-tight hover:bg-[var(--primary)] hover:text-white transition-colors"
                    onClick={() => onApplyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                  <button
                    type="button"
                    className="px-1.5 border-l border-[var(--primary)]/25 text-slate-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    title="一覧から削除（再表示は下部リンク）"
                    aria-label={`「${preset.label}」を一覧から削除`}
                    onClick={() =>
                      setHiddenBuiltinPresetIds((prev) =>
                        prev.includes(preset.id) ? prev : [...prev, preset.id]
                      )
                    }
                  >
                    <MdClose className="text-sm" aria-hidden />
                  </button>
                </span>
              ))}
              {onApplyCustomPreset &&
                onDeleteCustomPreset &&
                customPresets.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-stretch rounded-full border border-slate-300 text-slate-700 overflow-hidden shadow-sm"
                  >
                    <button
                      type="button"
                      title="この条件を適用"
                      className="text-[11px] font-semibold px-2.5 py-1 leading-tight hover:bg-slate-700 hover:text-white transition-colors max-w-[10rem] truncate"
                      onClick={() => {
                        onApplyCustomPreset(p);
                        if (isDrawer && onClose) onClose();
                      }}
                    >
                      {p.label}
                    </button>
                    <button
                      type="button"
                      className="px-1.5 border-l border-slate-200 text-slate-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                      title="このプリセットを削除"
                      aria-label={`「${p.label}」を削除`}
                      onClick={() => onDeleteCustomPreset(p.id)}
                    >
                      <MdClose className="text-sm" aria-hidden />
                    </button>
                  </span>
                ))}
            </div>
            {hiddenBuiltinPresetIds.length > 0 && (
              <button
                type="button"
                className="mt-2 text-[10px] font-semibold text-[var(--primary)] hover:underline"
                onClick={() => setHiddenBuiltinPresetIds([])}
              >
                削除した標準プリセットをすべて再表示
              </button>
            )}
          </div>
        )}

        {/* 基本フィルター */}
        <div className="space-y-1">
          <details className="group border-b border-slate-100 pb-2" open>
            <summary className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700">📋 基本フィルター</span>
              <MdExpandMore className="text-sm text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2 space-y-4">
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
                        onChange={(e) => handleIndustryChange(industry, e.target.checked)}
                      />
                      <span className="text-[11px] text-slate-600 truncate">{industry}</span>
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
                        onChange={(e) => handleMarketChange(market, e.target.checked)}
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
                          onChange={(e) => handlePrefectureChange(prefecture, e.target.checked)}
                        />
                        <span className="text-[11px] text-slate-600 truncate">{prefecture}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>

        <p className="text-[10px] text-slate-500 px-0.5 pb-2">
          数値条件はメイン画面の「＋ 条件を追加」から設定できます。
        </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-[var(--border)] shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 min-w-0 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 text-[11px] sm:text-xs"
            onClick={onClearFilters}
          >
            <MdFilterList className="text-base shrink-0" aria-hidden />
            <span className="truncate">フィルターをクリア</span>
          </button>
          {onSaveCustomPreset && onApplyCustomPreset && onDeleteCustomPreset && (
            <button
              type="button"
              className="flex-1 min-w-0 bg-white border-2 border-slate-200 hover:border-[var(--primary)] text-slate-700 hover:text-[var(--primary)] font-bold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 text-[11px] sm:text-xs"
              title="現在の条件を名前を付けて保存"
              onClick={() => {
                setModalPresetName("");
                setModalPresetErr(null);
                setSavePresetModalOpen(true);
              }}
            >
              <MdBookmarkAdd className="text-base shrink-0" aria-hidden />
              <span className="truncate">条件を保存</span>
            </button>
          )}
        </div>
      </div>

      {savePresetModalOpen && onSaveCustomPreset && (
        <div className="modal modal-open z-[200]" role="dialog" aria-modal="true" aria-labelledby="save-preset-title">
          <div className="modal-box max-w-sm p-5 shadow-xl">
            <h3 id="save-preset-title" className="font-bold text-base text-slate-800 mb-1">
              マイプリセットに保存
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              表示中のフィルター条件を保存します。名前を入力して保存してください。
            </p>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1" htmlFor="save-preset-name">
              プリセット名
            </label>
            <input
              id="save-preset-name"
              type="text"
              className="input input-bordered input-sm w-full text-sm mb-2"
              placeholder="例: 小型グロース"
              maxLength={40}
              autoFocus
              value={modalPresetName}
              onChange={(e) => {
                setModalPresetName(e.target.value);
                if (modalPresetErr) setModalPresetErr(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const err = onSaveCustomPreset(modalPresetName);
                  if (err) {
                    setModalPresetErr(err);
                    return;
                  }
                  setSavePresetModalOpen(false);
                }
              }}
            />
            {modalPresetErr && <p className="text-xs text-red-600 mb-2">{modalPresetErr}</p>}
            <div className="modal-action mt-2 gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                className="btn btn-ghost btn-sm flex-1"
                onClick={() => setSavePresetModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm flex-1"
                onClick={() => {
                  const err = onSaveCustomPreset(modalPresetName);
                  if (err) {
                    setModalPresetErr(err);
                    return;
                  }
                  setSavePresetModalOpen(false);
                }}
              >
                保存する
              </button>
            </div>
          </div>
          <button
            type="button"
            className="modal-backdrop bg-black/50"
            aria-label="閉じる"
            onClick={() => setSavePresetModalOpen(false)}
          />
        </div>
      )}
    </aside>
  );
};
