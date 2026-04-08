import type { StockData } from "../types/stock";
import { AI_MAX_STOCKS_IN_CONTEXT } from "../constants/ai";

function fmt(value: number | null | undefined, decimals = 2): string {
  if (value == null) return "-";
  return value.toFixed(decimals);
}

function fmtPct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function fmtBillion(value: number | null | undefined): string {
  if (value == null) return "-";
  const oku = value / 1e8;
  return `${oku.toFixed(0)}億`;
}

export function buildStockContext(
  stocks: StockData[],
  maxCount = AI_MAX_STOCKS_IN_CONTEXT
): string {
  const subset = stocks.slice(0, maxCount);

  const lines = subset.map((s) => {
    const code = s.銘柄コード ?? s.コード ?? "-";
    const name = s.会社名 ?? "-";
    const industry = s.業種 ?? "-";
    const market = s.優先市場 ?? "-";
    const cap = fmtBillion(s.時価総額);
    const pbr = fmt(s.PBR);
    const roe = fmtPct(s.ROE);
    const per = fmt(s["PER(会予)"]);
    const opMargin = fmtPct(s.営業利益率);
    const equityRatio = fmtPct(s.自己資本比率);
    const netCashRatio = fmtPct(s.ネットキャッシュ比率);

    return [
      `${code} ${name}`,
      `業種:${industry}`,
      `市場:${market}`,
      `時価総額:${cap}`,
      `PBR:${pbr}`,
      `ROE:${roe}`,
      `PER:${per}`,
      `営業利益率:${opMargin}`,
      `自己資本比率:${equityRatio}`,
      `ネットキャッシュ比率:${netCashRatio}`,
    ].join(" | ");
  });

  const totalMsg =
    stocks.length > maxCount
      ? `（全${stocks.length}件中 先頭${subset.length}件を表示）`
      : `（全${stocks.length}件）`;

  return `現在のスクリーニング結果 ${totalMsg}:\n${lines.join("\n")}`;
}
