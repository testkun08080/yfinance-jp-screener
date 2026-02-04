import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CSV_FILE_CONFIG } from "../constants/csv";
import { Sidebar } from "../components/Sidebar";
import { useCSVParser } from "../hooks/useCSVParser";
import { useFilters } from "../hooks/useFilters";
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

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

export const DataPage = () => {
  const [selectedFile, setSelectedFile] = useState<CSVFile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    setSelectedFile({
      name: file.name,
      displayName: file.name,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
      url: URL.createObjectURL(file),
    });
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
    setPaginationConfig((prev) => ({
      ...prev,
      currentPage: 1,
      totalItems: filteredData.length,
    }));
  }, [filteredData.length]);

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
    onClear: () => setSelectedFile(null),
    onOpenFileSelect: openFileSelect,
    filters,
    onFilterChange: updateFilter,
    onClearFilters: clearFilters,
    availableIndustries: selectedFile ? availableIndustries : [],
    availableMarkets: selectedFile ? availableMarkets : [],
    availablePrefectures: selectedFile ? availablePrefectures : [],
  };

  return (
    <div className="flex flex-1 overflow-hidden flex-col h-full">
      {/* 常にDOMに置き、メインD&Dとサイドバー「データセットを変更」の両方で使用 */}
      <input
        ref={mainFileInputRef}
        type="file"
        accept={CSV_FILE_CONFIG.acceptAttribute}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
        className="hidden"
      />
      {/* モバイル: サイドバーをドロワーで表示 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="閉じる"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white z-50">
            <Sidebar
              {...sidebarProps}
              onClose={() => setSidebarOpen(false)}
              isDrawer
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* デスクトップ: 常に表示 / モバイル: 非表示（ドロワーで開く） */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar {...sidebarProps} />
        </div>

        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* モバイル: フィルターを開くボタン */}
          <div className="md:hidden flex-shrink-0 px-3 py-2 border-b border-[var(--border)] bg-white flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-lg">
                filter_list
              </span>
              フィルター・データセット
            </button>
          </div>
          {!selectedFile && (
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
                  handleFileUpload(file);
                }
              }}
              onClick={openFileSelect}
            >
              <span className="material-symbols-outlined text-6xl text-slate-300 group-hover:text-[var(--primary)] mb-4 transition-colors">
                table_chart
              </span>
              <h2 className="text-xl font-bold text-slate-700 mb-2">
                CSV を読み込んでください
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                ここに CSV をドロップするかクリックしてファイルを選択
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
                <span className="material-symbols-outlined">error</span>
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
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
                description
              </span>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                データがありません
              </h3>
              <p className="text-sm text-slate-500">
                CSV に有効なデータが含まれていません
              </p>
            </div>
          )}

          {selectedFile && !loading && !error && data.length > 0 && (
            <>
              {/* Main toolbar: stats + buttons */}
              <div className="px-3 md:px-6 py-3 md:py-4 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-6 md:gap-10">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      総件数
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900">
                      {data.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-[1px] h-10 bg-slate-100" />
                  <div>
                    <p className="text-[11px] font-bold text-[var(--primary)] uppercase tracking-tight">
                      絞り込み結果
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-[var(--primary)]">
                      {filteredData.length.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ColumnSelector
                    columns={columns}
                    onColumnChange={handleColumnChange}
                    onCategoryToggle={handleCategoryToggle}
                  />
                  <DownloadButton
                    data={filteredData}
                    columns={columns}
                    fileName={selectedFile.name.replace(/\.[^/.]+$/, "")}
                    totalCount={data.length}
                  />
                </div>
              </div>

              {/* Table area */}
              <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                <DataTable
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  currentPage={paginationConfig.currentPage}
                  itemsPerPage={paginationConfig.itemsPerPage}
                  visibleColumns={columns}
                />
              </div>

              {/* Footer: pagination（スマホで見切れないよう下に余白） */}
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
                      totalItems: filteredData.length,
                    }}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </nav>
                <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  表示中:{" "}
                  {filteredData.length === 0
                    ? "0 - 0"
                    : `${
                        (paginationConfig.currentPage - 1) *
                          paginationConfig.itemsPerPage +
                        1
                      } - ${Math.min(
                        paginationConfig.currentPage *
                          paginationConfig.itemsPerPage,
                        filteredData.length
                      )}`}{" "}
                  / {filteredData.length.toLocaleString()} 件
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
