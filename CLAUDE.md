# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**個人向け日本株式分析プラットフォーム** - yfinance API を活用した 3795+銘柄の小型株分析ツール

このリポジトリは個人開発・個人環境での使用を想定した、シンプルで効率的な株式分析システムです。

### システム構成

**1. データ収集パイプライン** (Python 3.11)

- JPX 公式データから最新株式リスト自動取得
- yfinance API による財務データ収集
- 4 段階 Sequential 実行で API 制限・タイムアウト回避
- 自動 CSV 結合機能

**2. Web アプリケーション** (React 19 + TypeScript + Vite)

- シンプルなローカルアプリケーション（SEO・PWA 削除済み）
- 動的カラム検出・日本語金融データ対応
- リアルタイム検索・フィルタリング
- レスポンシブデザイン（Tailwind CSS + DaisyUI）

**3. Docker 環境** (nginx + Python)

- 本番同等の実行環境
- マルチステージビルド最適化
- ボリューム共有によるデータ連携
- nginx による高速静的ファイル配信

**4. GitHub Actions CI** (7 ワークフロー)

- Sequential Stock Fetch (Part 1-4): 各 120 分実行
- CSV Combine & Export
- Stock List Update
- Stock Data Fetch (単体テスト用)

### 重要な設計方針

✅ **個人環境特化**

- SEO 最適化不要（削除済み）
- PWA 機能不要（削除済み）
- GitHub Pages 不要（削除済み）
- シンプルなローカル/Docker 実行

✅ **自動化重視**

- データ収集の完全自動化
- エラーハンドリング・リトライ機能
- ワークフロー連鎖実行

✅ **パフォーマンス最適化**

- ベンダーチャンク分離
- nginx 静的配信
- Docker build cache 活用

### 📚 詳細ドキュメント

各モジュールの詳細な説明は、それぞれの README を参照してください：

- **[stock_list/README.md](stock_list/README.md)** - データ収集パイプラインの詳細（Python scripts, CSV processing）
- **[stock_search/README.md](stock_search/README.md)** - React Web アプリケーションの詳細（Frontend, build process）
- **[README.md](README.md)** - プロジェクト全体の概要とクイックスタート

## Repository Structure

```
yfinance-jp-screener/
├── .github/workflows/                    # GitHub Actions automation (7 workflows)
│   ├── stock-data-fetch.yml             # Manual: Single stock file processing
│   ├── stock-fetch-sequential-1.yml     # Automated: Part 1/4 → triggers Part 2
│   ├── stock-fetch-sequential-2.yml     # Automated: Part 2/4 → triggers Part 3
│   ├── stock-fetch-sequential-3.yml     # Automated: Part 3/4 → triggers Part 4
│   ├── stock-fetch-sequential-4.yml     # Automated: Part 4/4 → triggers CSV combine
│   ├── csv-combine-export.yml           # Automated: Combine CSVs
│   └── stock-list-update.yml            # Manual: Stock list updates and splitting
├── current/                              # Personal portfolio data
│   └── tes.md                           # Portfolio tracking file
├── stock_list/                           # Data collection and processing
│   ├── Export/                          # Generated CSV data exports (gitignored in production)
│   ├── combine_latest_csv.py            # CSV combination script
│   ├── sumalize.py                      # Main data collection script with yfinance
│   ├── split_stocks.py                  # JSON file splitting utility (enhanced CLI)
│   ├── get_jp_stocklist.py              # Stock list acquisition from JPX
│   ├── stocks_all.json                  # Master stock list (~3795 companies)
│   ├── stocks_1.json                    # Split 1: Companies 1-1000
│   ├── stocks_2.json                    # Split 2: Companies 1001-2000
│   ├── stocks_3.json                    # Split 3: Companies 2001-3000
│   ├── stocks_4.json                    # Split 4: Companies 3001-3795
│   ├── requirements.txt                 # Python dependencies (pandas, yfinance, etc.)
│   └── pyproject.toml                   # Python project configuration
├── search/                                # Research and analysis data
│   ├── kogata/                          # Small-cap company data by industry
│   │   ├── *.csv                        # Industry-specific financial data (23 sectors)
│   ├── high_netcash/                    # High net cash companies analysis
│   │   ├── *.csv                        # Sector-specific high net cash data
│   │   ├── summary_data.json            # Analysis summary
│   │   └── 高ネットキャッシュ比率企業分析.md
│   └── 統合データ*.csv                   # Consolidated datasets
├── stock_search/                         # Web application (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/                  # React components
│   │   │   ├── DataTable.tsx           # Dynamic CSV display
│   │   │   ├── FileUpload.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── Pagination.tsx
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useCSVParser.ts
│   │   │   └── useFilters.ts
│   │   ├── utils/                       # Utility functions
│   │   │   ├── csvParser.ts            # CSV parsing and formatting
│   │   │   ├── csvDownload.ts          # CSV download utilities
│   │   │   └── columnConfig.ts         # Column configuration utilities
│   │   ├── types/                       # TypeScript definitions
│   │   │   └── stock.ts
│   │   └── App.tsx                      # Main application
│   ├── public/                          # Public assets
│   │   └── favicon.ico                  # Favicon
│   ├── dist/                            # Built application
│   ├── nginx.conf                       # Nginx configuration for Docker production
│   ├── package.json                     # Node.js dependencies
│   ├── vite.config.ts                   # Vite configuration
│   └── tsconfig.json                    # TypeScript configuration
├── Dockerfile.fetch                     # Python service (data collection)
├── Dockerfile.app                   # Frontend service (nginx production)
├── docker-compose.yml                    # Docker orchestration configuration
├── .env.sample                          # Environment variables template
├── CLAUDE.md                            # This file
├── DOCKER.md                            # Docker deployment documentation
└── README.md                            # Project documentation
```

## System Components

### 1. Data Collection Pipeline (`stock_list/`)

**Core Scripts:**

- `sumalize.py` - Main data collection script with yfinance API integration
- `split_stocks.py` - Enhanced utility with command-line arguments for flexible file splitting
- `get_jp_stocklist.py` - Stock list acquisition from JPX official data sources
- `combine_latest_csv.py` - Combines multiple CSV exports into single dated file

**Data Processing Features:**

- **Enhanced CLI**: `split_stocks.py` supports `--input`, `--size`, and `--verbose` flags
- Flexible input file specification (default: `stocks_all.json`)
- Customizable chunk sizes for different use cases
- Comprehensive logging with execution time tracking
- Error handling and retry mechanisms for API failures
- Rate limiting for API compliance and stability
- Automatic CSV generation with timestamping
- Master stock list management (`stocks_all.json`)

**Usage Examples:**

```bash
# Process default file
python sumalize.py

# Process specific chunk
python sumalize.py stocks_1.json

# Update master stock list
python get_jp_stocklist.py

# Enhanced split functionality with arguments
python split_stocks.py --input stocks_all.json --size 1000
python split_stocks.py -i custom_data.json -s 500 --verbose

# Combine latest CSV files
python combine_latest_csv.py
python combine_latest_csv.py --date 20251006
```

