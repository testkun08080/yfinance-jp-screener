import type { SearchFilters } from "../types/stock";

// フィルターをURLパラメータに変換
export const filtersToUrlParams = (filters: SearchFilters): URLSearchParams => {
  const params = new URLSearchParams();

  // 文字列フィルター
  if (filters.companyName) params.set("company", filters.companyName);

  // 複数選択フィルター
  if (filters.market.length > 0) {
    params.set("market", filters.market.join(","));
  }
  if (filters.prefecture.length > 0) {
    params.set("prefecture", filters.prefecture.join(","));
  }
  if (filters.industries.length > 0) {
    params.set("industries", filters.industries.join(","));
  }

  // 数値フィルター
  const numericFilters: Array<{ key: keyof SearchFilters; param: string }> = [
    { key: "marketCapMin", param: "mcMin" },
    { key: "marketCapMax", param: "mcMax" },
    { key: "pbrMin", param: "pbrMin" },
    { key: "pbrMax", param: "pbrMax" },
    { key: "roeMin", param: "roeMin" },
    { key: "roeMax", param: "roeMax" },
    { key: "revenueMin", param: "revMin" },
    { key: "revenueMax", param: "revMax" },
    { key: "operatingProfitMin", param: "opMin" },
    { key: "operatingProfitMax", param: "opMax" },
    { key: "operatingMarginMin", param: "omMin" },
    { key: "operatingMarginMax", param: "omMax" },
    { key: "netProfitMin", param: "npMin" },
    { key: "netProfitMax", param: "npMax" },
    { key: "netMarginMin", param: "nmMin" },
    { key: "netMarginMax", param: "nmMax" },
    { key: "equityRatioMin", param: "eqMin" },
    { key: "equityRatioMax", param: "eqMax" },
    { key: "forwardPEMin", param: "peMin" },
    { key: "forwardPEMax", param: "peMax" },
    { key: "trailingPEMin", param: "tpeMin" }, // PER直近(過去12ヶ月分)
    { key: "trailingPEMax", param: "tpeMax" },
    { key: "dividendDirectionMin", param: "ddMin" },
    { key: "dividendDirectionMax", param: "ddMax" },
    { key: "dividendYieldMin", param: "dyMin" },
    { key: "dividendYieldMax", param: "dyMax" },
    { key: "trailingEpsMin", param: "tepsMin" },
    { key: "trailingEpsMax", param: "tepsMax" },
    { key: "forwardEpsMin", param: "fepsMin" },
    { key: "forwardEpsMax", param: "fepsMax" },
    { key: "totalLiabilitiesMin", param: "tlMin" },
    { key: "totalLiabilitiesMax", param: "tlMax" },
    { key: "currentLiabilitiesMin", param: "clMin" },
    { key: "currentLiabilitiesMax", param: "clMax" },
    { key: "currentAssetsMin", param: "caMin" },
    { key: "currentAssetsMax", param: "caMax" },
    { key: "totalDebtMin", param: "tdMin" },
    { key: "totalDebtMax", param: "tdMax" },
    { key: "cashMin", param: "cashMin" },
    { key: "cashMax", param: "cashMax" },
    { key: "investmentsMin", param: "invMin" },
    { key: "investmentsMax", param: "invMax" },
    { key: "netCashMin", param: "ncMin" },
    { key: "netCashMax", param: "ncMax" },
    { key: "netCashRatioMin", param: "ncrMin" },
    { key: "netCashRatioMax", param: "ncrMax" },
  ];

  numericFilters.forEach(({ key, param }) => {
    const value = filters[key];
    if (value !== null && value !== undefined) {
      params.set(param, value.toString());
    }
  });

  return params;
};

