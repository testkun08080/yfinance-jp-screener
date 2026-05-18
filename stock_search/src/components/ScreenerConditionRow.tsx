import type { ScreenerCondition, ScreenerOperator } from "../types/stock";
import type { ScreenerFieldMeta } from "../utils/screenerFieldRegistry";
import { OPERATOR_LABELS } from "../utils/screenerFieldRegistry";
import { MdClose } from "react-icons/md";

interface ScreenerConditionRowProps {
  condition: ScreenerCondition;
  fields: ScreenerFieldMeta[];
  onChange: (patch: Partial<Omit<ScreenerCondition, "id">>) => void;
  onRemove: () => void;
}

const OPERATORS: ScreenerOperator[] = ["gte", "lte", "between", "eq"];

export function ScreenerConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
}: ScreenerConditionRowProps) {
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
        {fields.map((f) => (
          <option key={f.field} value={f.field}>
            {f.label}
          </option>
        ))}
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