### 2. Web Application (`stock_search/`)

**Technology Stack:**

- **Frontend Framework**: React 19.1.1 + TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2 (高速 HMR、最適化されたビルド)
- **Routing**: React Router DOM 7.9.2 (SPA ルーティング)
- **Styling**: Tailwind CSS 4.1.13 + DaisyUI 5.1.9
- **CSV Processing**: PapaParse 5.5.3 (完全クライアントサイド処理)
- **State Management**: Custom Hooks (useState, useEffect)
- **Deployment**: Docker with nginx:alpine

---

#### **アーキテクチャ概要**

**プロジェクト構造:**

```
stock_search/
├── src/
│   ├── components/          # 再利用可能UIコンポーネント
│   │   ├── Breadcrumb.tsx          # パンくずリスト
│   │   ├── ColumnSelector.tsx      # カラム表示制御
│   │   ├── CSVViewer.tsx           # メインCSVビューア
│   │   ├── DataTable.tsx           # データテーブル表示
│   │   ├── DonationModal.tsx       # 寄付モーダル
│   │   ├── DownloadButton.tsx      # CSV download
│   │   ├── FileUpload.tsx          # D&Dファイルアップロード
│   │   ├── Footer.tsx              # フッター
│   │   ├── Navigation.tsx          # ナビゲーションバー
│   │   ├── Pagination.tsx          # ページネーション
│   │   ├── SearchFilters.tsx       # 検索・フィルター
│   │   ├── ShareButton.tsx         # SNSシェア
│   │   └── SponsorshipButtons.tsx  # スポンサーシップ
│   ├── pages/               # ページコンポーネント
│   │   ├── AboutPage.tsx           # About ページ
│   │   ├── DataPage.tsx            # メインデータページ
│   │   ├── NotFound.tsx            # 404 ページ
│   ├── hooks/               # カスタムReact Hooks
│   │   ├── useCSVParser.ts         # CSV解析ロジック
│   │   └── useFilters.ts           # フィルタリング状態管理
│   ├── utils/               # ユーティリティ関数
│   │   ├── columnConfig.ts         # カラム設定
│   │   ├── csvDownload.ts          # CSVダウンロード
│   │   ├── csvParser.ts            # CSV解析
│   │   └── urlParams.ts            # URLパラメータ処理
│   ├── types/               # TypeScript型定義
│   │   └── stock.ts                # 株式データ型
│   ├── App.tsx              # ルートアプリケーション
│   └── main.tsx             # エントリーポイント
├── public/
│   └── favicon.ico          # ファビコン
├── nginx.conf               # nginx設定（Docker用）
├── package.json             # 依存関係管理
├── vite.config.ts           # Vite設定
├── tsconfig.json            # TypeScript設定
├── tailwind.config.js       # Tailwind CSS設定
```

**総行数**: ~2,771 行 (TypeScript/TSX)

---

#### **Key Features**

##### **1. Drag & Drop File Upload System**

- **実装**: [FileUpload.tsx](stock_search/src/components/FileUpload.tsx)
- **特徴**:
  - ドラッグ&ドロップ対応
  - クリック選択対応
  - リアルタイムファイル検証
  - エラーハンドリング
  - ファイルサイズ・更新日表示

**データフロー:**

```
User drops CSV file
    ↓
FileUpload component
    ↓
createObjectURL (Browser API)
    ↓
CSVFile object creation
    ↓
Parent state update (setSelectedFile)
    ↓
CSVViewer component receives file
    ↓
useCSVParser hook processes file
    ↓
PapaParse library parses CSV
    ↓
DataTable displays results
```

##### **2. CSV Processing Pipeline**

**useCSVParser Hook ([useCSVParser.ts](stock_search/src/hooks/useCSVParser.ts)):**

```typescript
// 主要機能:
- PapaParseによる高速CSV解析
- 動的カラム検出 (任意のCSV構造に対応)
- 日本語文字列対応 (UTF-8, Shift-JIS)
- 数値・日付型の自動変換
- エラーハンドリングとローディング状態管理
```

**カラム設定 ([columnConfig.ts](stock_search/src/utils/columnConfig.ts)):**

```typescript
// 日本語金融データフォーマット:
- 通貨: "¥1,234,567" (円表示)
- パーセント: "12.34%" (比率)
- 倍率: "1.23倍" (PER, PBR等)
- 大数: "1.23億円" (時価総額等)
```

##### **3. Dynamic Data Table**

**[DataTable.tsx](stock_search/src/components/DataTable.tsx) 特徴:**

- **動的カラム検出**: CSV ヘッダーから自動生成
- **ソート機能**: 全カラムでソート可能（昇順・降順）
- **レスポンシブデザイン**:
  - モバイル: カード表示
  - タブレット/PC: テーブル表示
  - Sticky columns: 横スクロール時も固定
- **仮想化**: 大規模データセット対応 (Pagination)

##### **4. 検索・フィルタリングシステム**

**[SearchFilters.tsx](stock_search/src/components/SearchFilters.tsx):**

```typescript
// フィルタリング機能:
- 全カラムテキスト検索
- 範囲フィルタ (数値・日付)
- 複数条件AND検索
- URLパラメータ連携 (共有可能なフィルタ状態)
```

**[useFilters.ts](stock_search/src/hooks/useFilters.ts):**

```typescript
// 状態管理:
-フィルタ条件の永続化 -
  デバウンス処理(パフォーマンス最適化) -
  フィルタリセット機能;
```

##### **5. ページネーション**

**[Pagination.tsx](stock_search/src/components/Pagination.tsx):**

- **ページサイズ**: 10, 25, 50, 100 rows
- **ナビゲーション**: 前/次ページ、直接ページ指定
- **状態永続化**: URL パラメータで共有可能

---

#### **Build Configuration**

**Vite 設定 ([vite.config.ts](stock_search/vite.config.ts)):**

```typescript
export default defineConfig({
  plugins: [
    react(), // React Fast Refresh
    tailwindcss(), // Tailwind CSS統合
  ],
  base: "/", // ベースURL
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false, // 本番環境: ソースマップ無効
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"], // ~150KB
          papaparse: ["papaparse"], // ~110KB
        },
      },
    },
  },
});
```

**Code Splitting 効果:**

- **vendor.js**: 150KB (React ecosystem)
- **papaparse.js**: 110KB (CSV parsing)
- **main.js**: ~50KB (アプリケーションコード)
- **Total**: ~310KB (gzip: ~100KB)

**TypeScript 設定 ([tsconfig.json](stock_search/tsconfig.json)):**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

---

#### **Performance Optimization**

**Vite HMR (Hot Module Replacement):**

- **起動時間**: ~300ms (超高速)
- **HMR 更新**: ~50ms (インスタント)
- **ビルド時間**: ~3-5 秒 (最適化済み)

**Bundle Optimization:**

```
Initial Load:
├─ vendor.js (150KB) → gzip: 50KB
├─ papaparse.js (110KB) → gzip: 35KB
└─ main.js (50KB) → gzip: 15KB
Total: ~100KB (gzip)
```

