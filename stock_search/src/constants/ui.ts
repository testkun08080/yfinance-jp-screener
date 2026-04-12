/**
 * UI関連定数
 *
 * ページネーション、ナビゲーション、ブレッドクラムなどのUI設定値
 */

/** ページネーション設定 */
export const PAGINATION = {
  /** 最大表示ページ数（ページネーションコンポーネントに表示される最大ページ番号数） */
  maxVisiblePages: 5,
  /** ページサイズ選択肢 */
  itemsPerPageOptions: [50, 100, 200] as const,
  /** デフォルトのページサイズ */
  defaultItemsPerPage: 50,
} as const;

/** ナビゲーションメニュー項目 */
export const NAVIGATION_ITEMS = [
  { path: "/", label: "データビューア", icon: "📊" },
  { path: "/usage", label: "使い方", icon: "📚" },
  { path: "/about", label: "このアプリについて", icon: "📖" },
] as const;

/** ブレッドクラム項目 */
export const BREADCRUMB_ITEMS = {
  home: { label: "ホーム", href: "/", icon: "🏠" },
  usage: { label: "使い方", icon: "📚" },
  about: { label: "このアプリについて", icon: "ℹ️" },
} as const;
