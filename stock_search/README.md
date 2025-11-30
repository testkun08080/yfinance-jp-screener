# 🔍 Stock Search - React Web アプリケーション

日本株式データを検索・フィルタリングできるモダンな Web アプリケーション

## 概要

CSV ファイルから読み込んだ日本株データをリアルタイムで検索・フィルタリング・可視化する React アプリケーションです。

## 技術スタック

| カテゴリ             | 技術                                       |
| -------------------- | ------------------------------------------ |
| **Frontend**         | React 19 + TypeScript + Vite               |
| **Styling**          | Tailwind CSS + DaisyUI                     |
| **State Management** | React hooks (useState, useEffect, useMemo) |
| **Data Parsing**     | Papa Parse (CSV)                           |
| **Routing**          | React Router DOM v6                        |
| **Build Tool**       | Vite 6.x                                   |
| **Linting**          | ESLint + TypeScript ESLint                 |

---

## プロジェクト構造

```
stock_search/
├── public/
│   └── favicon.ico                  # ファビコン
├── src/
│   ├── components/                  # Reactコンポーネント
│   │   ├── Breadcrumb.tsx          # パンくずナビゲーション
│   │   ├── ColumnSelector.tsx      # カラム表示選択
│   │   ├── CSVViewer.tsx           # CSVデータビューア
│   │   ├── DataTable.tsx           # 動的データテーブル
│   │   ├── FileUpload.tsx          # ドラッグ&ドロップファイルアップロード
│   │   ├── Layout.tsx              # レイアウトコンポーネント
│   │   ├── Pagination.tsx          # ページネーション
│   │   └── SearchFilters.tsx       # 検索フィルター
│   ├── hooks/                       # カスタムフック
│   │   ├── useCSVParser.ts         # CSVパース処理
│   │   └── useFilters.ts           # フィルター状態管理
│   ├── pages/                       # ページコンポーネント
│   │   ├── AboutPage.tsx           # アプリについて
│   │   ├── DataPage.tsx            # データビューア（D&D専用）
│   │   └── HomePage.tsx            # ホームページ
│   ├── types/                       # TypeScript型定義
│   │   └── stock.ts                # 株式データ型
│   ├── utils/                       # ユーティリティ関数
│   │   ├── columnConfig.ts         # カラム設定
│   │   ├── csvDownload.ts          # CSVダウンロード
│   │   ├── csvParser.ts            # CSVパース処理
│   │   └── urlParams.ts            # URLパラメータ処理
│   ├── App.tsx                      # メインアプリ
│   ├── index.css                    # グローバルスタイル
│   └── main.tsx                     # エントリーポイント
├── dist/                            # ビルド出力（生成）
├── nginx.conf                       # nginx設定（Docker本番用）
├── package.json                     # Node.js依存関係
├── tsconfig.json                    # TypeScript設定
├── vite.config.ts                   # Vite設定
└── eslint.config.js                 # ESLint設定
```

---

## 主要機能

### 1. データ表示

#### 動的カラム検出

- CSV ファイルのヘッダーを自動検出
- 任意の CSV 構造に対応
- 日本語カラム名の完全サポート

#### 日本語データフォーマット

- 金額: `1,234,567,890 円`
- パーセント: `12.34%`
- 倍率: `1.23 倍`
- 自動単位認識

#### レスポンシブデザイン

- モバイル最適化（スティッキー列）
- タブレット対応
- デスクトップ向けワイドレイアウト

---

### 2. 検索・フィルタリング

#### テキスト検索

- 会社名での部分一致検索
- リアルタイムフィルタリング
- 大文字小文字区別なし

#### 高度フィルター

- 業種別フィルタリング
- 市場区分フィルタリング
- 財務指標範囲指定

#### ソート機能

- 各列での昇順/降順ソート
- 数値・文字列の適切な比較
- ソート状態の視覚的表示

---

### 3. データ操作

#### CSV 出力

- フィルタ結果の CSV ダウンロード
- 元のデータ構造を保持
- UTF-8 エンコーディング

#### ページネーション

- 50 件/100 件/200 件表示切替
- 合計件数表示
- ページ番号ナビゲーション

#### ファイルアップロード（D&D 専用）