**Lazy Loading Strategy:**

- 現状: ルートの遅延読み込みは未実装（将来対応可）
- 目的: 初期バンドルを削減し、初回描画を高速化
- 実装予定例:
  ```typescript
  // import { lazy } from "react";
  // const AboutPage = lazy(() => import("./pages/AboutPage"));
  // const DataPage = lazy(() => import("./pages/DataPage"));
  ```

**Caching Strategy:**

- **静的アセット**: Cache-Control: public, immutable (1 年)
- **HTML**: Cache-Control: no-cache, no-store
- **CSV**: ブラウザ内でのクライアントサイド処理のため、サーバー配信は想定していません（必要時は別途 `/csv/` ロケーションとヘッダーを設定）。

---

#### **Development Workflow**

**ローカル開発:**

```bash
cd stock_search

# 依存関係インストール
npm install

# 開発サーバー起動 (HMR有効)
npm run dev
# → http://localhost:5173

# TypeScript型チェック
npm run build  # tsc -b && vite build

# ESLint
npm run lint

# プレビュー (本番ビルド確認)
npm run preview
# → http://localhost:4173
```

**環境変数:**

- 現状: �� ロントエンドは完全クライアントサイドで動作し、外部 API やサーバー配信前提の環境変数は使用していません。
- 例としての `VITE_API_BASE_URL` / `VITE_CSV_DIR` は削除しました（要件に応じて将来追加）。

**Docker Build Process:**

```dockerfile
# Stage 1: deps - 依存関係キャッシング
npm ci  # package-lock.json厳密に従う

# Stage 2: builder - ビルド実行
npm run build  # tsc -b && vite build
└─ dist/
   ├── index.html
   ├── assets/
   │   ├── vendor-*.js
   │   ├── papaparse-*.js
   │   ├── main-*.js
   │   └── *.css
   └── favicon.ico

# Stage 3: runner - nginx配信
COPY dist/ /usr/share/nginx/html/
```

---

#### **Key Dependencies**

**Production Dependencies:**

```json
{
  "@tailwindcss/vite": "^4.1.13", // Tailwind Vite統合
  "autoprefixer": "^10.4.21", // CSSベンダープレフィックス
  "daisyui": "^5.1.9", // UIコンポーネントライブラリ
  "papaparse": "^5.5.3", // CSV parsing
  "postcss": "^8.5.6", // CSS処理
  "react": "^19.1.1", // Reactコア
  "react-dom": "^19.1.1", // React DOM
  "react-icons": "^5.5.0", // アイコンライブラリ
  "react-router-dom": "^7.9.2", // SPAルーティング
  "tailwindcss": "^4.1.13" // ユーティリティCSSフレームワーク
}
```

**Development Dependencies:**

```json
{
  "@types/papaparse": "^5.3.16",
  "@types/react": "^19.1.10",
  "@types/react-dom": "^19.1.7",
  "@vitejs/plugin-react": "^5.0.0",
  "eslint": "^9.33.0",
  "typescript": "~5.8.3",
  "vite": "^7.1.2"
}
```

---

#### **Client-Side Architecture Benefits**

**完全クライアントサイド処理:**

- ✅ **サーバーレス**: API 不要、静的ファイルのみ
- ✅ **プライバシー**: データはブラウザ内のみで処理
- ✅ **高速**: ネットワークレイテンシー無し
- ✅ **スケーラビリティ**: CDN 配信可能
- ✅ **オフライン対応**: Service Worker 統合可能

**デプロイメントオプション:**

- Docker + nginx (本番環境、推奨)
- GitHub Pages (静的ホスティング)
- Netlify / Vercel (サーバーレスプラットフォーム)
- S3 + CloudFront (AWS)

**セキュリティ:**

- **XSS 対策**: React 自動エスケープ + nginx ヘッダー
- **CSRF 対策**: API なし（不要）
- **CSP**: Content Security Policy 設定可能
- **HTTPS**: nginx reverse proxy 経由

### 3. Docker Environment

**アーキテクチャ概要:**

- **2 サービス構成**: Python データ収集 + React フロントエンド
- **マルチステージビルド**: 最適化されたイメージサイズとセキュリティ
- **ボリューム共有**: 効率的なデータ連携
- **本番グレード**: nginx + 非 root ユーザー実行

---

#### **Python Service** (`Dockerfile.fetch`)

**基本構成:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
USER stockuser (UID 1000)
```

**特徴:**

- **ベースイメージ**: `python:3.11-slim` - 軽量・セキュアな Python 環境
- **システム依存関係**: gcc, g++ (コンパイル時のみ、後片付け実施)
- **Python パッケージ**: requirements.txt から一括インストール、キャッシュ無効化
- **セキュリティ**: 非 root ユーザー`stockuser`で実行 (UID 1000)

**ディレクトリ構成:**

```
/app/
├── *.py                     # Python scripts (sumalize, split_stocks, etc.)
├── stocks_sample.json       # Default stock list
├── Export/                  # CSV output directory (created at runtime)
└── requirements.txt         # Python dependencies
```

**ボリュームマウント:**

```yaml
volumes:
  - ./stock_list:/app:rw # Scripts and stock list files (read-write)
  - ./stock_list/Export:/app/Export:rw # CSV output (read-write, ホストと同期)
```

**環境変数:**
| 変数名 | デフォルト | 説明 |
|--------|-----------|------|
| `STOCK_FILE` | `stocks_sample.json` | 処理対象の株式リストファイル |
| `CHUNK_SIZE` | `1000` | split_stocks.py のチャンクサイズ |
| `PYTHONUNBUFFERED` | `1` | ログの即時出力を有効化 |

**実行コマンド（CMD）:**

```bash
sh -c "python get_jp_stocklist.py && \
       python split_stocks.py --input stocks_all.json --size ${CHUNK_SIZE} && \
       python sumalize.py ${STOCK_FILE} && \
       python combine_latest_csv.py"
```

**処理フロー:**

1. **JPX 株式リスト取得** (`get_jp_stocklist.py`) → `stocks_all.json`生成
2. **株式リスト分割** (`split_stocks.py`) → `stocks_1-4.json`生成
3. **財務データ収集** (`sumalize.py`) → `Export/japanese_stocks_data_*.csv`生成
4. **CSV 結合** (`combine_latest_csv.py`) → `Export/YYYYMMDD_combined.csv`生成

**ビルド最適化:**

- **レイヤーキャッシング**: requirements.txt 変更時のみパッケージ再インストール
- **マルチステージ不使用**: シンプルな単一ステージ構成
- **不要ファイル削除**: apt-get clean up 実施でイメージサイズ削減

---

#### **Frontend Service** (`Dockerfile.app`)

**マルチステージビルド構成:**

##### **Stage 1: base** - ベース環境

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
```

##### **Stage 2: deps** - 依存関係インストール

```dockerfile
FROM base AS deps
COPY stock_search/package*.json ./
RUN npm ci  # 本番環境向け依存関係の厳密インストール
```

##### **Stage 3: builder** - アプリケーションビルド

