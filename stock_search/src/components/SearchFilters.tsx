import React, { useState, useCallback } from "react";
import type { SearchFilters as SearchFiltersType } from "../types/stock";

// NumberRangeInputコンポーネントを独立して定義
interface NumberRangeInputProps {
  label: string;
  unit?: string;
  minKey: keyof SearchFiltersType;
  maxKey: keyof SearchFiltersType;
  step?: number;
  isInteger?: boolean;
  filters: SearchFiltersType;
  onFilterChange: (
    key: keyof SearchFiltersType,
    value: string | number | string[] | null
  ) => void;
}

const NumberRangeInput: React.FC<NumberRangeInputProps> = React.memo(
  ({
    label,
    unit = "",
    minKey,
    maxKey,
    step = 1,
    isInteger = false,
    filters,
    onFilterChange,
  }) => {
    const handleMinChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(
          minKey,
          e.target.value
            ? isInteger
              ? parseInt(e.target.value)
              : parseFloat(e.target.value)
            : null
        );
      },
      [minKey, isInteger, onFilterChange]
    );

    const handleMaxChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange(
          maxKey,
          e.target.value
            ? isInteger
              ? parseInt(e.target.value)
              : parseFloat(e.target.value)
            : null
        );
      },
      [maxKey, isInteger, onFilterChange]
    );

    return (
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">
            {label} {unit && `(${unit})`}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="input input-bordered input-sm flex-1"
            placeholder="最小"
            step={step}
            value={filters[minKey] || ""}
            onChange={handleMinChange}
          />
          <span className="text-xs opacity-60">〜</span>
          <input
            type="number"
            className="input input-bordered input-sm flex-1"
            placeholder="最大"
            step={step}
            value={filters[maxKey] || ""}
            onChange={handleMaxChange}
          />
        </div>
      </div>
    );
  }
);

