import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MdFilterList,
  MdTableChart,
  MdError,
  MdDescription,
  MdStar,
  MdChevronRight,
} from "react-icons/md";
import { CSV_FILE_CONFIG } from "../constants/csv";
import { Sidebar } from "../components/Sidebar";
import { useCSVParser } from "../hooks/useCSVParser";
import { useFilters } from "../hooks/useFilters";
import { useFavorites } from "../hooks/useFavorites";
import { DataTable } from "../components/DataTable";
import { Pagination } from "../components/Pagination";
import {
  ColumnSelector,
  type ColumnConfig,
} from "../components/ColumnSelector";
import { getDefaultColumns } from "../utils/columnConfig";
import { DownloadButton } from "../components/DownloadButton";
import type { PaginationConfig } from "../types/stock";
import { PAGINATION } from "../constants/ui";
import {
  savePersistedCsv,
  loadPersistedCsv,
  clearPersistedCsv,
} from "../utils/csvIndexedDb";

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";

function getInitialSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

type ListTab = "all" | "favorites";

export const DataPage = () => {
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);
  /** IndexedDB からの復元試行が終わるまでメインの空状態を出さない */
  const [restorePending, setRestorePending] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const applySelectedFile = useCallback((file: CSVFile | null) => {
    releaseObjectUrl();
    if (file) {
      objectUrlRef.current = file.url;
    }
    setSelectedFile(file);
  }, [releaseObjectUrl]);

  useEffect(() => {
    return () => {
      releaseObjectUrl();
    };
  }, [releaseObjectUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadPersistedCsv();
        if (cancelled) return;
        if (saved) {
          const url = URL.createObjectURL(saved.blob);
          applySelectedFile({
            name: saved.name,
            displayName: saved.name,
            size: saved.size,
            lastModified: new Date(saved.lastModified).toISOString(),
            url,
          });
        }
      } catch {
        /* プライベートモード等では失敗しうる */
      } finally {
        if (!cancelled) setRestorePending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySelectedFile]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      await savePersistedCsv(file, {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      });
    } catch {
      /* 保存失敗時も表示は続行 */
    }
    const url = URL.createObjectURL(file);
    applySelectedFile({
      name: file.name,
      displayName: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      url,
    });
  };

  const handleClearFile = async () => {
    try {
      await clearPersistedCsv();
    } catch {
      /* ignore */
    }
    applySelectedFile(null);
  };

  const { data, loading, error, reload } = useCSVParser(selectedFile);
  const {
    filters,
    filteredData,
    sortConfig,
    availableIndustries,
    availableMarkets,
    availablePrefectures,
    updateFilter,
    clearFilters,
    handleSort,
  } = useFilters(data);
  const { favoriteCodesSet, toggle: onToggleFavorite } = useFavorites();

  /** 現在のデータに含まれるお気に入り銘柄のみ */
  const favoritesInData = useMemo(() => {
    const normalize = (c: string) => {
      const s = String(c).trim();
      return /^\d{1,4}$/.test(s) ? s.padStart(4, "0") : s;
    };
    return filteredData.filter((row) => {
      const code = row.銘柄コード ?? row.コード;
      if (code == null) return false;
      const n = normalize(String(code));
      return favoriteCodesSet.has(n) || favoriteCodesSet.has(String(code).trim());
    });
  }, [filteredData, favoriteCodesSet]);

  /** タブ: すべて / お気に入りのみ */
  const [listTab, setListTab] = useState<ListTab>("all");
  const displayData =
    listTab === "favorites" ? favoritesInData : filteredData;

  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: PAGINATION.defaultItemsPerPage,
    totalItems: 0,
  });
  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      const availableColumns = Object.keys(data[0]).filter(
        (key) => !key.startsWith("_")
      );
      setColumns(getDefaultColumns(availableColumns));
    }
  }, [data]);

  useEffect(() => {
    const total =
      listTab === "favorites" ? favoritesInData.length : filteredData.length;
    setPaginationConfig((prev) => ({
      ...prev,
      currentPage: 1,
      totalItems: total,
    }));
  }, [listTab, filteredData.length, favoritesInData.length]);

  const handlePageChange = (page: number) => {
    setPaginationConfig((prev) => ({ ...prev, currentPage: page }));
  };
  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPaginationConfig((prev) => ({
      ...prev,
      currentPage: 1,
      itemsPerPage,
    }));
  };
  const handleColumnChange = (key: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible } : col))
    );
  };
  const handleCategoryToggle = (category: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.category === category && !col.essential ? { ...col, visible } : col
      )
    );
  };

  const openFileSelect = () => mainFileInputRef.current?.click();

  const sidebarProps = {
    hasFile: !!selectedFile,
    fileInfo: selectedFile
      ? { name: selectedFile.name, size: selectedFile.size }
      : null,
    onFileSelect: handleFileUpload,
    onClear: handleClearFile,
    onOpenFileSelect: openFileSelect,
    filters,
    onFilterChange: updateFilter,
    onClearFilters: clearFilters,
    availableIndustries: selectedFile ? availableIndustries : [],
    availableMarkets: selectedFile ? availableMarkets : [],
    availablePrefectures: selectedFile ? availablePrefectures : [],
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* 常にDOMに置き、メインD&Dとサイドバー「データセットを変更」の両方で使用 */}
      <input
        ref={mainFileInputRef}
        type="file"
        accept={CSV_FILE_CONFIG.acceptAttribute}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileUpload(file);
          e.target.value = "";
        }}
        className="hidden"
      />
      {/* モバイル: サイドバーを下から出るモーダルで表示 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="フィルター・データセット"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="閉じる"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 h-[82vh] z-50 mobile-sheet-enter">
            <Sidebar
              {...sidebarProps}
              onClose={() => setSidebarOpen(false)}
              isDrawer
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* デスクトップ: 開閉可能 / モバイル: 非表示（ドロワーで開く） */}
        {!sidebarCollapsed && (
          <div className="hidden md:block flex-shrink-0">
            <Sidebar
              {...sidebarProps}
              onCollapse={() => setSidebarCollapsed(true)}
            />
          </div>
        )}

        {/* デスクトップ: 折りたたみ時に表示する展開タブ */}
        {sidebarCollapsed && (
          <div className="hidden md:flex w-12 flex-shrink-0 flex-col items-center border-r border-[var(--border)] bg-slate-50/50 py-4">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="サイドバーを開く"
              title="フィルター・データセットを開く"
            >
              <MdChevronRight className="text-xl" />
            </button>
            <span className="mt-2 text-[10px] text-slate-500">開く</span>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          {!selectedFile && restorePending && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="loading loading-spinner loading-lg text-[var(--primary)]" />
              <p className="mt-4 text-sm text-slate-600">
                保存済みの CSV を確認しています…
              </p>
            </div>
          )}

          {!selectedFile && !restorePending && (
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl mx-4 md:mx-6 bg-slate-50/50 hover:border-[var(--primary)] hover:bg-indigo-50/20 transition-colors cursor-pointer group"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file && file.type === CSV_FILE_CONFIG.mimeType) {
                  void handleFileUpload(file);
                }
              }}
              onClick={openFileSelect}
            >
              <MdTableChart className="text-6xl text-slate-300 group-hover:text-[var(--primary)] mb-4 transition-colors" />
              <h2 className="text-xl font-bold text-slate-700 mb-2">
                CSV を読み込んでください
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                ここに CSV をドロップするかクリックしてファイルを選択
              </p>
              <p className="text-xs text-slate-400 mb-2 max-w-md">
                読み込んだファイルはこのブラウザ内（IndexedDB）にのみ保持され、サーバーには送信されません。別タブを開いたりアプリを閉じたりしても、差し替えまたは「すべてクリア」まで同じデータを再利用できます。
              </p>
              <p className="text-xs text-slate-400 mb-6">
                読み込み後はサイドバーから別のファイルに差し替えできます
              </p>
              <Link
                to="/usage"
                className="text-sm text-[var(--primary)] font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                使い方 →
              </Link>
            </div>
          )}

          {selectedFile && loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="loading loading-spinner loading-lg text-[var(--primary)]" />
              <p className="mt-4 text-sm text-slate-600">
                CSV データを読み込み中...
              </p>
            </div>
          )}

          {selectedFile && error && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="alert alert-error max-w-md">
                <MdError />
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="btn btn-primary mt-4"
                onClick={reload}
              >
                再読み込み
              </button>
            </div>
          )}

          {selectedFile && !loading && !error && data.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MdDescription className="text-6xl text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                データがありません
              </h3>
              <p className="text-sm text-slate-500">
                CSV に有効なデータが含まれていません
              </p>
            </div>
          )}

          {selectedFile && !loading && !error && data.length > 0 && (
            <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
              {/* 一覧タブ・件数・操作（全画面幅で同一のコンパクトレイアウト） */}
              <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 md:px-6">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
                    onClick={() => setSidebarOpen(true)}
                    title="フィルター・データセットを開く"
                    aria-label="フィルター・データセット・一覧・件数を開く"
                  >
                    <MdFilterList className="text-xl" aria-hidden />
                  </button>
                  <div className="flex rounded-md border border-slate-200 bg-slate-50 p-px">
                    <button
                      type="button"
                      title="すべて表示"
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        listTab === "all"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                      onClick={() => setListTab("all")}
                    >
                      すべて
                    </button>
                    <button
                      type="button"
                      title="お気に入りのみ"
                      className={`flex items-center gap-0.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
                        listTab === "favorites"
                          ? "bg-white text-amber-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                      onClick={() => setListTab("favorites")}
                    >
                      <MdStar className="text-amber-500 text-sm" aria-hidden />
                      <span className="hidden sm:inline">お気に入り</span>
                      {favoritesInData.length > 0 && (
                        <span className="tabular-nums text-[10px] opacity-80">
                          {favoritesInData.length}
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="h-7 w-px flex-shrink-0 bg-slate-100 md:hidden" />
                  <div className="hidden h-7 w-px bg-slate-100 sm:block" />
                  <div className="flex items-end gap-4 md:gap-5">
                    <div
                      className="leading-none"
                      title={
                        listTab === "all"
                          ? `総件数 ${displayData.length.toLocaleString()}`
                          : `お気に入り ${displayData.length.toLocaleString()}`
                      }
                    >
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        {listTab === "all" ? "総件数" : "お気に入り"}
                      </p>
                      <p className="text-base font-bold tabular-nums text-slate-900 md:text-lg">
                        {displayData.length.toLocaleString()}
                      </p>
                    </div>
                    {listTab === "all" && (
                      <>
                        <div className="mb-1 h-6 w-px bg-slate-100" />
                        <div
                          className="leading-none"
                          title={`絞り込み結果 ${filteredData.length.toLocaleString()}`}
                        >
                          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                            絞り込み
                          </p>
                          <p className="text-base font-bold tabular-nums text-[var(--primary)] md:text-lg">
                            {filteredData.length.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <ColumnSelector
                    columns={columns}
                    onColumnChange={handleColumnChange}
                    onCategoryToggle={handleCategoryToggle}
                    compactTrigger
                  />
                  <DownloadButton
                    data={displayData}
                    columns={columns}
                    fileName={selectedFile.name.replace(/\.[^/.]+$/, "")}
                    totalCount={data.length}
                    compactTrigger
                  />
                </div>
              </div>

              {/* Table area */}
              <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                <DataTable
                  data={displayData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  currentPage={paginationConfig.currentPage}
                  itemsPerPage={paginationConfig.itemsPerPage}
                  visibleColumns={columns}
                  favoriteCodes={favoriteCodesSet}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>

              {/* Footer: pagination */}
              <footer className="min-h-14 border-t border-[var(--border)] bg-white px-4 md:px-6 py-3 pb-8 md:pb-3 flex flex-wrap items-center justify-center md:justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-xs font-semibold text-slate-500">
                    表示件数
                  </span>
                  <select
                    className="text-xs border border-slate-200 rounded py-1 pl-2 pr-8 focus:ring-[var(--primary)]"
                    value={paginationConfig.itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(parseInt(e.target.value))
                    }
                  >
                    {PAGINATION.itemsPerPageOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <nav className="flex items-center gap-1">
                  <Pagination
                    variant="compact"
                    config={{
                      ...paginationConfig,
                      totalItems: displayData.length,
                    }}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </nav>
                <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  表示中:{" "}
                  {displayData.length === 0
                    ? "0 - 0"
                    : `${
                        (paginationConfig.currentPage - 1) *
                          paginationConfig.itemsPerPage +
                        1
                      } - ${Math.min(
                        paginationConfig.currentPage *
                          paginationConfig.itemsPerPage,
                        displayData.length
                      )}`}{" "}
                  / {displayData.length.toLocaleString()} 件
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
