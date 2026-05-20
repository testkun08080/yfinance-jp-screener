import type { ScreenerCondition, ScreenerState } from "../types/stock";
import type { ScreenerFieldMeta } from "../utils/screenerFieldRegistry";
import { formatConditionSummary } from "../utils/screenerFieldRegistry";
import { isCategoricalCondition } from "../utils/screenerConditions";
import { ScreenerConditionRow, type CategoricalOptions } from "./ScreenerConditionRow";

export interface ScreenerConditionsPanelProps {
  screener: ScreenerState;
  screenableFields: ScreenerFieldMeta[];
  onUpdateCondition: (id: string, patch: Partial<Omit<ScreenerCondition, "id">>) => void;
  onRemoveCondition: (id: string) => void;
  onExcludeMissingChange: (value: boolean) => void;
  categoricalOptions: CategoricalOptions;
}

export function ScreenerConditionsPanel({
  screener,
  screenableFields,
  onUpdateCondition,
  onRemoveCondition,
  onExcludeMissingChange,
  categoricalOptions,
}: ScreenerConditionsPanelProps) {
  return (
    <div className="space-y-3">
      {screener.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {screener.conditions.map((c) => {
            const meta = isCategoricalCondition(c)
              ? undefined
              : screenableFields.find((f) => f.field === c.field);
            return (
              <span
                key={c.id}
                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600"
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
            categoricalOptions={categoricalOptions}
            onChange={(patch) => onUpdateCondition(condition.id, patch)}
            onRemove={() => onRemoveCondition(condition.id)}
          />
        ))}
      </div>

      <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-xs checkbox-primary"
          checked={screener.excludeMissing}
          onChange={(e) => onExcludeMissingChange(e.target.checked)}
        />
        値なしを除外
      </label>
    </div>
  );
}
