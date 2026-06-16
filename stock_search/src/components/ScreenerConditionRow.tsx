import type { ScreenerCondition, ScreenerOperator } from "../types/stock";
import type { ScreenerFieldMeta } from "../utils/screenerFieldRegistry";
import { OPERATOR_LABELS } from "../utils/screenerFieldRegistry";
import {
  CATEGORICAL_CONDITION_FIELDS,
  CATEGORICAL_FIELD_LABELS,
  isCategoricalCondition,
  isCategoricalField,
  type ScreenerConditionPatch,
} from "../utils/screenerConditions";
import { MdClose } from "react-icons/md";

export interface CategoricalOptions {
  industries: string[];
  market: string[];
  prefecture: string[];
}

interface ScreenerConditionRowProps {
  condition: ScreenerCondition;
  fields: ScreenerFieldMeta[];
  categoricalOptions: CategoricalOptions;
  onChange: (patch: ScreenerConditionPatch) => void;
  onRemove: () => void;
}

const OPERATORS: ScreenerOperator[] = ["gte", "lte", "between", "eq"];

function getOptionsForField(
  field: string,
  options: CategoricalOptions
): { value: string; label: string }[] {
  if (field === "industries") {
    return options.industries.map((v) => ({ value: v, label: v }));
  }
  if (field === "market") {
    return options.market.map((v) => ({
      value: v,
      label: v.replace("（内国株式）", ""),
    }));
  }
  if (field === "prefecture") {
    return options.prefecture.map((v) => ({ value: v, label: v }));
  }
  return [];
}

export function ScreenerConditionRow({
  condition,
  fields,
  categoricalOptions,
  onChange,
  onRemove,
}: ScreenerConditionRowProps) {
  if (isCategoricalCondition(condition)) {
    const listOptions = getOptionsForField(condition.field, categoricalOptions);
    const selected = new Set(condition.values);

    const toggleValue = (value: string, checked: boolean) => {
      const next = checked
        ? [...condition.values, value]
        : condition.values.filter((v) => v !== value);
      onChange({ values: next });
    };

    return (
      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          <select
            className="text-[11px] p-1.5 border border-slate-200 rounded bg-white flex-1 min-w-0"
            value={condition.field}
            onChange={(e) => {
              const field = e.target.value;
              if (isCategoricalField(field)) {
                onChange({ field, values: [] });
              }
            }}
            aria-label="条件の種類"
          >
            {CATEGORICAL_CONDITION_FIELDS.map((f) => (
              <option key={f} value={f}>
                {CATEGORICAL_FIELD_LABELS[f]}
              </option>
            ))}
            <option disabled>── 数値指標 ──</option>
            {fields.map((f) => (
              <option key={f.field} value={f.field}>
                {f.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500 shrink-0">いずれか</span>
          <button
            type="button"
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 shrink-0"
            onClick={onRemove}
            aria-label="条件を削除"
          >
            <MdClose className="text-base" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto custom-scrollbar">
          {listOptions.map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--primary)] focus:ring-0"
                checked={selected.has(value)}
                onChange={(e) => toggleValue(value, e.target.checked)}
              />
              <span className="text-[11px] text-slate-600 truncate">{label}</span>
            </label>
          ))}
        </div>
        {listOptions.length === 0 && (
          <p className="text-[10px] text-slate-400">選択肢がありません</p>
        )}
      </div>
    );
  }

  const meta = fields.find((f) => f.field === condition.field) ?? fields[0];
  const unit = meta?.unit ?? "";

  const renderValueInputs = () => {
    if (condition.operator === "between") {
      const [min, max] = Array.isArray(condition.value) ? condition.value : [0, 0];
      return (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="number"
            className="text-[11px] p-1.5 border border-slate-200 rounded w-full min-w-0"
            placeholder="最小"
            value={min}
            onChange={(e) =>
              onChange({
                value: [parseFloat(e.target.value) || 0, max],
              })
            }
          />
          <span className="text-slate-400 text-xs shrink-0">〜</span>
          <input
            type="number"
            className="text-[11px] p-1.5 border border-slate-200 rounded w-full min-w-0"
            placeholder="最大"
            value={max}
            onChange={(e) =>
              onChange({
                value: [min, parseFloat(e.target.value) || 0],
              })
            }
          />
        </div>
      );
    }
    return (
      <input
        type="number"
        className="text-[11px] p-1.5 border border-slate-200 rounded flex-1 min-w-0"
        placeholder="値"
        value={condition.value as number}
        onChange={(e) => onChange({ value: parseFloat(e.target.value) || 0 })}
      />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
      <select
        className="text-[11px] p-1.5 border border-slate-200 rounded bg-white min-w-[7rem] max-w-[10rem]"
        value={condition.field}
        onChange={(e) => onChange({ field: e.target.value })}
        aria-label="指標"
      >
        <optgroup label="カテゴリ">
          {CATEGORICAL_CONDITION_FIELDS.map((f) => (
            <option key={f} value={f}>
              {CATEGORICAL_FIELD_LABELS[f]}
            </option>
          ))}
        </optgroup>
        <optgroup label="数値指標">
          {fields.map((f) => (
            <option key={f.field} value={f.field}>
              {f.label}
            </option>
          ))}
        </optgroup>
      </select>
      <select
        className="text-[11px] p-1.5 border border-slate-200 rounded bg-white"
        value={condition.operator}
        onChange={(e) => {
          const op = e.target.value as ScreenerOperator;
          if (op === "between") {
            const v = condition.value;
            const num = typeof v === "number" ? v : Array.isArray(v) ? v[0] : 0;
            onChange({ operator: op, value: [num, num] });
          } else if (Array.isArray(condition.value)) {
            onChange({ operator: op, value: condition.value[0] });
          } else {
            onChange({ operator: op });
          }
        }}
        aria-label="演算子"
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>
      {renderValueInputs()}
      {unit && <span className="text-[10px] text-slate-400 shrink-0">{unit}</span>}
      <button
        type="button"
        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 shrink-0"
        onClick={onRemove}
        aria-label="条件を削除"
      >
        <MdClose className="text-base" />
      </button>
    </div>
  );
}
