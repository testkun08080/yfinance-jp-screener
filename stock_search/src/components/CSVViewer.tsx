import { useState, useEffect } from "react";
import { useCSVParser } from "../hooks/useCSVParser";
import { useFilters } from "../hooks/useFilters";
import { SearchFilters } from "./SearchFilters";
import { DataTable } from "./DataTable";
import { Pagination } from "./Pagination";
import { ColumnSelector, type ColumnConfig } from "./ColumnSelector";
import { getDefaultColumns } from "../utils/columnConfig";
import { DownloadButton } from "./DownloadButton";
import type { PaginationConfig } from "../types/stock";
import { PAGINATION } from "../constants/ui";

interface CSVFile {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
  url: string;
}

interface CSVViewerProps {
  file: CSVFile;
}

export const CSVViewer = ({ file }: CSVViewerProps) => {
  const { data, loading, error, reload } = useCSVParser(file);
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
    // shareFilters, // コメントアウト: 共有機能は不要
  } = useFilters(data);
  const [paginationConfig, setPaginationConfig] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: PAGINATION.defaultItemsPerPage,
    totalItems: 0,
  });
  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  // データが読み込まれたときに列設定を初期化
  useEffect(() => {
    if (data.length > 0) {
      const availableColumns = Object.keys(data[0]).filter(
        (key) => !key.startsWith("_") // 内部フィールドを除外
      );
      setColumns(getDefaultColumns(availableColumns));
    }
  }, [data]);

  // フィルター結果が変わったときにページをリセット
  useEffect(() => {
    setPaginationConfig((prev) => ({
      ...prev,
      currentPage: 1,
      totalItems: filteredData.length,
    }));
  }, [filteredData.length]);

  const handlePageChange = (page: number) => {
    setPaginationConfig((prev) => ({
      ...prev,
      currentPage: page,
    }));
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

  // コメントアウト: 共有機能は不要
  // const hasActiveFilters = () => {
  //   return (
  //     filters.companyName ||
  //     filters.industries.length > 0 ||
  //     filters.market ||
  //     filters.prefecture ||
  //     Object.entries(filters).some(([key, value]) =>
  //       key.includes("Min") || key.includes("Max") ? value !== null : false,
  //     )
  //   );
  // };

  const getDataSummary = () => {
    if (data.length === 0) return null;

    const validMarketCap = data
      .filter((stock) => stock.時価総額)
      .map((stock) => stock.時価総額!);
    const validPBR = data
      .filter((stock) => stock.PBR)
      .map((stock) => stock.PBR!);
    const validROE = data
      .filter((stock) => stock.ROE)
      .map((stock) => stock.ROE!);

    return {
      totalCount: data.length,
      filteredCount: filteredData.length,
      avgMarketCap:
        validMarketCap.length > 0
          ? validMarketCap.reduce((a, b) => a + b, 0) / validMarketCap.length
          : 0,
      avgPBR:
        validPBR.length > 0
          ? validPBR.reduce((a, b) => a + b, 0) / validPBR.length
          : 0,
      avgROE:
        validROE.length > 0
          ? validROE.reduce((a, b) => a + b, 0) / validROE.length
          : 0,
    };
  };

  const summary = getDataSummary();

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4">CSVデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="alert alert-error">
            <svg
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary" onClick={reload}>
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-bold mb-2">データがありません</h3>
          <p className="text-base-content/70">
            CSVファイルにデータが含まれていません
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 検索フィルター */}
      <SearchFilters
        filters={filters}
        availableIndustries={availableIndustries}
        availableMarkets={availableMarkets}
        availablePrefectures={availablePrefectures}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
      />

      {/* ヘッダー情報とサマリー */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="card-title text-xl">検索結果:</h2>
            </div>
          </div>

          {/* データサマリー */}
          {summary && summary.totalCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {summary.totalCount}
                </div>
                <div className="text-sm text-base-content/70">総企業数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">
                  {summary.filteredCount}
                </div>
                <div className="text-sm text-base-content/70">検索結果</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* データ操作メニュー */}
      <div className="bg-base-100 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
            ⚙️ データ操作
          </h3>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* CSVダウンロードボタン */}
          <div className="flex flex-col items-start">
            <DownloadButton
              data={filteredData}
              columns={columns}
              fileName={file.name.replace(/\.[^/.]+$/, "")} // 拡張子を除去
              totalCount={data.length}
            />
            <span className="text-xs text-base-content/60 mt-1">
              検索結果をExcelで開けます
            </span>
          </div>

          {/* 列選択ボタン */}
          {columns.length > 0 && (
            <div className="flex flex-col items-start">
              <ColumnSelector
                columns={columns}
                onColumnChange={handleColumnChange}
                onCategoryToggle={handleCategoryToggle}
              />
              <span className="text-xs text-base-content/60 mt-1">
                表示する項目を選択できます
              </span>
            </div>
          )}

          {/* シェアボタン - コメントアウト: 共有機能は不要 */}
          {/* {hasActiveFilters() && (
            <div className="flex flex-col items-start">
              <ShareButton
                shareUrl={shareFilters()}
                title={`投資分析結果 - ${filteredData.length}件の銘柄`}
                description={`株式検索の結果${filteredData.length}件の銘柄が見つかりました。検索条件を確認してください。`}
              />
              <span className="text-xs text-base-content/60 mt-1">
                URLをコピー・SNSで共有
              </span>
            </div>
          )} */}
        </div>
      </div>

      {/* データテーブル */}
      <DataTable
        data={filteredData}
        sortConfig={sortConfig}
        onSort={handleSort}
        currentPage={paginationConfig.currentPage}
        itemsPerPage={paginationConfig.itemsPerPage}
        visibleColumns={columns}
      />

      {/* ページネーション */}
      <div className="mt-6">
        <Pagination
          config={{
            ...paginationConfig,
            totalItems: filteredData.length,
          }}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
};