```dockerfile
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY stock_search/ .

RUN npm run build --loglevel=info
```

**ビルドプロセス:**

1. **TypeScript コンパイル**: `tsc -b` - 型チェックと JS 変換
2. **Vite バンドリング**:
   - コード分割 (vendor, papaparse chunks)
   - アセット最適化 (圧縮、minify)
   - ソースマップ無効化 (本番環境)
3. **出力**: `dist/` ディレクトリに最適化された SPA

##### **Stage 4: runner** - 本番環境

```dockerfile
FROM nginx:alpine AS runner

# nginx設定コピー
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# ビルド成果物のみコピー（最小限）
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx 設定 (`stock_search/nginx.conf`):**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    # Gzip圧縮 (テキストベースアセット)
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    # 静的アセットキャッシュ (1年)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing (全てのルートを index.html にフォールバック)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

- 備考: 現状は CSV のサーバー配信を行っていないため、`/csv/` ロケーションや CORS の追加設定は行っていません。将来的にサーバー経由で CSV を配信する場合は、別途 `/csv/` ブロックを追加してください。

**パフォーマンス最適化:**

- **Code Splitting**: vendor (React, React Router) と papaparse を分離
- **Lazy Loading**: ルートベースの遅延読み込み
- **Gzip 圧縮**: テキストアセットの自動圧縮
- **ブラウザキャッシュ**: 静的ファイル 1 年、HTML 無キャッシュ

**セキュリティ対策:**

- **非 root ユーザー実行**: nginx:nginx ユーザーで実行
- **セキュリティヘッダー**: XSS, Clickjacking 対策
- **CORS 制御**: CSV API のみ許可

---

#### **Docker Compose オーケストレーション**

**docker-compose.yml 構成:**

```yaml
services:
  # Python データ収集サービス
  python-service:
    build:
      context: .
      dockerfile: Dockerfile.fetch
    container_name: stock-data-collector
    env_file: .env
    volumes:
      - ./stock_list:/app:rw
      - ./stock_list/Export:/app/Export:rw
    environment:
      - PYTHONUNBUFFERED=1
      - STOCK_FILE=${STOCK_FILE:-stocks_sample.json}
      - CHUNK_SIZE=${CHUNK_SIZE:-1000}
    restart: "no" # 一回のみ実行

  # React フロントエンドサービス
  frontend-service:
    build:
      context: .
      dockerfile: Dockerfile.app
    container_name: stock-frontend
    env_file: .env
    ports:
      - "${PORT:-8080}:80"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-8080}
    command: >
      sh -c "echo 'Frontend running on http://localhost:${PORT:-8080}' && nginx -g 'daemon off;'"
```

**データフロー:**

### 重要な設計: 2 つの独立した使用パターン

```
パターン1: データ収集パイプライン (Docker Python Service)
┌─────────────────────────────────────────────────────────────┐
│ Python Service (stock-data-collector)                       │
│ ├─ get_jp_stocklist.py → stocks_all.json                   │
│ ├─ split_stocks.py → stocks_1-4.json                       │
│ ├─ sumalize.py → Export/japanese_stocks_data_*.csv         │
│ └─ combine_latest_csv.py → Export/YYYYMMDD_combined.csv    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ (ホストマシンに保存: ./stock_list/Export/)
                 │
        ユーザーがローカルで使用


パターン2: フロントエンドでのCSV分析 (完全クライアントサイド)
┌─────────────────────────────────────────────────────────────┐
│ Frontend Service (stock-frontend)                           │
│ ├─ nginx serves /usr/share/nginx/html (React SPA)          │
│ └─ Browser: http://localhost:8080                          │
└─────────────────────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ ブラウザ (完全クライアントサイド処理)                        │
│                                                             │
│  ユーザー操作:                                               │
│  1. CSVファイルをDrag & Drop / クリック選択                  │
│  2. ブラウザ内でPapaParseがCSV解析                          │
│  3. React コンポーネントでデータ表示                         │
│  4. 検索・フィルタリング・ソート (全てブラウザ内)            │
│                                                             │
│  データの流れ:                                               │
│  ローカルCSVファイル → FileReader API → PapaParse          │
│  → State管理 → DataTable表示                               │
│                                                             │
│  ⚠️ 重要: サーバーにデータは送信されません                   │
│  ⚠️ CSVファイルはブラウザ内のみで処理                        │
└─────────────────────────────────────────────────────────────┘
```

**アーキテクチャの特徴:**

1. **Python Service (データ収集)**:

   - 目的: yfinance API から財務データを収集して CSV を生成
   - 出力: ホストマシンの `./stock_list/Export/` ディレクトリ
   - 使用タイミング: 定期的なデータ更新時（GitHub Actions またはローカル Docker 実行）

2. **Frontend Service (CSV ビューア)**:

   - 目的: ユーザーが持っている任意の CSV ファイルを分析
   - 入力: ユーザーが Drag & Drop するローカルファイル
   - 処理: 100%ブラウザ内（サーバー送信なし）
   - データソース: **制限なし** - Python Service で生成した CSV でも、他の任意の CSV でも OK

3. **独立性**:
   - 2 つのサービスは **直接連携していません**
   - Frontend Service は Python Service の出力を **必要としません**
   - ユーザーは任意の CSV ファイルをフロントエンドで分析可能

**環境変数 (.env ファイル):**

```bash
# Python Service
STOCK_FILE=stocks_sample.json
CHUNK_SIZE=1000

# Frontend Service
PORT=8080
NODE_ENV=production
```

**実行コマンド:**

```bash
# 全サービスビルド&起動
docker-compose up --build

# バックグラウンド実行
docker-compose up -d

# 特定サービスのみ起動
docker-compose up frontend-service

# ログ確認
docker-compose logs -f
docker-compose logs -f python-service

# サービス停止
docker-compose down

# ボリュームも含めて完全削除
docker-compose down -v

# 再ビルド（キャッシュなし）
docker-compose build --no-cache
```

**トラブルシューティング:**

```bash
# コンテナ内に入る
docker-compose exec frontend-service sh
docker-compose exec python-service bash

# ボリューム確認
docker-compose exec frontend-service ls -la /usr/share/nginx/html/csv

# nginxログ確認
docker-compose exec frontend-service cat /var/log/nginx/error.log

# Pythonログ確認
docker-compose logs python-service | grep ERROR
```

**ポート競合時の対処:**

```bash
# .env でポート変更
echo "PORT=3000" >> .env
docker-compose up

# または直接指定
PORT=3000 docker-compose up
```

### 4. GitHub Actions Automation (`.github/workflows/`)

**Workflow Orchestration Chain:**

```
Sequential Data Collection Workflows (Manual Start)
    ↓
stock-fetch-sequential-1.yml (Part 1/4)
    ↓ Auto-trigger on success
stock-fetch-sequential-2.yml (Part 2/4)
    ↓ Auto-trigger on success
stock-fetch-sequential-3.yml (Part 3/4)
    ↓ Auto-trigger on success
stock-fetch-sequential-4.yml (Part 4/4)
    ↓ Auto-trigger on success
