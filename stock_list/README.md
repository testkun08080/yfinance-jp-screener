# 📊 Stock List - データ収集パイプライン

日本株式データの自動収集・処理システム

## 概要

yfinance API を使用して、JPX（日本取引所グループ）公式データから取得した株式リストに基づき、財務データを自動収集します。

## 主要スクリプト

### 1. `get_jp_stocklist.py` - 株式リスト取得

JPX 公式エクセルデータから最新の株式リストを取得して JSON 形式で保存します。

**データソース**: https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls

**出力ファイル**: `stocks_all.json` (約 3795 社)

**使用方法**:

```bash
# 最新の株式リストを取得
python get_jp_stocklist.py

# または uv を使用
uv run get_jp_stocklist.py
```

**取得データ**:

- コード（銘柄コード）
- 銘柄名（会社名）
- 市場・商品区分（プライム/スタンダード/グロース）
- 33 業種区分

---

### 2. `split_stocks.py` - JSON ファイル分割

大きな stock_all.json を複数の小さなファイルに分割します。これにより GitHub Actions でのタイムアウトを回避できます。

**デフォルト出力**:

- `stocks_1.json` - 1-1000 社
- `stocks_2.json` - 1001-2000 社
- `stocks_3.json` - 2001-3000 社
- `stocks_4.json` - 3001-3795 社

**使用方法**:

```bash
# デフォルト設定（stocks_all.json を 1000社ずつ分割）
python split_stocks.py

# カスタム設定
python split_stocks.py --input custom_data.json --size 500 --verbose

# オプション
# --input, -i    : 入力JSONファイル（デフォルト: stocks_all.json）
# --size, -s     : チャンクサイズ（デフォルト: 1000）
# --verbose, -v  : 詳細ログ表示
```

---

### 3. `sumalize.py` - 財務データ収集

yfinance API を使用して各銘柄の財務データを収集し、CSV 形式で保存します。

**収集データ**:

- 基本情報: 会社名、銘柄コード、業種
- 市場データ: 優先市場、時価総額、決算月
- 地理情報: 都道府県、会計基準
- バリュエーション: PBR, ROE, 自己資本比率, PER(予想)
- パフォーマンス: 売上高、営業利益、営業利益率
- 収益性: 当期純利益、純利益率
- バランスシート: 負債、流動負債、流動資産
- キャッシュ分析: ネットキャッシュ、ネットキャッシュ比率

**使用方法**:

```bash
# 特定ファイルを処理
python sumalize.py stocks_1.json

# サンプルデータで動作確認
python sumalize.py stocks_sample.json

# uvを使用
uv run sumalize.py stocks_1.json
```

**出力**:

- `Export/japanese_stocks_data_1_YYYYMMDD_HHMMSS.csv`

**処理時間**: 約 1000 社で 1-2 時間（yfinance API 制限による）

**エラーハンドリング**:

- API 制限によるタイムアウト時の自動リトライ
- データ取得失敗時のスキップ
- 詳細なログ出力

---

### 4. `combine_latest_csv.py` - CSV 結合

複数の japanese*stocks_data*\*.csv ファイルを 1 つの統合 CSV ファイルに結合します。

**使用方法**:

```bash
# 最新のCSVファイルを自動検出して結合
python combine_latest_csv.py

# カスタム日付を指定
python combine_latest_csv.py --date 20251006

# uvを使用
uv run combine_latest_csv.py
```

**出力**:

- `Export/YYYYMMDD_combined.csv`

**処理**:

1. Export/ディレクトリ内の全 CSV ファイルを検索
2. ヘッダーを統一
3. データを結合
4. 重複を削除
5. 日付付きファイル名で保存

---

## データフロー

```
1. get_jp_stocklist.py → stocks_all.json (3795社)
                          ↓
2. split_stocks.py → stocks_1.json (1000社)
                  → stocks_2.json (1000社)
                  → stocks_3.json (1000社)
                  → stocks_4.json (795社)
                          ↓
3. sumalize.py → Export/japanese_stocks_data_1_*.csv
              → Export/japanese_stocks_data_2_*.csv
              → Export/japanese_stocks_data_3_*.csv
              → Export/japanese_stocks_data_4_*.csv
                          ↓
4. combine_latest_csv.py → Export/YYYYMMDD_combined.csv
```

---

## GitHub Actions 連携

このディレクトリのスクリプトは、`.github/workflows/`のワークフローから自動実行されます。

### Sequential Stock Fetch（順次実行）

- Part 1 から開始し、stocks_*.json / us_stocks_*.json の数に応じて Part 2, 3, … が自動連鎖（各パート約 1000 社ずつ）
- 各パート完了後に自動的に次のパートをトリガー
- 全パート完了後に CSV 結合を自動実行

### 手動実行

- **Stock Data Fetch**: 単一ファイルを手動で処理
- **Stock List Update**: 株式リストの更新と分割を実行

---

## セットアップ

### 必要要件

- Python 3.11+
- 依存ライブラリ: pandas, yfinance, requests, openpyxl

### インストール

```bash
# uvを使用（推奨）
cd stock_list
uv venv -p 3.11
uv pip install -r requirements.txt

# または標準pip
pip install -r requirements.txt
```

---

## 出力ディレクトリ

### `Export/`

生成された CSV ファイルの保存先。Git では管理されません（.gitignore に追加推奨）。

**ファイル命名規則**:

- 個別ファイル: `japanese_stocks_data_N_YYYYMMDD_HHMMSS.csv`
- 結合ファイル: `YYYYMMDD_combined.csv`

---

## トラブルシューティング

### タイムアウトエラー

```bash
# GitHub Actionsで120分タイムアウトする場合
# → Sequential実行を使用（自動で4分割）
```

### API Rate Limit

```bash
# yfinance APIの制限に達した場合
# → 時間をおいて再実行
# → sumalize.pyのretry設定を調整
```

### データ欠損

```bash
# 一部データが取得できない場合
# → ログを確認してエラー原因を特定
# → 該当銘柄を手動で再実行
```

---

## Web アプリケーションでの利用

収集した CSV データは、`../stock_search`の React Web アプリケーションで可視化できます。

### データの読み込み方法

**ドラッグ&ドロップ方式（推奨）**:

1. Web アプリケーションを起動（`cd ../stock_search && npm run dev`）
2. ブラウザで http://localhost:5173 にアクセス
3. `Export/YYYYMMDD_combined.csv` ファイルをドラッグ&ドロップ
4. データが即座に表示・フィルタリング可能

---

## 注意事項

⚠️ **データの取り扱い**

- 取得したデータは個人利用目的のみで使用してください
- Yahoo Finance データの二次配布は禁止されています
- yfinance ライブラリは Apache License 2.0 です
- データの正確性は保証されません

⚠️ **API 制限**

- yfinance API には暗黙的なレート制限があります
- 大量データ取得時は時間がかかります（1 社あたり 3-5 秒）
- タイムアウトを避けるため、Sequential 実行を推奨

---

## 参考

- [yfinance GitHub](https://github.com/ranaroussi/yfinance)
- [JPX 公式データ](https://www.jpx.co.jp/)
- [わが投資術](https://amzn.to/3IEVRkq)
