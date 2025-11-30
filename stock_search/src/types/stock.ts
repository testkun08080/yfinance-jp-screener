export interface StockData {
  会社名?: string;
  銘柄コード?: string;
  コード?: string;
  業種?: string;
  優先市場?: string;
  決算月?: string | null;
  // 会計基準?: string | null;
  都道府県?: string | null;
  時価総額?: number | null;
  PBR?: number | null;
  売上高?: number | null;
  営業利益?: number | null;
  営業利益率?: number | null;
  当期純利益?: number | null;
  純利益率?: number | null;
  ROE?: number | null;
  自己資本比率?: number | null;
  "PER(会予)"?: number | null;
  // PER?: number | null;  // 情報的に不確かなためコメントアウト
  PER(過去12ヶ月)?: number | null; // trailingPE（過去12ヶ月分）
  配当方向性?: number | null; // payoutRatio（生データ、小数、例: 0.3 = 30%）
  配当利回り?: number | null; // trailingAnnualDividendYield（生データ、小数、例: 0.03 = 3%）
  "EPS(過去12ヶ月)"?: number | null; // trailingEps（生データ）
  "EPS(予想)"?: number | null; // forwardEps（生データ）
  負債?: number | null;
  流動負債?: number | null;
  流動資産?: number | null;
  総負債?: number | null;
  現金及び現金同等物?: number | null;
  投資有価証券?: number | null;
  "ネットキャッシュ（流動資産-負債）"?: number | null;
  ネットキャッシュ比率?: number | null;
  _source_file?: string;
  _row_index?: number;
  [key: string]: string | number | null | undefined; // Allow additional dynamic properties
}

export interface SearchFilters {
  companyName: string;
  stockCode?: string; // 銘柄コード検索
  industries: string[]; // 複数業種選択
  market: string[]; // 複数市場選択
  prefecture: string[]; // 複数都道府県選択

  // 既存のフィルター
  marketCapMin: number | null;
  marketCapMax: number | null;
  pbrMin: number | null;
  pbrMax: number | null;
  roeMin: number | null;
  roeMax: number | null;

  // 新しい財務データフィルター
  revenueMin: number | null; // 売上高
  revenueMax: number | null;
  operatingProfitMin: number | null; // 営業利益
  operatingProfitMax: number | null;
  operatingMarginMin: number | null; // 営業利益率
  operatingMarginMax: number | null;
  netProfitMin: number | null; // 当期純利益
  netProfitMax: number | null;
  netMarginMin: number | null; // 純利益率
  netMarginMax: number | null;
  equityRatioMin: number | null; // 自己資本比率
  equityRatioMax: number | null;
  forwardPEMin: number | null; // PER(会予)
  forwardPEMax: number | null;
  trailingPEMin: number | null; // PER(過去12ヶ月)（trailingPE、過去12ヶ月分）
  trailingPEMax: number | null;
  dividendDirectionMin: number | null; // 配当方向性（%）
  dividendDirectionMax: number | null;
  dividendYieldMin: number | null; // 配当利回り
  dividendYieldMax: number | null;
  trailingEpsMin: number | null; // EPS(過去12ヶ月)
  trailingEpsMax: number | null;
  forwardEpsMin: number | null; // EPS(予想)
  forwardEpsMax: number | null;
  totalLiabilitiesMin: number | null; // 負債
  totalLiabilitiesMax: number | null;
  currentLiabilitiesMin: number | null; // 流動負債
  currentLiabilitiesMax: number | null;
  currentAssetsMin: number | null; // 流動資産
  currentAssetsMax: number | null;
  totalDebtMin: number | null; // 総負債
  totalDebtMax: number | null;
  cashMin: number | null; // 現金及び現金同等物
  cashMax: number | null;
  investmentsMin: number | null; // 投資有価証券
  investmentsMax: number | null;
  netCashMin: number | null; // ネットキャッシュ
  netCashMax: number | null;
  netCashRatioMin: number | null; // ネットキャッシュ比率
  netCashRatioMax: number | null;
}

export interface SortConfig {
  key: keyof StockData;
  direction: "asc" | "desc";
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export const MARKET_OPTIONS = [
  "プライム（内国株式）",
  "スタンダード（内国株式）",
  "グロース（内国株式）",
] as const;

export const ITEMS_PER_PAGE_OPTIONS = [50, 100, 200] as const;
