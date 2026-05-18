import { useState } from "react";
import { MdAdd, MdFilterList, MdLink, MdSort } from "react-icons/md";
import type { ScreenerCondition, ScreenerState } from "../types/stock";
import type { ScreenerFieldMeta } from "../utils/screenerFieldRegistry";
import { formatConditionSummary } from "../utils/screenerFieldRegistry";
import { ScreenerConditionRow } from "./ScreenerConditionRow";

interface ScreenerBarProps {
  totalCount: number;
  filteredCount: number;
  screener: ScreenerState;
  screenableFields: ScreenerFieldMeta[];
  sortableKeys: string[];
  onAddCondition: () => void;
  onUpdateCondition: (id: string, patch: Partial<Omit<ScreenerCondition, "id">>) => void;
  onRemoveCondition: (id: string) => void;
  onClearConditions: () => void;
  onClearAll: () => void;
  onExcludeMissingChange: (value: boolean) => void;
  onSetSort: (key: string, direction: "asc" | "desc") => void;
  onCopyShareUrl: () => Promise<boolean>;
}

export function ScreenerBar({
  totalCount,
  filteredCount,
  screener,
  screenableFields,
  sortableKeys,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onClearConditions,
  onClearAll,
  onExcludeMissingChange,
  onSetSort,
  onCopyShareUrl,
}: ScreenerBarProps) {
  const [copyOk, setCopyOk] = useState(false);

  const handleCopy = async () => {
    const ok = await onCopyShareUrl();
    setCopyOk(ok);
    if (ok) setTimeout(() => setCopyOk(false), 2000);
  };

  const sortKey = screener.sort?.key ? String(screener.sort.key) : "";
  const sortDir = screener.sort?.direction ?? "desc";

  return (
    <section
      className="flex-shrink-0 border-b border-[var(--border)] bg-slate-50/80 px-3 py-3 md:px-4 space-y-3"
      aria-label="スクリーニング"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <MdFilterList className="text-[var(--primary)]" aria-hidden />
            スクリーニング
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            全 <span className="font-semibold text-slate-700">{totalCount.toLocaleString()}</span> 件
            → 絞り込み後{" "}
            <span className="font-semibold text-[var(--primary)]">
              {filteredCount.toLocaleString()}
            </span>{" "}
            件
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-xs checkbox-primary"
              checked={screener.excludeMissing}
              onChange={(e) => onExcludeMissingChange(e.target.checked)}
            />
            値なしを除外
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1"
            onClick={handleCopy}
            title="現在の条件でURLをコピー"
          >
            <MdLink className="text-sm" />
            {copyOk ? "コピーしました" : "URL共有"}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-snug">
        yfinance 由来のデータです。指標はロードした CSV の列から選択できます。
      </p>

      {screener.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {screener.conditions.map((c) => {
            const meta = screenableFields.find((f) => f.field === c.field);
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600"
              >
                {formatConditionSummary(c, meta)}
              </span>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {screener.conditions.map((condition) => (
          <ScreenerConditionRow
            key={condition.id}
            condition={condition}
            fields={screenableFields}
            onChange={(patch) => onUpdateCondition(condition.id, patch)}
            onRemove={() => onRemoveCondition(condition.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm gap-1 shadow-sm"
          onClick={onAddCondition}
          disabled={screenableFields.length === 0}
        >
          <MdAdd className="text-base" />
          条件を追加
        </button>
        {screener.conditions.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClearConditions}>
            条件のみクリア
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClearAll}>
          すべてクリア
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <MdSort className="text-slate-400 text-sm shrink-0" aria-hidden />
          <select
            className="select select-bordered select-xs max-w-[10rem]"
            value={sortKey}
            onChange={(e) => onSetSort(e.target.value, sortDir)}
            aria-label="ソート列"
          >
            <option value="">ソートなし</option>
            {sortableKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-xs"
            value={sortDir}
            disabled={!sortKey}
            onChange={(e) => onSetSort(sortKey, e.target.value as "asc" | "desc")}
            aria-label="ソート順"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
        </div>
      </div>
    </section>
  );
}