// URLパラメータをフィルターに変換
export const urlParamsToFilters = (
  searchParams: URLSearchParams
): Partial<SearchFilters> => {
  const filters: Partial<SearchFilters> = {};

  // 文字列フィルター
  const company = searchParams.get("company");
  if (company) filters.companyName = company;

  // 複数選択フィルター
  const market = searchParams.get("market");
  if (market) {
    filters.market = market.split(",").filter(Boolean);
  }

  const prefecture = searchParams.get("prefecture");
  if (prefecture) {
    filters.prefecture = prefecture.split(",").filter(Boolean);
  }

  const industries = searchParams.get("industries");
  if (industries) {
    filters.industries = industries.split(",").filter(Boolean);
  }

  // 数値フィルター
  const numericMappings: Array<{ param: string; key: keyof SearchFilters }> = [
    { param: "mcMin", key: "marketCapMin" },
    { param: "mcMax", key: "marketCapMax" },
    { param: "pbrMin", key: "pbrMin" },
    { param: "pbrMax", key: "pbrMax" },
    { param: "roeMin", key: "roeMin" },
    { param: "roeMax", key: "roeMax" },
    { param: "revMin", key: "revenueMin" },
    { param: "revMax", key: "revenueMax" },
    { param: "opMin", key: "operatingProfitMin" },
    { param: "opMax", key: "operatingProfitMax" },
    { param: "omMin", key: "operatingMarginMin" },
    { param: "omMax", key: "operatingMarginMax" },
    { param: "npMin", key: "netProfitMin" },
    { param: "npMax", key: "netProfitMax" },
    { param: "nmMin", key: "netMarginMin" },
    { param: "nmMax", key: "netMarginMax" },
    { param: "eqMin", key: "equityRatioMin" },
    { param: "eqMax", key: "equityRatioMax" },
    { param: "peMin", key: "forwardPEMin" },
    { param: "peMax", key: "forwardPEMax" },
    { param: "tpeMin", key: "trailingPEMin" }, // PER直近(過去12ヶ月分)
    { param: "tpeMax", key: "trailingPEMax" },
    { param: "ddMin", key: "dividendDirectionMin" },
    { param: "ddMax", key: "dividendDirectionMax" },
    { param: "dyMin", key: "dividendYieldMin" },
    { param: "dyMax", key: "dividendYieldMax" },
    { param: "tepsMin", key: "trailingEpsMin" },
    { param: "tepsMax", key: "trailingEpsMax" },
    { param: "fepsMin", key: "forwardEpsMin" },
    { param: "fepsMax", key: "forwardEpsMax" },
    { param: "tlMin", key: "totalLiabilitiesMin" },
    { param: "tlMax", key: "totalLiabilitiesMax" },
    { param: "clMin", key: "currentLiabilitiesMin" },
    { param: "clMax", key: "currentLiabilitiesMax" },
    { param: "caMin", key: "currentAssetsMin" },
    { param: "caMax", key: "currentAssetsMax" },
    { param: "tdMin", key: "totalDebtMin" },
    { param: "tdMax", key: "totalDebtMax" },
    { param: "cashMin", key: "cashMin" },
    { param: "cashMax", key: "cashMax" },
    { param: "invMin", key: "investmentsMin" },
    { param: "invMax", key: "investmentsMax" },
    { param: "ncMin", key: "netCashMin" },
    { param: "ncMax", key: "netCashMax" },
    { param: "ncrMin", key: "netCashRatioMin" },
    { param: "ncrMax", key: "netCashRatioMax" },
  ];

  numericMappings.forEach(({ param, key }) => {
    const value = searchParams.get(param);
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        (filters as Record<string, string | number>)[key] = numValue;
      }
    }
  });

  return filters;
};

// 現在のフィルターでURLを更新
export const updateUrlWithFilters = (filters: SearchFilters) => {
  const params = filtersToUrlParams(filters);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
};

// 共有用URLを生成
export const generateShareUrl = (filters: SearchFilters): string => {
  const params = filtersToUrlParams(filters);
  return `${window.location.origin}${
    window.location.pathname
  }?${params.toString()}`;
};
