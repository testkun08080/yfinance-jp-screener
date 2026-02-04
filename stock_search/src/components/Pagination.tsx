import React from "react";
import {
  MdFirstPage,
  MdChevronLeft,
  MdChevronRight,
  MdLastPage,
} from "react-icons/md";
import type { PaginationConfig } from "../types/stock";
import { PAGINATION } from "../constants/ui";

interface PaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  /** When true, only render page nav buttons (for new-design footer) */
  variant?: "default" | "compact";
}

export const Pagination: React.FC<PaginationProps> = ({
  config,
  onPageChange,
  onItemsPerPageChange,
  variant = "default",
}) => {
  const { currentPage, itemsPerPage, totalItems } = config;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = PAGINATION.maxVisiblePages;

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

  const navButtons = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="最初のページへ"
      >
        <MdFirstPage className="text-lg" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="前のページへ"
      >
        <MdChevronLeft className="text-lg" />
      </button>
      <div className="flex items-center gap-1 px-2">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            className={`w-8 h-8 rounded-md text-xs font-semibold transition-colors ${
              page === currentPage
                ? "bg-[var(--primary)] text-white"
                : "hover:bg-slate-100 text-slate-600"
            }`}
            onClick={() => onPageChange(page)}
            aria-label={`ページ ${page} へ`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="次のページへ"
      >
        <MdChevronRight className="text-lg" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="最後のページへ"
      >
        <MdLastPage className="text-lg" />
      </button>
    </div>
  );

  if (variant === "compact") {
    return <>{navButtons}</>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="text-sm text-base-content/70">
          {startIndex} - {endIndex} 件 / 全 {totalItems} 件
        </div>
        <div className="flex items-center gap-2">{navButtons}</div>
        <div className="form-control">
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">表示件数:</span>
            <select
              className="select select-bordered select-sm"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            >
              {PAGINATION.itemsPerPageOptions.map((option) => (
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
