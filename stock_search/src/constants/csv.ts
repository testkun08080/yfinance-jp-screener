/**
 * CSV処理関連定数
 *
 * CSVパース設定、数値フィールドリスト、ファイル検証設定など
 */

/** CSVパーサー基本設定 */
export const CSV_PARSER_CONFIG = {
  /** 文字エンコーディング */
  encoding: "UTF-8",
  /** 空行をスキップ */
  skipEmptyLines: true,
  /** ヘッダー行あり */
  header: true,
} as const;

/**
 * CSV内の数値フィールドリスト
 *
 * これらのフィールドは文字列から数値に変換される
 * （単位表記: 倍、%、円などは除去される）
 */
export const CSV_NUMERIC_FIELDS = [
  "時価総額",
  "PBR",
  "売上高",
  "営業利益",
  "営業利益率",
  "当期純利益",
  "純利益率",
  "ROE",
  "自己資本比率",
  "PER(会予)",
  // "PER",  // 情報的に不確かなためコメントアウト
  "PER(過去12ヶ月)",
  "配当方向性",
  "配当利回り",
  "EPS(過去12ヶ月)",
  "EPS(予想)",
  "負債",
  "流動負債",
  "流動資産",
  "総負債",
  "現金及び現金同等物",
  "投資有価証券",
  "ネットキャッシュ（流動資産-負債）",
  "ネットキャッシュ比率",
] as const;

/** CSVファイル検証設定 */
export const CSV_FILE_CONFIG = {
  /** CSVファイルのMIMEタイプ */
  mimeType: "text/csv",
  /** CSVファイル拡張子 */
  extension: ".csv",
  /** <input accept属性用の値 */
  acceptAttribute: ".csv",
} as const;
