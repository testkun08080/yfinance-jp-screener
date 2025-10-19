import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { StockData, SearchFilters, SortConfig } from "../types/stock";
import {
  urlParamsToFilters,
  updateUrlWithFilters,
  generateShareUrl,
} from "../utils/urlParams";

const initialFilters: SearchFilters = {
  companyName: "",
  stockCode: "",
  industries: [],
  market: [],
  prefecture: [],
  marketCapMin: null,
  marketCapMax: null,
  pbrMin: null,
  pbrMax: null,
  roeMin: null,
  roeMax: null,
  revenueMin: null,
  revenueMax: null,
  operatingProfitMin: null,
  operatingProfitMax: null,
  operatingMarginMin: null,
  operatingMarginMax: null,
  netProfitMin: null,
  netProfitMax: null,
  netMarginMin: null,
  netMarginMax: null,
  equityRatioMin: null,
  equityRatioMax: null,
  forwardPEMin: null,
  forwardPEMax: null,
  totalLiabilitiesMin: null,
  totalLiabilitiesMax: null,
  currentLiabilitiesMin: null,
  currentLiabilitiesMax: null,
  currentAssetsMin: null,
  currentAssetsMax: null,
  totalDebtMin: null,
  totalDebtMax: null,
  cashMin: null,
  cashMax: null,
  investmentsMin: null,
  investmentsMax: null,
  netCashMin: null,
  netCashMax: null,
  netCashRatioMin: null,
  netCashRatioMax: null,
};