csv-combine-export.yml (Combine all CSV files)
    ↓
CSV Data Ready for Local/Docker Use
```

#### **Workflow 1: `stock-data-fetch.yml` (Manual Single File Processing)**

- **Trigger**: Manual (workflow_dispatch)
- **Purpose**: Process single stock file for quick testing
- **Input**: Stock file selection (stocks_1.json - stocks_4.json, stocks_sample.json)
- **Timeout**: 60 minutes
- **Process**: Data collection → Export to stock_list/Export/ → Commit
- **Use Case**: Quick data collection for specific stock chunk

#### **Workflow 2-5: Sequential Stock Fetch Workflows**

**Part 1** (`stock-fetch-sequential-1.yml`):

- **Trigger**: Manual (workflow_dispatch)
- **Process**: stocks_1.json → Commit → Auto-trigger Part 2
- **Timeout**: 120 minutes

**Part 2** (`stock-fetch-sequential-2.yml`):

- **Trigger**: Auto (triggered by Part 1 completion)
- **Process**: stocks_2.json → Commit → Auto-trigger Part 3

**Part 3** (`stock-fetch-sequential-3.yml`):

- **Trigger**: Auto (triggered by Part 2 completion)
- **Process**: stocks_3.json → Commit → Auto-trigger Part 4

**Part 4 (Final)** (`stock-fetch-sequential-4.yml`):

- **Trigger**: Auto (triggered by Part 3 completion)
- **Process**: stocks_4.json → Commit → Auto-trigger CSV Combine
- **Special**: Completion summary and workflow chain trigger

**Why Sequential?**

- Avoids API rate limiting from yfinance
- Prevents GitHub Actions timeout (max 6 hours total, 120 min per workflow)
- Allows monitoring and intervention at each stage
- Commits data incrementally for safety

#### **Workflow 6: `csv-combine-export.yml` (CSV Combination)**

- **Trigger**:
  - Auto (triggered by Sequential Part 4 completion)
  - Manual (workflow_dispatch)
- **Purpose**: Combine all japanese*stocks_data*\*.csv files into single dated file
- **Input Parameters** (manual only):
  - `custom_date` - Custom date for output filename (YYYYMMDD)
  - `reason` - Reason for combination
- **Process**:
  1. Check existing CSV files in stock_list/Export/
  2. Run `combine_latest_csv.py` with arguments
  3. Commit combined file (YYYYMMDD_combined.csv)
- **Output**: `YYYYMMDD_combined.csv` in stock_list/Export/

#### **Workflow 7: `stock-list-update.yml` (Master List Update)**

- **Trigger**: Manual (workflow_dispatch)
- **Purpose**: Update master stock list from JPX
- **Process**:
  1. Run `get_jp_stocklist.py` to fetch latest JPX data
  2. Generate `stocks_all.json` (~3795 companies)
  3. Split using `split_stocks.py --input stocks_all.json --size 1000`
  4. Validate all generated JSON files
  5. Commit with Japanese date format
- **Output**: Updated stocks_all.json and stocks_1-4.json
- **Frequency**: Run when JPX publishes new stock listings (monthly/quarterly)

### 5. CSV Data Flow Architecture

**Important Note on Directory Paths:**

- **GitHub Actions & Local Development**: Uses `stock_list/Export/` (repository structure)
- **Docker Environment**: Uses `Export/` directly (simplified with named volumes)
- **Python Scripts**: Use relative path `Export/` which works in both contexts

**CSV File Upload System (Drag & Drop):**

- **Method**: Client-side file upload only (no server required)
- **Processing**: Papa Parse library for CSV parsing
- **Benefits**: シンプル、高速、メンテナンスフリー、完全クライアントサイド

**Application Flow:**

#### **Local Development**

```
npm run dev → http://localhost:5173
    ↓
User drags & drops CSV file
    ↓
FileUpload component receives file
    ↓
Papa Parse processes CSV client-side
    ↓
DataTable displays results
```

#### **Production Build**

```
npm run build
    ↓
Vite build → dist/ directory
    ↓
Static files ready for deployment
    ↓
User uploads CSV via browser (D&D or click)
```

#### **Docker Deployment**

```
docker-compose up → nginx serves static files
    ↓
Browser: http://localhost:8080
    ↓
User uploads CSV file via drag & drop
    ↓
Client-side processing and display
```

**Key Features**:

- **Zero Server Dependency**: 完全クライアントサイド処理
- **Any CSV Structure**: 任意の CSV 構造に対応
- **Fast Processing**: ブラウザ上で高速解析
- **Simple Deployment**: 静的ファイルのみ（nginx, GitHub Pages, S3 など）
- **Privacy**: データはブラウザ内のみで処理（サーバーに送信されない）

## Data Architecture

### Stock List Management

**Master Data Source**: JPX (Japan Exchange Group) official data

- **Source**: `https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls`
- **Format**: Excel → JSON conversion with Japanese character support
- **Markets**: プライム (Prime), スタンダード (Standard), グロース (Growth)
- **Data Fields**: コード (Stock Code), 銘柄名 (Company Name), 市場・商品区分 (Market Classification), 33 業種区分 (Industry Classification)

**File Structure:**

```
stocks_all.json      # Master list (~3795 companies)
├── stocks_1.json    # Companies 1-1000
├── stocks_2.json    # Companies 1001-2000
├── stocks_3.json    # Companies 2001-3000
└── stocks_4.json    # Companies 3001-3795
```

### Industry Data Structure (search/kogata/)

**Core Financial Fields:**

- **Basic Info**: 会社名 (Company Name), 銘柄コード (Stock Code), 業種 (Industry)
- **Market Data**: 優先市場 (Preferred Market), 時価総額 (Market Cap), 決算月 (Settlement Month)
- **Geographic**: 都道府県 (Prefecture), 会計基準 (Accounting Standard)
- **Valuation Ratios**: PBR, ROE, 自己資本比率 (Equity Ratio), PER(会予) (Projected PER)
- **Performance Metrics**: 売上高 (Revenue), 営業利益 (Operating Profit), 営業利益率 (Operating Margin)
- **Profitability**: 当期純利益 (Net Profit), 純利益率 (Net Margin)
- **Balance Sheet**: 負債 (Debt), 流動負債 (Current Liabilities), 流動資産 (Current Assets)
- **Cash Analysis**: ネットキャッシュ（流動資産-負債）, ネットキャッシュ比率
- **Additional Fields**: 総負債, 現金及び現金同等物, 投資有価証券

**Data Quality Features:**

- Automatic data type detection and conversion
- Japanese unit parsing (倍, %, 円) with proper formatting
- Null value handling and validation
- Unicode support for Japanese characters
- Flexible schema adaptation for varying CSV structures

**Industry Sectors Available (23 sectors):**

- **Basic Industries**: 化学, 鉄鋼, 非鉄金属, 金属製品, ゴム
- **Manufacturing**: 機械, 電気機器, 運送用, 機密製品, パルプ・紙, 繊維
- **Services**: サービス, 情報・通信業, 倉庫・運輸関連業
- **Consumer**: 小売業, 卸業者, 食料品
- **Real Estate & Finance**: 不動産業界, 証券
- **Resources**: 水産・農林業, 石油・石炭製品
- **Construction**: 建設業界
- **Other**: その他

## Development Context

This repository serves as a comprehensive Japanese stock analysis platform with:

### Japanese Business Focus

- **Language**: Primary data and interface in Japanese with Unicode support
- **Market**: Japanese stock exchanges (プライム, スタンダード, グロース)
- **Specialization**: Small-cap company (小型株) analysis and screening
- **Perspective**: Individual investor research with AI-assisted analysis
- **Cultural Context**: Japanese financial terminology and reporting standards

### Technical Environment

- **Backend**: Python 3.11+ (data processing and API integration)
- **Frontend**: React 19 + TypeScript + Vite (modern web interface)
- **Data Processing**: yfinance, pandas, Papa Parse
- **Deployment**: Docker + nginx (個人環境向け)
- **CSV Processing**: Robust handling of Japanese financial data formats
- **Version Control**: Git-based data versioning and change tracking
- **Containerization**: Docker Compose (nginx production + Python data service)

### Automation Strategy

- **Sequential Workflows**: Multi-part data collection to avoid timeouts and rate limits (GitHub Actions)
- **Workflow Orchestration**: Auto-triggered workflow chains for complete automation (7 workflows)
- **Data Pipeline**: Collection → Combination → Local/Docker Use
- **Quality Assurance**: Build verification, health checks, and error handling
- **Monitoring**: Comprehensive logging and artifact retention (30 days)

## Common Operations

### Data Collection Operations

**Full Sequential Collection (All 3795+ companies):**

```bash
# GitHub Actions (Recommended)
# 1. Navigate to Actions → "📊 Sequential Stock Fetch - Part 1"
# 2. Click "Run workflow"
# 3. Wait for all 4 parts to complete (automatic chain)
# 4. CSV combination happens automatically

