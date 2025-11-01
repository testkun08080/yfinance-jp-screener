# 📊 yfinance × 日本株式スクリーニング **（with わが投資術）**

## ⚠️ 注意事項

このプロジェクトは **Yahoo Finance のデータを取得・可視化するためのツール**です。  
本ツールの利用により生じたいかなる損害についても、作者は一切の責任を負いません。

- **データの利用は Yahoo の利用規約に従ってください**
- **本リポジトリはデータそのものを配布しません**
- **個人利用・研究・教育目的のみ使用可**
- **プライベートリポジトリでの使用を推奨します**

> 💡 取得したデータは、**ご自身の環境でのみ利用**してください。

## 📘 概要

[わが投資術](https://amzn.to/3IEVRkq) の考え方をもとに、
**日本株をシンプルに分析・可視化**するためのツールです。

- 📈 GitHub Actions による自動データ収集
- 🔍 Web 上でのスクリーニング・可視化
- 📂 ドラッグ&ドロップで CSV ファイルアップロード（完全クライアントサイド）
- ⚙️ JPX 公式データ対応・簡易データ分割機能
- 🚀 **GitHub Pages 自動デプロイ対応**

## 🌐 オンラインデモ

**GitHub Pages でホストされたアプリケーション**にアクセスできます:

👉 **<https://testkun.net/yfinance-jp-screener/>**

- インストール不要でブラウザから即利用可能
- CSV ファイルをドラッグ&ドロップで簡単分析

---

## 💡 開発の経緯

日本で頑張ってる企業を見つけたい。  
けど、せっかくなら割安株を見つけてみたい。  
そんな想いと、わが投資術を参考にして作成した**個人開発による実験的プロジェクト**です。

---

## 🧾 免責事項

動作・結果・データの正確性を保証するものではありません。  
利用はすべて **自己責任** でお願いいたします。

---

## 🛠️ 技術概要

| 項目           | 内容                           |
| -------------- | ------------------------------ |
| **Backend**    | Python 3.11+, pandas, yfinance |
| **Frontend**   | React 19 + TypeScript + Vite   |
| **CI/CD**      | GitHub Actions + Docker        |
| **スタイル**   | Tailwind CSS, DaisyUI          |
| **データ形式** | CSV, JSON                      |

---

## 🚀 セットアップガイド

### 方法 1: Docker Compose（推奨・最速）データ収集とインターフェイス

一つのコマンドでデータ収集から Web アプリ起動まで完結

**データ収集時間:**
約 3700 社のデータをダウンロードするにはおよそ 3~４時間ほどかかります

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/yfinance-jp-screener.git
cd yfinance-jp-screener

# 2. 環境変数を設定
cp .env.example .env
# STOCK_FILEはデフォルトでは"stocks_sample.json"になっています。 必ず全て取得したい場合は"stocks_all.json"へ変えて下さい

# 3. Docker起動（データ収集 → ビルド → プレビュー）

# これでpythonとフロントエンドが起動します（pythonは裏で動き続けるので、終わったらstock_list/Export以下にあるcsvを使って下さい）
docker-compose up

# # 📦 Python データ収集ビルド・実行
# docker-compose build python-service
# docker-compose run --rm python-service

# # 🌐 フロントエンドビルド・起動
# docker-compose build frontend-service
# docker-compose up frontend-service

# 4. ブラウザでアクセス(環境変数のPORT番号によります)
open http://localhost:8000
```

---

### 方法 2: ローカル環境

#### データ取得環境のセットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/yfinance-jp-screener.git
cd yfinance-jp-screener/stock_list

# 2. Python環境のセットアップ（uvを使用）
uv sync

# 3. 株式リスト取得（初回のみ）
uv run get_jp_stocklist.py

# 4. データ取得を実行
uv run sumalize.py stocks_sample.json   #ダウンロードテスト用

#===約1000社ずつダウンロード(推奨)===
# uv run sumalize.py stocks_1.json
# uv run sumalize.py stocks_2.json
# uv run sumalize.py stocks_3.json
# uv run sumalize.py stocks_4.json

#===すべての銘柄を対象にしたダウロード===
# uv run sumalize.py stocks_all.json

# 6. CSV結合
uv run combine_latest_csv.py
```

#### フロントエンド環境のセットアップ

```bash
# 1. フロントエンドディレクトリへ移動
cd ../stock_search

# 2. 依存関係をインストール
npm install

# 3. ビルド
npm run build

# 4. プレビュー
npm run preview
# おそらく　http://localhost:4173/ にアクセス

```

---

## 📋 データ取得方法を Github Actions で行う

⚠️ **重要**: **プライベートリポジトリでの使用を強く推奨します**

### 🔧 事前設定（必須）

GitHub Actions でワークフローを使用する前に、以下の設定変更が**必ず必要**です：

1. **リポジトリ設定の変更**
   - リポジトリの **Settings** → **Actions** → **General** に移動
   - **Workflow permissions** セクションで以下を設定：
     - ✅ **"Read and write permissions"** を選択
     - ✅ **"Allow GitHub Actions to create and approve pull requests"** にチェック
   - **Save** ボタンをクリック

この設定により、ワークフローが生成した CSV ファイルをリポジトリにコミットできるようになります。
設定しない場合、ワークフローは正常に実行されますが、データファイルのコミットに失敗します。

### 📊 データ取得手順

1. このリポジトリを**プライベートリポジトリとしてフォーク**します
   - パブリックリポジトリで使用すると、データの二次配布に当たる可能性があると考えられます
2. フォークしたプライベートリポジトリの **Actions** タブに移動
3. **""Stock List Update"** を実行して、リストを取得
4. **" Sequential Stock Fetch - Part 1"** を実行しデータのダウンロード（自動的に終われば次のワークフローが起動するはずです...3~4 時間ほどかかります）
5. 実行完了後、`stock_list/Export/` ディレクトリにデータファイルが生成されます

---

## 📁 生成されるファイル

実行後、`stock_list/Export/` ディレクトリに以下のファイルが生成されます：

```
Export/
├── japanese_stocks_data_1_YYYYMMDD_HHMMSS.csv  # stocks_1.json のデータ
├── japanese_stocks_data_2_YYYYMMDD_HHMMSS.csv  # stocks_2.json のデータ
├── japanese_stocks_data_3_YYYYMMDD_HHMMSS.csv  # stocks_3.json のデータ
├── japanese_stocks_data_4_YYYYMMDD_HHMMSS.csv  # stocks_4.json のデータ
└── YYYYMMDD_combined.csv                       # 結合されたデータ（オプション）
```

---

## 📚 参考/出典 / 🙏 お礼

- [yfinance GitHub Repository](https://github.com/ranaroussi/yfinance)
- [Yahoo Finance](https://finance.yahoo.com/)
- [日本取引所グループ（JPX）](https://www.jpx.co.jp/)
- [わが投資術](https://amzn.to/3IEVRkq)

※使わせていただいている JPX のデータや yfinance の作成者に感謝申し上げます。

---

## 💬 コントリビューション

このプロジェクトは個人による実験的開発です。
提案・改善・アイデアなどがあれば、**Issue または Pull Request** からぜひご連絡ください。

---

## 🧭 ライセンス

© 2025 testkun08080
Released under the [MIT License](./LICENSE)
