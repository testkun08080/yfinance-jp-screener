/**
 * 数値フォーマット関連定数
 *
 * 日付フォーマット、通貨フォーマット、パーセンテージフォーマット、ファイルサイズ変換など
 */

/** 日付フォーマット設定 */
export const DATE_FORMAT = {
  /** ゼロパディングの桁数（例: "01", "02"） */
  zeroPadLength: 2,
  /** ゼロパディング文字 */
  zeroPadChar: "0",
} as const;

/** 通貨フォーマット設定 */
export const CURRENCY_FORMAT = {
  /** 百万円単位への除数（1,000,000で割ると百万円単位） */
  millionDivisor: 1000000,
  /** ロケール設定（日本） */
  locale: "ja-JP",
  /** 通貨表示時の小数点桁数（デフォルト） */
  decimals: 0,
} as const;

/** パーセンテージフォーマット設定 */
export const PERCENTAGE_FORMAT = {
  /** パーセンテージへの乗数（0.1 → 10%） */
  multiplier: 100,
  /** パーセンテージ表示時の小数点桁数 */
  decimals: 2,
} as const;

/** ファイルサイズ変換定数 */
export const FILE_SIZE = {
  /** 1キロバイト（バイト単位） */
  kilobyte: 1024,
  /** 1メガバイト（バイト単位） */
  megabyte: 1024 * 1024,
} as const;