- **ドラッグ&ドロップ**: CSV ファイルを簡単アップロード
- **クリック選択**: ファイル選択ダイアログも利用可能
- **完全クライアントサイド**: データはブラウザ内のみで処理
- **プライバシー保護**: サーバーに送信されない
- **任意の CSV 構造**: 自動カラム検出で任意の CSV に対応
- **エラーハンドリング**: 不正なファイル形式の検出

---

## セットアップ

### 必要要件

- Node.js 20.x 以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
cd stock_search

# 依存関係をインストール
npm install
```

---

## 開発ワークフロー

### 開発サーバー起動

```bash
# Vite開発サーバー起動（ホットリロード有効）
npm run dev

# アクセス: http://localhost:5173
```

**特徴**:

- ホットモジュールリプレースメント（HMR）
- 高速ビルド
- TypeScript エラー即時表示

---

### ビルド

```bash
# プロダクションビルド
npm run build

# 出力: dist/ ディレクトリ
```

**ビルドプロセス**:

1. **TypeScript コンパイル**: `tsc -b`
2. **Vite ビルド**: 最適化されたバンドル生成
3. **出力**: `dist/`ディレクトリに静的ファイル生成

**最適化**:

- ベンダーチャンク分離（効率的キャッシング）
- Tree shaking
- コード分割
- 圧縮・最小化

**Note**: CSV ファイルはアプリケーション内に含まれません。ユーザーがドラッグ&ドロップでアップロードします。

---

### プレビュー

```bash
# ビルド後のプレビュー
npm run preview

# アクセス: http://localhost:4173
```

本番環境と同等の動作確認が可能です。

---

### Linting

```bash
# ESLintチェック
npm run lint

# TypeScriptチェック
npm run type-check
```

---

## CSV ファイル処理フロー

### ユーザーアップロードフロー

```
ユーザー操作
    ↓
CSVファイルをドラッグ&ドロップ
または
クリックしてファイル選択
    ↓
FileUpload コンポーネント
    ↓
Papa Parse（ブラウザ内解析）
    ↓
DataTable コンポーネントで表示
```

---

## Docker デプロイ

### Dockerfile.app の構造

**マルチステージビルド**:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runner
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx 設定

`nginx.conf`の主要機能:

- **SPA 対応**: すべてのルートを`index.html`にフォールバック
- **Gzip 圧縮**: テキストファイルの圧縮配信
- **キャッシング**: 静的アセットのブラウザキャッシュ
- **セキュリティヘッダー**: XSS 保護、コンテンツタイプスニッフィング防止

### ローカル Docker 実行

```bash
# プロジェクトルートで実行
docker-compose up --build

# アクセス: http://localhost:8080
```

---

## トラブルシューティング

### ビルドエラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラー確認
npx tsc -b
```

---

## 開発フェーズ

### Phase 1: 基盤構築 ✅

- Vite + React + TypeScript セットアップ
- TailwindCSS + DaisyUI 統合
- 基本レイアウト

### Phase 2: データ層 ✅

- Papa Parse 統合
- CSV 読み込み・パース
- TypeScript 型定義

### Phase 3: 検索・表示 ✅

- 検索フィルター
- データテーブル
- ページネーション

### Phase 4: UI/UX 強化 ✅

- レスポンシブデザイン
- ソート機能
- CSV エクスポート

### Phase 5: 将来の拡張（検討中）

- データ分析機能
- チャート表示
- 銘柄詳細ページ
- お気に入り機能

---

## 注意事項

⚠️ **データの取り扱い**

- 本アプリは個人利用目的のみで使用してください
- Yahoo Finance データの二次配布は禁止されています
- データの正確性は保証されません

⚠️ **ブラウザ互換性**

- 最新版の Chrome、Firefox、Safari、Edge を推奨
- Internet Explorer 11 はサポート対象外

⚠️ **セキュリティ**

- 本番環境では必ず HTTPS を使用してください
- API キーなどの機密情報を含めないでください

---

## 参考資料

- [React 公式ドキュメント](https://react.dev/)
- [Vite 公式ドキュメント](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Papa Parse](https://www.papaparse.com/)

---

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

© 2025 testkun08080