NumberRangeInput.displayName = "NumberRangeInput";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  availableIndustries: string[];
  availableMarkets: string[];
  availablePrefectures: string[];
  onFilterChange: (
    key: keyof SearchFiltersType,
    value: string | number | string[] | null
  ) => void;
  onClearFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  availableIndustries,
  availableMarkets,
  availablePrefectures,
  onFilterChange,
  onClearFilters,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    valuation: false,
    performance: false,
    balance: false,
    cash: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const currentIndustries = filters.industries || [];
    if (checked) {
      onFilterChange("industries", [...currentIndustries, industry]);
    } else {
      onFilterChange(
        "industries",
        currentIndustries.filter((i) => i !== industry)
      );
    }
  };

  const handleMarketChange = (market: string, checked: boolean) => {
    const currentMarkets = filters.market || [];
    if (checked) {
      onFilterChange("market", [...currentMarkets, market]);
    } else {
      onFilterChange(
        "market",
        currentMarkets.filter((m) => m !== market)
      );
    }
  };

  const handlePrefectureChange = (prefecture: string, checked: boolean) => {
    const currentPrefectures = filters.prefecture || [];
    if (checked) {
      onFilterChange("prefecture", [...currentPrefectures, prefecture]);
    } else {
      onFilterChange(
        "prefecture",
        currentPrefectures.filter((p) => p !== prefecture)
      );
    }
  };

  // 全選択・全クリア機能
  const handleSelectAllIndustries = () => {
    onFilterChange("industries", availableIndustries);
  };

  const handleClearAllIndustries = () => {
    onFilterChange("industries", []);
  };

  const handleSelectAllMarkets = () => {
    onFilterChange("market", availableMarkets);
  };

  const handleClearAllMarkets = () => {
    onFilterChange("market", []);
  };

  const handleSelectAllPrefectures = () => {
    onFilterChange("prefecture", availablePrefectures);
  };

  const handleClearAllPrefectures = () => {
    onFilterChange("prefecture", []);
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-base-content">
          🔍 検索フィルター
        </h3>
        <button onClick={onClearFilters} className="btn btn-outline btn-sm">
          🗑️ すべてクリア
        </button>
      </div>

      {/* 基本フィルター */}
      <div className="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={expandedSections.basic}
          onChange={() => toggleSection("basic")}
        />
        <div className="collapse-title text-lg font-medium">
          📋 基本フィルター
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 会社名検索 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">会社名で検索</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="例: トヨタ、ソフトバンク"
                value={filters.companyName}
                onChange={(e) => onFilterChange("companyName", e.target.value)}
              />
            </div>

            {/* 銘柄コード検索 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">銘柄コードで検索</span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="例: 7203、9984"
                value={filters.stockCode || ""}
                onChange={(e) => onFilterChange("stockCode", e.target.value)}
              />
            </div>

            {/* 時価総額検索 */}
            <NumberRangeInput
              label="時価総額で検索"
              unit="百万円"
              minKey="marketCapMin"
              maxKey="marketCapMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>

          {/* 業種選択（複数選択） */}
          <div className="form-control mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="label-text">業種選択（複数選択可）</span>
                <span className="label-text-alt">
                  {filters.industries.length > 0
                    ? `${filters.industries.length}件選択中`
                    : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleSelectAllIndustries}
                  disabled={
                    filters.industries.length === availableIndustries.length
                  }
                >
                  ✅ 全選択
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleClearAllIndustries}
                  disabled={filters.industries.length === 0}
                >
                  ❌ 全クリア
                </button>
              </div>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableIndustries.map((industry) => (
                  <label
                    key={industry}
                    className="label cursor-pointer justify-start"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.industries.includes(industry)}
                      onChange={(e) =>
                        handleIndustryChange(industry, e.target.checked)
                      }
                    />
                    <span className="label-text text-sm">{industry}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 優先市場選択（複数選択） */}
          <div className="form-control mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="label-text">優先市場選択（複数選択可）</span>
                <span className="label-text-alt">
                  {filters.market.length > 0
                    ? `${filters.market.length}件選択中`
                    : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleSelectAllMarkets}
                  disabled={filters.market.length === availableMarkets.length}
                >
                  ✅ 全選択
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleClearAllMarkets}
                  disabled={filters.market.length === 0}
                >
                  ❌ 全クリア
                </button>
              </div>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableMarkets.map((market) => (
                  <label
                    key={market}
                    className="label cursor-pointer justify-start"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.market.includes(market)}
                      onChange={(e) =>
                        handleMarketChange(market, e.target.checked)
                      }
                    />
                    <span className="label-text text-sm">
                      {market.replace("（内国株式）", "")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 都道府県選択（複数選択） */}
          <div className="form-control mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="label-text">都道府県選択（複数選択可）</span>
                <span className="label-text-alt">
                  {filters.prefecture.length > 0
                    ? `${filters.prefecture.length}件選択中`
                    : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleSelectAllPrefectures}
                  disabled={
                    filters.prefecture.length === availablePrefectures.length
                  }
                >
                  ✅ 全選択
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={handleClearAllPrefectures}
                  disabled={filters.prefecture.length === 0}
                >
                  ❌ 全クリア
                </button>
              </div>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availablePrefectures.map((prefecture) => (
                  <label
                    key={prefecture}
                    className="label cursor-pointer justify-start"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mr-2"
                      checked={filters.prefecture.includes(prefecture)}
                      onChange={(e) =>
                        handlePrefectureChange(prefecture, e.target.checked)
                      }
                    />
                    <span className="label-text text-sm">{prefecture}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* バリュエーション指標 */}
      <div className="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={expandedSections.valuation}
          onChange={() => toggleSection("valuation")}
        />
        <div className="collapse-title text-lg font-medium">
          📊 バリュエーション指標
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberRangeInput
              label="PBR"
              minKey="pbrMin"
              maxKey="pbrMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="ROE"
              unit="%"
              minKey="roeMin"
              maxKey="roeMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="自己資本比率"
              unit="%"
              minKey="equityRatioMin"
              maxKey="equityRatioMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="PER(会予)"
              minKey="forwardPEMin"
              maxKey="forwardPEMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            {/* PER（trailingPE）は情報的に不確かなためコメントアウト */}
            {/* <NumberRangeInput
              label="PER"
              minKey="trailingPEMin"
              maxKey="trailingPEMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            /> */}
            <NumberRangeInput
              label="PER(過去12ヶ月)"
              minKey="trailingPEMin"
              maxKey="trailingPEMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="配当性向"
              unit="%"
              minKey="dividendDirectionMin"
              maxKey="dividendDirectionMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="配当利回り"
              unit="%"
              minKey="dividendYieldMin"
              maxKey="dividendYieldMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="EPS(過去12ヶ月)"
              minKey="trailingEpsMin"
              maxKey="trailingEpsMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="EPS(予想)"
              minKey="forwardEpsMin"
              maxKey="forwardEpsMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      </div>

      {/* 業績・収益性 */}
      <div className="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={expandedSections.performance}
          onChange={() => toggleSection("performance")}
        />
        <div className="collapse-title text-lg font-medium">
          💹 業績・収益性指標
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberRangeInput
              label="売上高"
              unit="百万円"
              minKey="revenueMin"
              maxKey="revenueMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="営業利益"
              unit="百万円"
              minKey="operatingProfitMin"
              maxKey="operatingProfitMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="営業利益率"
              unit="%"
              minKey="operatingMarginMin"
              maxKey="operatingMarginMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="当期純利益"
              unit="百万円"
              minKey="netProfitMin"
              maxKey="netProfitMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="純利益率"
              unit="%"
              minKey="netMarginMin"
              maxKey="netMarginMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      </div>

      {/* バランスシート */}
      <div className="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={expandedSections.balance}
          onChange={() => toggleSection("balance")}
        />
        <div className="collapse-title text-lg font-medium">
          🏛️ バランスシート指標
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberRangeInput
              label="負債"
              unit="百万円"
              minKey="totalLiabilitiesMin"
              maxKey="totalLiabilitiesMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="流動負債"
              unit="百万円"
              minKey="currentLiabilitiesMin"
              maxKey="currentLiabilitiesMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="流動資産"
              unit="百万円"
              minKey="currentAssetsMin"
              maxKey="currentAssetsMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="総負債"
              unit="百万円"
              minKey="totalDebtMin"
              maxKey="totalDebtMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="投資有価証券"
              unit="百万円"
              minKey="investmentsMin"
              maxKey="investmentsMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      </div>

      {/* キャッシュ関連 */}
      <div className="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={expandedSections.cash}
          onChange={() => toggleSection("cash")}
        />
        <div className="collapse-title text-lg font-medium">
          💰 キャッシュ関連指標
        </div>
        <div className="collapse-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberRangeInput
              label="現金及び現金同等物"
              unit="百万円"
              minKey="cashMin"
              maxKey="cashMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="ネットキャッシュ"
              unit="百万円"
              minKey="netCashMin"
              maxKey="netCashMax"
              isInteger={true}
              filters={filters}
              onFilterChange={onFilterChange}
            />
            <NumberRangeInput
              label="ネットキャッシュ比率"
              unit="%"
              minKey="netCashRatioMin"
              maxKey="netCashRatioMax"
              step={0.1}
              filters={filters}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