# Expected duration: 6-8 hours total for all parts
```

**Quick Single File Collection:**

```bash
# GitHub Actions
# Navigate to Actions → "📊 Stock Data Fetch"
# Select stock file (stocks_1.json - stocks_4.json)
# Click "Run workflow"

# Expected duration: 1-2 hours per file
```

**Local Development:**

```bash
cd stock_list

# Collect data for specific chunk
python sumalize.py stocks_1.json

# Combine latest CSV files
python combine_latest_csv.py

# Check exports
ls -lh Export/*_combined.csv
```

### Web Application Development

**Local Development:**

```bash
cd stock_search

# Install dependencies
npm install

# Start development server with hot reload
npm run dev
# Access: http://localhost:5173

# Build for production
npm run build
# Output: dist/ directory with CSV files included

# Preview production build
npm run preview
# Access: http://localhost:4173

# Manually copy CSV files (normally done in prebuild)
npm run copy-csv
```

**Docker Development:**

```bash
# Build and start both services
docker-compose up --build

# Access frontend
open http://localhost:8080

# Check CSV files are accessible
curl http://localhost:8080/csv/

# View logs
docker-compose logs -f frontend-service

# Stop services
docker-compose down

# Clean volumes and rebuild
docker-compose down -v && docker-compose up --build
```

### CSV Combination & Docker Deployment

**CSV Combination:**

```bash
# GitHub Actions (Automated after Sequential Part 4)
# Navigate to Actions → "📋 CSV Combine & Export"
# Combined CSV files in stock_list/Export/

# Local
cd stock_list
python combine_latest_csv.py
# or with custom date
python combine_latest_csv.py --date 20251006
```

**Docker Deployment:**

```bash
# Build and start both services (data collection + frontend)
docker-compose up --build

# Access application
open http://localhost:8080

# View logs
docker-compose logs -f

# Stop and clean
docker-compose down -v
```

### Stock List Update Operations

```bash
# GitHub Actions (when JPX publishes new listings)
# Navigate to Actions → "📋 Stock List Update"
# Optionally provide reason
# Click "Run workflow"

# Local development
cd stock_list
python get_jp_stocklist.py
python split_stocks.py --input stocks_all.json --size 1000

# Verify splits
ls -lh stocks_*.json
```

## GitHub Actions Workflows

### Workflow Management Strategy

**Two-Tier Automation System:**

1. **Data Collection** (5 workflows)

   - `stock-data-fetch.yml` - Manual single file
   - `stock-fetch-sequential-1/2/3/4.yml` - Automated sequential chain

2. **Data Processing** (2 workflows)
   - `csv-combine-export.yml` - CSV combination
   - `stock-list-update.yml` - Master list updates

### Workflow Execution Best Practices

**For Complete Data Update:**

1. Start `stock-fetch-sequential-1.yml` manually
2. Wait for automatic completion of all 4 parts (6-8 hours)
3. Automatic CSV combination follows
4. CSV files available in stock_list/Export/
5. Deploy locally using Docker if needed

**For Quick Testing:**

1. Run `stock-data-fetch.yml` with `stocks_sample.json`
2. Manually run `csv-combine-export.yml` if needed
3. Test locally with Docker

**For Stock List Updates:**

1. Run `stock-list-update.yml` when JPX updates listings
2. Manually verify stocks_all.json and split files
3. Run sequential collection for new companies

### Error Handling and Monitoring

**Built-in Error Handling:**

- Timeout protection (60-120 minutes per workflow)
- Dependency validation before execution
- Build artifact verification
- Git conflict resolution with rebase
- Comprehensive error logging

**Monitoring Features:**

- Real-time workflow status in Actions tab
- Execution time tracking for performance metrics
- Build artifact retention (30 days) for debugging
- Commit messages with timestamps and completion status
- Health checks for deployed services

## Technical Specifications

### Japanese Language Support

- **Character Encoding**: UTF-8 throughout all components
- **Financial Terminology**: Native Japanese terms with English annotations
- **Geographic Data**: Prefecture-based analysis (都道府県)
- **Accounting Standards**: Japan GAAP compliance and tracking
- **Market Classifications**: Japanese exchange-specific categories

### Performance Considerations

- **Data Volume**: 3795+ companies across 23+ industry sectors
- **Processing Time**: ~3-5 seconds per company via yfinance API
- **Sequential Processing**: 120 minutes timeout per workflow part
- **Web Interface**: Optimized for large datasets with pagination and lazy loading
- **Storage**: Efficient CSV compression and Git LFS considerations
- **Caching**:
  - Client-side data caching for improved UX
  - GitHub Actions npm/pip cache for faster builds
  - nginx static asset caching with proper headers
- **Bundle Optimization**: Vendor chunks separated for efficient loading

### Integration Points

- **yfinance API**: Primary data source with rate limiting and retry logic
- **JPX Official Data**: Stock list source with Excel → JSON conversion
- **GitHub Actions**: 7 workflows with sequential orchestration
- **React Components**: Modular design for easy extension and maintenance
- **TypeScript**: Type safety for Japanese financial data structures
- **Tailwind CSS + DaisyUI**: Responsive design system
- **Docker + nginx**: Production-ready containerization with multi-stage builds
- **Papa Parse**: CSV parsing with Japanese character support

### Security and Compliance

- **API Rate Limiting**: Respectful usage of external APIs (yfinance, JPX)
- **Error Handling**: Graceful failure handling without data corruption
- **Version Control**: Complete audit trail of all data changes
- **Access Control**: GitHub repository permissions and workflow security
- **Data Validation**: Input validation and sanitization throughout pipeline
- **Docker Security**: Non-root users, minimal base images, proper permissions
- **nginx Security**: Security headers, CORS policies, XSS protection

## Development Workflow

### Local Development Process

1. **Environment Setup**: Python 3.11+ and Node.js 20+ required
2. **Data Development**: Work in `stock_list/` directory for data processing scripts
3. **Web Development**: Work in `stock_search/` directory for React application
4. **Testing**: Use provided test files and validation scripts
5. **Docker Testing**: Use docker-compose for integration testing
6. **Deployment**: Deploy using Docker Compose

### Docker Production Deployment

1. **Data Collection**: Run sequential workflows via GitHub Actions (6-8 hours)
2. **CSV Combination**: Automatic combination after Part 4
3. **Code Changes**: Modify files in `stock_search/` directory if needed
4. **Build & Deploy**: `docker-compose up --build` (builds both services)
5. **Verification**: Check application at http://localhost:8080
6. **Monitoring**: Use `docker-compose logs -f` for real-time logs

### Complete Data Update & Deployment Workflow

1. **Sequential Collection**: Start Part 1 workflow via GitHub Actions
2. **Automatic Chain**: Parts 2-4 execute automatically (6-8 hours)
3. **CSV Combination**: Automatic combination after Part 4 completion
4. **Local Access**: CSV files available in `stock_list/Export/`
5. **Docker Build**: `docker-compose up --build` for local deployment
6. **Verification**: Access application at http://localhost:8080

## システム概要

個人向け日本株式分析プラットフォーム。GitHub Actions による自動データ収集と、Docker + nginx によるローカルデプロイメントを提供。

**主要機能:**

- JPX 公式データからの株式リスト自動取得（3795+銘柄）
- yfinance API による財務データ収集
- 4 段階 Sequential 実行でタイムアウト回避
- React 19 + TypeScript + Vite によるモダンなウェブインターフェース
- Docker Compose による 2 サービス構成（Python + nginx）
- 日本語財務データの完全サポート

**デプロイメント:**

- **開発**: Vite dev server (port 5173) + Vite preview (port 4173)
- **本番**: nginx production server (port 8080) via Docker Compose

詳細は[DOCKER.md](DOCKER.md)を参照してください。

## 🔄 Architecture Overview (Updated 2025-10-20)

### System Architecture Summary

**yfinance-jp-screener** は、日本株式市場の 3795+銘柄を自動収集・分析するフルスタック株式スクリーニングプラットフォームです。

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ Part 1/4   │→ │ Part 2/4   │→ │ Part 3/4   │→ │ Part 4/4   ││
│  │ stocks_1   │  │ stocks_2   │  │ stocks_3   │  │ stocks_4   ││
│  └────────────┘  └────────────┘  └────────────┘  └─────┬──────┘│
│                                                         ↓        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CSV Combine & Export → YYYYMMDD_combined.csv          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Local Development                           │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │  stock_list/            │    │  stock_search/          │    │
│  │  (Python 3.11)          │    │  (React 19 + TS)        │    │
│  │  ├─ sumalize.py         │    │  ├─ DataPage.tsx        │    │
│  │  ├─ combine_csv.py      │    │  ├─ FileUpload.tsx      │    │
│  │  └─ Export/*.csv        │    │  └─ CSVViewer.tsx       │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Docker Production                           │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │  Python Service         │    │  Frontend Service       │    │
│  │  (Dockerfile.fetch)     │    │  (Dockerfile.app)       │    │
│  │  ├─ Data Collection     │    │  ├─ nginx:alpine        │    │
│  │  ├─ CSV Generation      │    │  ├─ Static Files        │    │
│  │  └─ Export/ (host directory)                                  │
│  └─────────────────────────┘    └─────────────────────────┘    │
│         Independent services (no direct volume coupling)         │
└────────────────────────────────────��────────────────────────────┘
                              ↓
                   Browser: http://localhost:8080
```

### Core Components

#### 1. **Data Collection Pipeline** (stock_list/)

- **Purpose**: JPX 公式データから 3795+銘柄の財務データ自動収集
- **Technology**: Python 3.11, yfinance, pandas
- **Key Scripts**:
  - `sumalize.py` - yfinance API による財務データ収集
  - `get_jp_stocklist.py` - JPX 公式株式リスト取得
  - `combine_latest_csv.py` - CSV 統合処理
  - `split_stocks.py` - 株式リスト分割（CLI 対応）
- **Output**: `Export/YYYYMMDD_combined.csv` (タイムスタンプ付き統合 CSV)

#### 2. **Web Application** (stock_search/)

- **Purpose**: ドラッグ&ドロップによる CSV ファイル分析 UI
- **Technology**: React 19, TypeScript, Vite, Tailwind CSS, DaisyUI
- **Architecture**:
  ```
  src/
  ├── pages/
  │   └── DataPage.tsx         # メインページ（D&Dエリア + データ表示）
  ├── components/
  │   ├── FileUpload.tsx       # D&Dファイルアップロード
  │   ├── CSVViewer.tsx        # データテーブル表示
  │   ├── DataTable.tsx        # 動的カラム検出
  │   ├── SearchFilters.tsx    # 検索・フィルタリング
  │   └── Pagination.tsx       # ページネーション
  ├── hooks/
  │   ├── useCSVParser.ts      # CSV解析ロジック
  │   └── useFilters.ts        # フィルタリング状態管理
  └── utils/
      ├── csvParser.ts         # PapaParse統合
      ├── csvDownload.ts       # CSVエクスポート
      └── columnConfig.ts      # カラム設定
  ```
- **Key Features**:
  - 完全クライアントサイド処理（サーバー不要）
  - 任意の CSV 構造に対応（動的カラム検出）
  - 日本語財務データフォーマット対応（円、%、倍）
  - リアルタイム検索・フィルタリング
  - レスポンシブデザイン（モバイル対応）

#### 3. **Docker Environment**

- **Architecture**: 2 サービス構成 + 共有ボリューム
- **Services**:
  1. **Python Service** (Dockerfile.fetch)
     - Base: `python:3.11-slim`
     - Purpose: データ収集・CSV 生成
     - Volume: `stock-data:/app/Export:rw`
  2. **Frontend Service** (Dockerfile.app)
     - Base: `nginx:alpine` (multi-stage build)
     - Purpose: 静的ファイル配信
     - Volume: なし（完全クライアントサイド）
- **Data Flow**:
  ```
  Python Container → Export/*.csv → stock-data volume
                                        ↓
  Frontend Container (Static SPA)
                                        ↓
                        Browser: http://localhost:8080 (CSV はユーザーがローカルからアップロード)
  ```

#### 4. **GitHub Actions CI/CD**

- **7 Workflows** による完全自動化パイプライン
- **Sequential Execution**: 4 段階データ収集（各 120 分タイムアウト）
- **Workflow Chain**:
  1. `stock-fetch-sequential-1.yml` (Manual Start) → stocks_1.json
  2. `stock-fetch-sequential-2.yml` (Auto-trigger) → stocks_2.json
  3. `stock-fetch-sequential-3.yml` (Auto-trigger) → stocks_3.json
  4. `stock-fetch-sequential-4.yml` (Auto-trigger) → stocks_4.json
  5. `csv-combine-export.yml` (Auto-trigger) → YYYYMMDD_combined.csv
- **Additional Workflows**:
  - `stock-data-fetch.yml` - 単一ファイル手動実行
  - `stock-list-update.yml` - JPX 株式リスト更新

### Technology Stack Summary

| Layer               | Technology             | Purpose                     |
| ------------------- | ---------------------- | --------------------------- |
| **Backend**         | Python 3.11            | データ収集・処理            |
| **Data Source**     | yfinance API           | 財務データ取得              |
| **Data Processing** | pandas                 | CSV 処理・統合              |
| **Frontend**        | React 19 + TypeScript  | UI フレームワーク           |
| **Build Tool**      | Vite                   | 高速ビルド・HMR             |
| **Styling**         | Tailwind CSS + DaisyUI | レスポンシブデザイン        |
| **CSV Parser**      | PapaParse              | クライアントサイド CSV 解析 |
| **Deployment**      | Docker + nginx         | 本番環境コンテナ化          |
| **CI/CD**           | GitHub Actions         | 自動データ収集              |
| **Version Control** | Git + GitHub           | ソースコード管理            |

### Data Architecture

#### Stock Data Structure (CSV Format)

```csv
会社名,銘柄コード,業種,優先市場,時価総額,決算月,都道府県,会計基準,
PBR,ROE,自己資本比率,PER(会予),売上高,営業利益,営業利益率,当期純利益,
純利益率,負債,流動負債,流動資産,ネットキャッシュ,ネットキャッシュ比率,
総負債,現金及び現金同等物,投資有価証券
```

#### Data Flow Pipeline

```
JPX Official Data (Excel) → get_jp_stocklist.py → stocks_all.json (3795+ companies)
                                                        ↓
                              split_stocks.py → stocks_1-4.json (1000 companies each)
                                                        ↓
        yfinance API ← sumalize.py (Sequential 4-part execution, ~3-4 hours total)
                                                        ↓
              japanese_stocks_data_1-4_YYYYMMDD_HHMMSS.csv (Timestamped outputs)
                                                        ↓
                   combine_latest_csv.py → YYYYMMDD_combined.csv (Single merged file)
                                                        ↓
                            Docker Volume or Local Export/ directory
                                                        ↓
                   Frontend: Drag & Drop → PapaParse → DataTable Display
```

### Key Design Decisions

#### ✅ **Simplified CSV Handling (2025-10-19 Update)**

- **Before**: 自動検出システム + prebuild scripts
- **After**: Drag & Drop 専用システム
- **Benefits**:
  - サーバー設定不要（完全クライアントサイド）
  - プライバシー保護（データはブラウザ内のみで処理）
  - 柔軟性（任意の CSV 構造に対応）
  - デプロイ簡素化（静的ファイルのみ）
  - メンテナンスフリー（prebuild スクリプト不要）

#### ✅ **Sequential GitHub Actions Workflow**

- **Why**: API rate limiting 回避 + GitHub Actions 6 時間制限対応
- **How**: 4 段階自動連鎖実行（各 120 分タイムアウト）
- **Benefits**: 安定性、監視可能性、段階的コミット

#### ✅ **Docker Two-Service Architecture**

- **Why**: データ収集とフロントエンドの分離
- **How**: Named volume 共有（stock-data）
- **Benefits**: モジュール性、再利用性、環境一貫性

#### ✅ **Client-Side CSV Processing**

- **Why**: サーバーレス、高速、プライバシー
- **How**: PapaParse library + React hooks
- **Benefits**: 即座の処理、柔軟な構造対応、デプロイ簡単

### Performance Considerations

- **Data Volume**: 3795+ companies × 30+ financial metrics
- **Collection Time**: ~3-4 hours for full dataset (via GitHub Actions)
- **API Rate**: ~3-5 seconds per company (yfinance throttling)
- **CSV Size**: ~1-2 MB per combined file
- **Build Time**: ~1-2 minutes (Vite optimization)
- **Bundle Size**: Vendor chunks separated for caching efficiency

### Security & Compliance

- **API Usage**: yfinance rate limiting compliance
- **Data Privacy**: クライアントサイド処理（サーバー送信なし）
- **Docker Security**: Non-root users, minimal base images
- **Version Control**: Complete audit trail
- **Access Control**: GitHub repository permissions

## 🆕 Recent Updates (2025-10-19)

### Drag & Drop File Upload System

**変更概要**: CSV 自動検出システムを削除し、シンプルなドラッグ&ドロップファイルアップロード専用に変更しました。

#### 主要な変更点

**1. 削除されたファイル:**

- `stock_search/src/hooks/useCSVFileDetector.ts` - 自動検出フックの削除
- `stock_search/scripts/copy-csv-files.js` - prebuild スクリプトの削除
- `package.json` - `prebuild`および`copy-csv`スクリプトの削除

**2. DataPage.tsx の簡素化**

- **場所**: `stock_search/src/pages/DataPage.tsx`
- **変更内容**:
  - `useCSVFileDetector`フックの使用を削除
  - ファイル自動検出ロジックの削除
  - D&D 専用 UI に変更
  - ファイル情報表示の追加（ファイル名、サイズ、更新日）
  - ファイル閉じるボタンの追加

**3. 新しいユーザーフロー**

```
アプリケーション起動
    ↓
D&Dエリアを表示
    ↓
ユーザーがCSVファイルをドラッグ&ドロップ
または
クリックしてファイルを選択
    ↓
FileUpload コンポーネントがファイルを受信
    ↓
handleFileUpload でCSVFile形式に変換
    ↓
CSVViewer でデータを表示
```

#### メリット

✅ **シンプル**: サーバー設定不要、完全クライアントサイド
✅ **プライバシー**: データはブラウザ内のみで処理（サーバー送信なし）
✅ **柔軟性**: 任意の CSV 構造に対応
✅ **高速**: 即座にファイル処理開始
✅ **デプロイ簡単**: 静的ファイルのみ（GitHub Pages, S3, netlify など）
✅ **メンテナンスフリー**: prebuild スクリプト不要

#### ビルドプロセスの簡素化

**Before (自動検出時):**

```bash
npm run build
  ↓
prebuild: node scripts/copy-csv-files.js
  ↓
tsc -b && vite build
```

**After (D&D 専用):**

```bash
npm run build
  ↓
tsc -b && vite build
```
