# 📊 yfinance × 日本株式スクリーニング  
**（with わが投資術）**

---

## ⚠️ 注意事項

このプロジェクトは **Yahoo Finance のデータを取得・可視化するためのツール**です。  
本ツールの利用により生じたいかなる損害についても、作者は一切の責任を負いません。

- **データの利用は Yahoo の利用規約に従ってください**  
- **本リポジトリはデータそのものを配布しません**  
- **個人利用・研究・教育目的のみ使用可**  
- **商用利用・再配布は禁止です**  
- **プライベートリポジトリでの使用を推奨します**

> 💡 取得したデータは、**ご自身の環境でのみ利用**してください。

---

## 📘 概要

[わが投資術](https://amzn.to/3IEVRkq) の考え方をもとに、  
**日本株をシンプルに分析・可視化**するためのツールです。

- 📈 GitHub Actions による自動データ収集  
- 🔍 Web上でのスクリーニング・可視化  
- ⚙️ JPX公式データ対応・簡易データ分割機能  

---

## 💡 開発の目的

日本株に興味を持ち、
日本をよくしている企業を見つけたい、
けど、割安株を見つけてみたい。
という思いと、わが投資術を参考にして作成した、**個人開発による実験的プロジェクト**です。

---

## 🧾 免責事項

動作・結果・データの正確性を保証するものではありません。  
利用はすべて **自己責任** でお願いいたします。

---

## 🛠️ 技術概要

| 項目 | 内容 |
|------|------|
| **Backend** | Python 3.11+, pandas, yfinance |
| **Frontend** | React 19 + TypeScript + Vite |
| **CI/CD** | GitHub Actions + Docker |
| **スタイル** | Tailwind CSS, DaisyUI |
| **データ形式** | CSV, JSON |

---

## 🚀 セットアップガイド

### 方法1: Docker Compose（推奨・最速）データ収集とインターフェイス

一つのコマンドでデータ収集からWebアプリ起動まで完結

**データ収集時間:**
約3700社のデータをダウンロードするにはおよそ3~４時間ほどかかります

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/yfinance-jp-screener.git
cd yfinance-jp-screener

# 2. 環境変数を設定（オプション）
cp .env.example .env
# .envを編集して処理対象ファイルを変更可能

# 3. Docker起動（データ収集 → ビルド → プレビュー）
./scripts/start.sh --build

# 4. ブラウザでアクセス
# http://localhost:4173
```
---

### 方法2: ローカル環境

#### データ取得環境のセットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/yfinance-jp-screener.git
cd yfinance-jp-screener/stock_list

# 2. Python環境のセットアップ（uvを使用）
uv venv -p 3.11

# 3. 依存関係をインストール
uv pip install -r requirements.txt

# 4. 株式リスト取得（初回のみ）
uv run get_jp_stocklist.py 

# 5. データ取得を実行
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
cd stock_search

# 2. 依存関係をインストール
npm install

# 3. ビルド（ビルドしないとcsvが正常にpublicへコピーされません）
npm run build

# 4. プレビュー
npm run preview
# http://localhost:4173/ にアクセス

```

---

## 📋 データ取得方法を Github Actionsで行う

⚠️ **重要**: **プライベートリポジトリでの使用を強く推奨します**

1. このリポジトリを**プライベートリポジトリとしてフォーク**します
   - パブリックリポジトリで使用すると、データの二次配布に当たる可能性があると考えられます
2. フォークしたプライベートリポジトリの **Actions** タブに移動
3. **"📊 Stock Data Fetch"** ワークフローを選択
4. **"Run workflow"** をクリック
5. 処理対象の株式ファイルを選択（stocks_1.json ～ stocks_4.json）
6. 実行完了後、`stock_list/Export/` ディレクトリにデータファイルが生成されます

**重要事項**:

- GitHub Actionsで生成されたデータは、**あなたのプライベートリポジトリ内でのみ**保持してください
- データファイルを含むリポジトリを公開しないでください
- ローカル環境での使用が最も安全です


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

※使わせていただいているJPXのデータやyfinanceの作成者に感謝申し上げます。

---

## 💬 コントリビューション

このプロジェクトは個人による実験的開発です。
提案・改善・アイデアなどがあれば、**Issue または Pull Request** からぜひご連絡ください。

---

## 🧭 ライセンス
© 2025 testkun08080
Released under the [MIT License](./LICENSE)
