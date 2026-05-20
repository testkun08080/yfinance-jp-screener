import type {
  CategoricalConditionField,
  ScreenerCondition,
  ScreenerState,
} from "../types/stock";

export const CATEGORICAL_CONDITION_FIELDS: readonly CategoricalConditionField[] = [
  "industries",
  "market",
  "prefecture",
] as const;

export const CATEGORICAL_FIELD_LABELS: Record<CategoricalConditionField, string> = {
  industries: "業種",
  market: "市場",
  prefecture: "都道府県",
};

export function isCategoricalField(field: string): field is CategoricalConditionField {
  return (CATEGORICAL_CONDITION_FIELDS as readonly string[]).includes(field);
}

export function isCategoricalCondition(
  condition: ScreenerCondition
): condition is Extract<ScreenerCondition, { kind: "categorical" }> {
  return condition.kind === "categorical" || isCategoricalField(condition.field);
}

export function isNumericCondition(
  condition: ScreenerCondition
): condition is Extract<ScreenerCondition, { kind?: "numeric" }> {
  return !isCategoricalCondition(condition);
}

export function createCategoricalCondition(
  field: CategoricalConditionField,
  values: string[] = []
): ScreenerCondition {
  return {
    id: crypto.randomUUID(),
    kind: "categorical",
    field,
    operator: "in",
    values,
  };
}

export function createNumericCondition(
  field: string,
  partial?: Partial<Omit<Extract<ScreenerCondition, { kind?: "numeric" }>, "id" | "kind">>
): ScreenerCondition {
  return {
    id: crypto.randomUUID(),
    kind: "numeric",
    field,
    operator: partial?.operator ?? "gte",
    value: partial?.value ?? 0,
  };
}

/** 旧形式の industries/market/prefecture を conditions へ移し、配列を空にする */
export function normalizeScreener(state: ScreenerState): ScreenerState {
  const conditions = [...state.conditions];
  const legacy: { field: CategoricalConditionField; values: string[] }[] = [
    { field: "industries", values: state.industries },
    { field: "market", values: state.market },
    { field: "prefecture", values: state.prefecture },
  ];

  for (const { field, values } of legacy) {
    if (values.length === 0) continue;
    const idx = conditions.findIndex(
      (c) => isCategoricalCondition(c) && c.field === field
    );
    if (idx >= 0) {
      const existing = conditions[idx];
      if (isCategoricalCondition(existing)) {
        const merged = [...new Set([...existing.values, ...values])];
        conditions[idx] = { ...existing, values: merged };
      }
    } else {
      conditions.push(createCategoricalCondition(field, [...values]));
    }
  }

  return {
    ...state,
    conditions,
    industries: [],
    market: [],
    prefecture: [],
  };
}
