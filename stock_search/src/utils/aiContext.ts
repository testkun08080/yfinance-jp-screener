import type { StockData } from "../types/stock";
import { AI_STOCK_CONTEXT_HARD_CAP } from "../constants/ai";

/**
 * 絞り込み結果をモデル向けテキストにする。
 * 全カラムを TSV（1行目ヘッダ・1銘柄1行）で渡し、件数は AI_STOCK_CONTEXT_HARD_CAP まで。
 */
export function buildStockContext(stocks: StockData[]): string {
  if (stocks.length === 0) {
    return "現在のスクリーニング結果は 0 件です。";
  }

  const cap = Math.min(stocks.length, AI_STOCK_CONTEXT_HARD_CAP);
  const rows = stocks.slice(0, cap);
  const keys = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));

  const escapeCell = (v: unknown): string => {
    if (v == null) return "";
    return String(v).replace(/\t/g, " ").replace(/\r?\n/g, " ");
  };

  const header = keys.join("\t");
  const body = rows
    .map((row) =>
      keys.map((k) => escapeCell(row[k as keyof StockData])).join("\t")
    )
    .join("\n");

  const note =
    stocks.length > cap
      ? `（全${stocks.length.toLocaleString()}件中、先頭${cap.toLocaleString()}件。モデルのコンテキスト上限に合わせた省略）`
      : `（全${stocks.length.toLocaleString()}件）`;

  return `現在のスクリーニング結果（タブ区切りTSV）。1行目が列名、2行目以降が1銘柄1行。${note}\n${header}\n${body}`;
}
