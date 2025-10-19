import React from "react";
import { ITEMS_PER_PAGE_OPTIONS } from "../types/stock";
import type { PaginationConfig } from "../types/stock";

interface PaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  config,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const { currentPage, itemsPerPage, totalItems } = config;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - halfVisible);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* アイテム数表示 */}
        <div className="text-sm text-base-content/70">
          {startIndex} - {endIndex} 件 / 全 {totalItems} 件
        </div>

        {/* ページネーション */}
        <div className="flex items-center gap-2">
          {/* 最初のページ */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            ⏮️
          </button>

          {/* 前のページ */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ⬅️
          </button>

          {/* ページ番号 */}
          <div className="flex gap-1 overflow-x-auto">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`btn btn-sm min-w-[2.5rem] ${
                  page === currentPage ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          {/* 次のページ */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ➡️
          </button>

          {/* 最後のページ */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            ⏭️
          </button>
        </div>

        {/* 表示件数選択 */}
        <div className="form-control">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">表示件数:</span>
            <select
              className="select select-bordered select-sm"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}件
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
