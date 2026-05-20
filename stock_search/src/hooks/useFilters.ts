import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  StockData,
  ScreenerState,
  ScreenerCondition,
  ScreenerCategoricalKey,
  SavedFilterPreset,
  SortConfig,
} from "../types/stock";
import { mergeUrlIntoScreener, updateUrlWithScreener, generateShareUrl } from "../utils/urlParams";
import {
  loadCustomFilterPresets,
  persistCustomFilterPresets,
} from "../utils/customFilterPresetsStorage";
import { filterStocks, detectMarketTypeFromTicker } from "../utils/screenerEngine";
import { initialScreenerState, searchFiltersToScreenerState } from "../utils/searchFiltersMigration";
import { buildScreenableFields } from "../utils/screenerFieldRegistry";
import {
  createCategoricalCondition,
  createNumericCondition,
  isCategoricalField,
  isCategoricalCondition,
  isNumericCondition,
  normalizeScreener,
} from "../utils/screenerConditions";

export const useFilters = (data: StockData[]) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [screener, setScreener] = useState<ScreenerState>(initialScreenerState);
  const [customPresets, setCustomPresets] = useState<SavedFilterPreset[]>(() =>
    loadCustomFilterPresets()
  );

  const availableColumns = useMemo(() => {
    if (data.length === 0) return [] as string[];
    return Object.keys(data[0]).filter((k) => !k.startsWith("_"));
  }, [data]);

  const screenableFields = useMemo(
    () => buildScreenableFields(availableColumns, data[0] as Record<string, unknown> | undefined),
    [availableColumns, data]
  );

  useEffect(() => {
    persistCustomFilterPresets(customPresets);
  }, [customPresets]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.toString() === "") return;
    setScreener((prev) => mergeUrlIntoScreener(prev, searchParams));
  }, [location.search]);

  const filteredData = useMemo(() => filterStocks(data, screener), [data, screener]);

  const sortConfig = screener.sort;

  const syncUrl = useCallback((next: ScreenerState) => {
    updateUrlWithScreener(next);
  }, []);

  const setScreenerAndSync = useCallback(
    (updater: ScreenerState | ((prev: ScreenerState) => ScreenerState)) => {
      setScreener((prev) => {
        const raw = typeof updater === "function" ? updater(prev) : updater;
        const next = normalizeScreener(raw);
        syncUrl(next);
        return next;
      });
    },
    [syncUrl]
  );

  const updateScreenerField = useCallback(
    <K extends ScreenerCategoricalKey>(key: K, value: ScreenerState[K]) => {
      setScreenerAndSync((prev) => ({ ...prev, [key]: value }));
    },
    [setScreenerAndSync]
  );

  /** Sidebar 互換: カテゴリ・テキスト検索 */
  const updateFilter = (
    key: ScreenerCategoricalKey | "companyName" | "stockCode",
    value: string | number | string[] | boolean | null
  ) => {
    if (key === "excludeMissing" && typeof value === "boolean") {
      updateScreenerField("excludeMissing", value);
      return;
    }
    if (key === "companyName" || key === "stockCode") {
      setScreenerAndSync((prev) => ({
        ...prev,
        [key]: typeof value === "string" ? value : "",
      }));
      return;
    }
    if (Array.isArray(value) || value === null) {
      setScreenerAndSync((prev) => ({
        ...prev,
        [key]: (value ?? []) as string[] & ("JP" | "US")[],
      }));
    }
  };

  const clearFilters = () => {
    const next = initialScreenerState();
    setScreener(next);
    navigate(location.pathname, { replace: true });
  };

  const addCondition = (partial?: Partial<Omit<ScreenerCondition, "id">>) => {
    const field = partial?.field;
    let condition: ScreenerCondition;
    if (field && isCategoricalField(field)) {
      const values =
        partial && "values" in partial && Array.isArray(partial.values) ? partial.values : [];
      condition = createCategoricalCondition(field, values);
    } else {
      const firstField = screenableFields[0]?.field ?? "ROE";
      condition = createNumericCondition(field ?? firstField, {
        operator:
          partial && "operator" in partial && partial.operator !== "in"
            ? partial.operator
            : "gte",
        value:
          partial && "value" in partial
            ? (partial.value as number | [number, number])
            : 0,
      });
    }
    setScreenerAndSync((prev) => ({
      ...prev,
      conditions: [...prev.conditions, condition],
    }));
    return condition.id;
  };

  const updateCondition = (id: string, patch: Partial<Omit<ScreenerCondition, "id">>) => {
    setScreenerAndSync((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => {
        if (c.id !== id) return c;
        if (patch.field !== undefined) {
          if (isCategoricalField(patch.field)) {
            const values =
              isCategoricalCondition(c) && c.field === patch.field ? c.values : [];
            return {
              id: c.id,
              kind: "categorical" as const,
              field: patch.field,
              operator: "in" as const,
              values,
            };
          }
          return {
            id: c.id,
            kind: "numeric" as const,
            field: patch.field,
            operator: "gte" as const,
            value: 0,
          };
        }
        if (isCategoricalCondition(c)) {
          if ("values" in patch && Array.isArray(patch.values)) {
            return { ...c, values: patch.values };
          }
          return c;
        }
        return { ...c, ...patch } as ScreenerCondition;
      }),
    }));
  };

  const removeCondition = (id: string) => {
    setScreenerAndSync((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }));
  };

  const clearConditions = () => {
    setScreenerAndSync((prev) => ({ ...prev, conditions: [] }));
  };

  const applyPresetConditions = (conditions: ScreenerCondition[]) => {
    setScreenerAndSync((prev) =>
      normalizeScreener({
        ...initialScreenerState(),
        companyName: prev.companyName,
        stockCode: prev.stockCode,
        marketType: prev.marketType,
        conditions: conditions.map((c) => ({ ...c, id: crypto.randomUUID() })),
      })
    );
  };

  /** @deprecated use applyPresetConditions */
  const applyPreset = (legacy: Parameters<typeof searchFiltersToScreenerState>[0]) => {
    const migrated = searchFiltersToScreenerState(legacy);
    applyPresetConditions(migrated.conditions);
  };

  const MAX_CUSTOM_PRESETS = 30;
  const MAX_CUSTOM_PRESET_LABEL = 40;

  const applyCustomFilterPreset = (preset: SavedFilterPreset) => {
    const conditions =
      preset.conditions ??
      (preset.filters ? searchFiltersToScreenerState(preset.filters).conditions : []);
    const base = preset.screener ?? {};
    setScreenerAndSync(
      normalizeScreener({
        ...initialScreenerState(),
        ...base,
        conditions: conditions.map((c) => ({ ...c, id: crypto.randomUUID() })),
        sort: null,
      })
    );
  };

  const saveCustomFilterPreset = (label: string): string | null => {
    const trimmed = label.trim();
    if (!trimmed) return "名前を入力してください";
    if (trimmed.length > MAX_CUSTOM_PRESET_LABEL) {
      return `名前は${MAX_CUSTOM_PRESET_LABEL}文字以内にしてください`;
    }
    if (customPresets.length >= MAX_CUSTOM_PRESETS) {
      return `マイプリセットは最大${MAX_CUSTOM_PRESETS}件までです`;
    }
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const { conditions } = screener;
    const screenerMeta = {
      companyName: screener.companyName,
      stockCode: screener.stockCode,
      marketType: screener.marketType,
      excludeMissing: screener.excludeMissing,
    };
    setCustomPresets((prev) => [
      ...prev,
      {
        id,
        label: trimmed,
        conditions: structuredClone(conditions),
        screener: structuredClone(screenerMeta),
      },
    ]);
    return null;
  };

  const removeCustomFilterPreset = (id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const shareFilters = () => generateShareUrl(screener);

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareFilters());
      return true;
    } catch (error) {
      console.error("Failed to copy URL:", error);
      return false;
    }
  };

  const handleSort = (key: keyof StockData) => {
    setScreenerAndSync((prev) => {
      const current = prev.sort;
      let nextSort: SortConfig | null;
      if (!current || current.key !== key) {
        nextSort = { key, direction: "asc" };
      } else if (current.direction === "asc") {
        nextSort = { key, direction: "desc" };
      } else {
        nextSort = null;
      }
      return { ...prev, sort: nextSort };
    });
  };

  const availableIndustries = useMemo(() => {
    return data
      .map((stock) => stock.業種)
      .filter(
        (industry): industry is string =>
          industry !== undefined && industry !== null && industry !== ""
      )
      .filter((industry, index, arr) => arr.indexOf(industry) === index)
      .sort();
  }, [data]);

  const availableMarkets = useMemo(() => {
    let subset = data;
    if (screener.marketType.length > 0) {
      subset = data.filter((stock) => {
        const stockMarketType =
          stock.市場タイプ || detectMarketTypeFromTicker(stock.銘柄コード || stock.コード || "");
        return screener.marketType.includes(stockMarketType as "JP" | "US");
      });
    }
    return subset
      .map((stock) => stock.優先市場)
      .filter((market): market is string => market !== undefined && market !== null && market !== "")
      .filter((market, index, arr) => arr.indexOf(market) === index)
      .sort();
  }, [data, screener.marketType]);

  const availablePrefectures = useMemo(() => {
    const jpStocks = data.filter((stock) => {
      const stockMarketType =
        stock.市場タイプ || detectMarketTypeFromTicker(stock.銘柄コード || stock.コード || "");
      return stockMarketType === "JP";
    });
    return jpStocks
      .map((stock) => stock.都道府県)
      .filter(
        (prefecture): prefecture is string =>
          prefecture !== undefined && prefecture !== null && prefecture !== ""
      )
      .filter((prefecture, index, arr) => arr.indexOf(prefecture) === index)
      .sort();
  }, [data]);

  return {
    screener,
    filters: screener,
    filteredData,
    sortConfig,
    screenableFields,
    availableIndustries,
    availableMarkets,
    availablePrefectures,
    updateFilter,
    updateScreenerField,
    clearFilters,
    applyPreset,
    applyPresetConditions,
    customPresets,
    saveCustomFilterPreset,
    removeCustomFilterPreset,
    applyCustomFilterPreset,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    handleSort,
    shareFilters,
    copyShareUrl,
  };
};