export const useFilters = (data: StockData[]) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // 初回ロード時にURLパラメータからフィルターを復元
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlFilters = urlParamsToFilters(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [location.search]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((stock) => {
      // 会社名フィルター
      if (
        filters.companyName &&
        !stock.会社名?.toLowerCase().includes(filters.companyName.toLowerCase())
      ) {
        return false;
      }

      // 銘柄コードフィルター
      if (filters.stockCode) {
        const stockCode = stock.銘柄コード || stock.コード || "";
        if (!stockCode.toString().includes(filters.stockCode)) {
          return false;
        }
      }

      // 業種フィルター（複数選択）
      if (
        filters.industries.length > 0 &&
        !filters.industries.includes(stock.業種 || "")
      ) {
        return false;
      }

      // 市場フィルター（複数選択）
      if (
        filters.market.length > 0 &&
        !filters.market.includes(stock.優先市場 || "")
      ) {
        return false;
      }

      // 都道府県フィルター（複数選択）
      if (
        filters.prefecture.length > 0 &&
        !filters.prefecture.includes(stock.都道府県 || "")
      ) {
        return false;
      }

      // PBRフィルター（データがnull/undefinedの場合は含める）
      if (
        filters.pbrMin !== null &&
        stock.PBR !== null &&
        stock.PBR !== undefined &&
        typeof stock.PBR === "number" &&
        stock.PBR < filters.pbrMin
      ) {
        return false;
      }
      if (
        filters.pbrMax !== null &&
        stock.PBR !== null &&
        stock.PBR !== undefined &&
        typeof stock.PBR === "number" &&
        stock.PBR > filters.pbrMax
      ) {
        return false;
      }

      // ROEフィルター（データがnull/undefinedの場合は含める）
      if (
        filters.roeMin !== null &&
        stock.ROE !== null &&
        stock.ROE !== undefined &&
        typeof stock.ROE === "number" &&
        stock.ROE < filters.roeMin / 100
      ) {
        return false;
      }
      if (
        filters.roeMax !== null &&
        stock.ROE !== null &&
        stock.ROE !== undefined &&
        typeof stock.ROE === "number" &&
        stock.ROE > filters.roeMax / 100
      ) {
        return false;
      }

      // 時価総額フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.marketCapMin !== null &&
        stock.時価総額 !== null &&
        stock.時価総額 !== undefined &&
        typeof stock.時価総額 === "number" &&
        stock.時価総額 < filters.marketCapMin * 1000000
      ) {
        return false;
      }
      if (
        filters.marketCapMax !== null &&
        stock.時価総額 !== null &&
        stock.時価総額 !== undefined &&
        typeof stock.時価総額 === "number" &&
        stock.時価総額 > filters.marketCapMax * 1000000
      ) {
        return false;
      }

      // 売上高フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.revenueMin !== null &&
        stock.売上高 !== null &&
        stock.売上高 !== undefined &&
        typeof stock.売上高 === "number" &&
        stock.売上高 < filters.revenueMin * 1000000
      ) {
        return false;
      }
      if (
        filters.revenueMax !== null &&
        stock.売上高 !== null &&
        stock.売上高 !== undefined &&
        typeof stock.売上高 === "number" &&
        stock.売上高 > filters.revenueMax * 1000000
      ) {
        return false;
      }

      // 営業利益フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.operatingProfitMin !== null &&
        stock.営業利益 !== null &&
        stock.営業利益 !== undefined &&
        typeof stock.営業利益 === "number" &&
        stock.営業利益 < filters.operatingProfitMin * 1000000
      ) {
        return false;
      }
      if (
        filters.operatingProfitMax !== null &&
        stock.営業利益 !== null &&
        stock.営業利益 !== undefined &&
        typeof stock.営業利益 === "number" &&
        stock.営業利益 > filters.operatingProfitMax * 1000000
      ) {
        return false;
      }

      // 営業利益率フィルター（%）（データがnull/undefinedの場合は含める）
      if (
        filters.operatingMarginMin !== null &&
        stock.営業利益率 !== null &&
        stock.営業利益率 !== undefined &&
        typeof stock.営業利益率 === "number" &&
        stock.営業利益率 < filters.operatingMarginMin / 100
      ) {
        return false;
      }
      if (
        filters.operatingMarginMax !== null &&
        stock.営業利益率 !== null &&
        stock.営業利益率 !== undefined &&
        typeof stock.営業利益率 === "number" &&
        stock.営業利益率 > filters.operatingMarginMax / 100
      ) {
        return false;
      }

      // 当期純利益フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.netProfitMin !== null &&
        stock.当期純利益 !== null &&
        stock.当期純利益 !== undefined &&
        typeof stock.当期純利益 === "number" &&
        stock.当期純利益 < filters.netProfitMin * 1000000
      ) {
        return false;
      }
      if (
        filters.netProfitMax !== null &&
        stock.当期純利益 !== null &&
        stock.当期純利益 !== undefined &&
        typeof stock.当期純利益 === "number" &&
        stock.当期純利益 > filters.netProfitMax * 1000000
      ) {
        return false;
      }

      // 純利益率フィルター（%）（データがnull/undefinedの場合は含める）
      if (
        filters.netMarginMin !== null &&
        stock.純利益率 !== null &&
        stock.純利益率 !== undefined &&
        typeof stock.純利益率 === "number" &&
        stock.純利益率 < filters.netMarginMin / 100
      ) {
        return false;
      }
      if (
        filters.netMarginMax !== null &&
        stock.純利益率 !== null &&
        stock.純利益率 !== undefined &&
        typeof stock.純利益率 === "number" &&
        stock.純利益率 > filters.netMarginMax / 100
      ) {
        return false;
      }

      // 自己資本比率フィルター（%）（データがnull/undefinedの場合は含める）
      if (
        filters.equityRatioMin !== null &&
        stock.自己資本比率 !== null &&
        stock.自己資本比率 !== undefined &&
        typeof stock.自己資本比率 === "number" &&
        stock.自己資本比率 < filters.equityRatioMin / 100
      ) {
        return false;
      }
      if (
        filters.equityRatioMax !== null &&
        stock.自己資本比率 !== null &&
        stock.自己資本比率 !== undefined &&
        typeof stock.自己資本比率 === "number" &&
        stock.自己資本比率 > filters.equityRatioMax / 100
      ) {
        return false;
      }

      // PER(会予)フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.forwardPEMin !== null &&
        stock["PER(会予)"] !== null &&
        stock["PER(会予)"] !== undefined &&
        typeof stock["PER(会予)"] === "number" &&
        stock["PER(会予)"] < filters.forwardPEMin
      ) {
        return false;
      }
      if (
        filters.forwardPEMax !== null &&
        stock["PER(会予)"] !== null &&
        stock["PER(会予)"] !== undefined &&
        typeof stock["PER(会予)"] === "number" &&
        stock["PER(会予)"] > filters.forwardPEMax
      ) {
        return false;
      }

      // 負債フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.totalLiabilitiesMin !== null &&
        stock.負債 !== null &&
        stock.負債 !== undefined &&
        typeof stock.負債 === "number" &&
        stock.負債 < filters.totalLiabilitiesMin * 1000000
      ) {
        return false;
      }
      if (
        filters.totalLiabilitiesMax !== null &&
        stock.負債 !== null &&
        stock.負債 !== undefined &&
        typeof stock.負債 === "number" &&
        stock.負債 > filters.totalLiabilitiesMax * 1000000
      ) {
        return false;
      }

      // 流動負債フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.currentLiabilitiesMin !== null &&
        stock.流動負債 !== null &&
        stock.流動負債 !== undefined &&
        typeof stock.流動負債 === "number" &&
        stock.流動負債 < filters.currentLiabilitiesMin * 1000000
      ) {
        return false;
      }
      if (
        filters.currentLiabilitiesMax !== null &&
        stock.流動負債 !== null &&
        stock.流動負債 !== undefined &&
        typeof stock.流動負債 === "number" &&
        stock.流動負債 > filters.currentLiabilitiesMax * 1000000
      ) {
        return false;
      }

      // 流動資産フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.currentAssetsMin !== null &&
        stock.流動資産 !== null &&
        stock.流動資産 !== undefined &&
        typeof stock.流動資産 === "number" &&
        stock.流動資産 < filters.currentAssetsMin * 1000000
      ) {
        return false;
      }
      if (
        filters.currentAssetsMax !== null &&
        stock.流動資産 !== null &&
        stock.流動資産 !== undefined &&
        typeof stock.流動資産 === "number" &&
        stock.流動資産 > filters.currentAssetsMax * 1000000
      ) {
        return false;
      }

      // 総負債フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.totalDebtMin !== null &&
        stock.総負債 !== null &&
        stock.総負債 !== undefined &&
        typeof stock.総負債 === "number" &&
        stock.総負債 < filters.totalDebtMin * 1000000
      ) {
        return false;
      }
      if (
        filters.totalDebtMax !== null &&
        stock.総負債 !== null &&
        stock.総負債 !== undefined &&
        typeof stock.総負債 === "number" &&
        stock.総負債 > filters.totalDebtMax * 1000000
      ) {
        return false;
      }

      // 現金及び現金同等物フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.cashMin !== null &&
        stock["現金及び現金同等物"] !== null &&
        stock["現金及び現金同等物"] !== undefined &&
        typeof stock["現金及び現金同等物"] === "number" &&
        stock["現金及び現金同等物"] < filters.cashMin * 1000000
      ) {
        return false;
      }
      if (
        filters.cashMax !== null &&
        stock["現金及び現金同等物"] !== null &&
        stock["現金及び現金同等物"] !== undefined &&
        typeof stock["現金及び現金同等物"] === "number" &&
        stock["現金及び現金同等物"] > filters.cashMax * 1000000
      ) {
        return false;
      }

      // 投資有価証券フィルター（データがnull/undefinedの場合は含める）
      if (
        filters.investmentsMin !== null &&
        stock.投資有価証券 !== null &&
        stock.投資有価証券 !== undefined &&
        typeof stock.投資有価証券 === "number" &&
        stock.投資有価証券 < filters.investmentsMin * 1000000
      ) {
        return false;
      }
      if (
        filters.investmentsMax !== null &&
        stock.投資有価証券 !== null &&
        stock.投資有価証券 !== undefined &&
        typeof stock.投資有価証券 === "number" &&
        stock.投資有価証券 > filters.investmentsMax * 1000000
      ) {
        return false;
      }

      // ネットキャッシュフィルター（データがnull/undefinedの場合は含める）
      if (
        filters.netCashMin !== null &&
        stock.ネットキャッシュ !== null &&
        stock.ネットキャッシュ !== undefined &&
        typeof stock.ネットキャッシュ === "number" &&
        stock.ネットキャッシュ < filters.netCashMin * 1000000
      ) {
        return false;
      }
      if (
        filters.netCashMax !== null &&
        stock.ネットキャッシュ !== null &&
        stock.ネットキャッシュ !== undefined &&
        typeof stock.ネットキャッシュ === "number" &&
        stock.ネットキャッシュ > filters.netCashMax * 1000000
      ) {
        return false;
      }

      // ネットキャッシュ比率フィルター（%）（データがnull/undefinedの場合は含める）
      if (
        filters.netCashRatioMin !== null &&
        stock.ネットキャッシュ比率 !== null &&
        stock.ネットキャッシュ比率 !== undefined &&
        typeof stock.ネットキャッシュ比率 === "number" &&
        stock.ネットキャッシュ比率 < filters.netCashRatioMin / 100
      ) {
        return false;
      }
      if (
        filters.netCashRatioMax !== null &&
        stock.ネットキャッシュ比率 !== null &&
        stock.ネットキャッシュ比率 !== undefined &&
        typeof stock.ネットキャッシュ比率 === "number" &&
        stock.ネットキャッシュ比率 > filters.netCashRatioMax / 100
      ) {
        return false;
      }

      return true;
    });

    // ソート処理
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // null値の処理
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        let result = 0;
        if (typeof aValue === "string" && typeof bValue === "string") {
          result = aValue.localeCompare(bValue, "ja-JP");
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          result = aValue - bValue;
        }

        return sortConfig.direction === "desc" ? -result : result;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  const updateFilter = (
    key: keyof SearchFilters,
    value: string | number | string[] | null,
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    updateUrlWithFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    // URLパラメータもクリア
    navigate(location.pathname, { replace: true });
  };

  const shareFilters = () => {
    const shareUrl = generateShareUrl(filters);
    return shareUrl;
  };

  const copyShareUrl = async () => {
    const shareUrl = shareFilters();
    try {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error("Failed to copy URL:", error);
      return false;
    }
  };

  const handleSort = (key: keyof StockData) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null; // ソート解除
    });
  };

  // ユニークな業種一覧を取得
  const availableIndustries = useMemo(() => {
    const industries = data
      .map((stock) => stock.業種)
      .filter(
        (industry): industry is string =>
          industry !== undefined && industry !== null && industry !== "",
      )
      .filter((industry, index, arr) => arr.indexOf(industry) === index)
      .sort();
    return industries;
  }, [data]);

  // ユニークな市場一覧を取得
  const availableMarkets = useMemo(() => {
    const markets = data
      .map((stock) => stock.優先市場)
      .filter(
        (market): market is string =>
          market !== undefined && market !== null && market !== "",
      )
      .filter((market, index, arr) => arr.indexOf(market) === index)
      .sort();
    return markets;
  }, [data]);

  // ユニークな都道府県一覧を取得
  const availablePrefectures = useMemo(() => {
    const prefectures = data
      .map((stock) => stock.都道府県)
      .filter(
        (prefecture): prefecture is string =>
          prefecture !== undefined && prefecture !== null && prefecture !== "",
      )
      .filter((prefecture, index, arr) => arr.indexOf(prefecture) === index)
      .sort();
    return prefectures;
  }, [data]);

  return {
    filters,
    filteredData,
    sortConfig,
    availableIndustries,
    availableMarkets,
    availablePrefectures,
    updateFilter,
    clearFilters,
    handleSort,
    shareFilters,
    copyShareUrl,
  };
};
