"""
JPX公式データから日本株式リストを取得するスクリプト

JPX（日本取引所グループ）の公式ウェブサイトから、
上場企業の最新株式リストをダウンロードし、JSON形式で保存します。

主な機能:
- JPX公式サイトからExcelファイル(.xls)を自動ダウンロード
- .xls形式を.xlsx形式に変換（pandas互換性のため）
- プライム、スタンダード、グロース市場の株式を抽出
- JSON形式でstocks_all.jsonに保存

対象市場:
- プライム（内国株式）
- スタンダード（内国株式）
- グロース（内国株式）

出力データ項目:
- コード: 株式コード（例: 7203）
- 銘柄名: 会社名（例: トヨタ自動車）
- 市場・商品区分: 上場市場区分
- 33業種区分: 業種分類

使用例:
    $ python get_jp_stocklist.py

出力ファイル:
    - stocks_all.json: 全上場企業のJSONリスト（~3795社）
    - tickers.xls: ダウンロードされた元データ（一時ファイル）
    - converted.xlsx: 変換後のExcelファイル（一時ファイル）

依存関係:
    - requests: ファイルダウンロード
    - pandas: データ処理
    - xlrd: .xls読み込み
    - openpyxl: .xlsx書き込み
"""

import requests
import pandas as pd
import xlrd
from openpyxl import Workbook
import json
import logging

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# ファイルのURL
url = "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls"

# ファイルをダウンロード
response = requests.get(url)

# ダウンロードしたファイルを一時的なファイルに保存
xls_file = "tickers.xls"
with open(xls_file, "wb") as f:
    f.write(response.content)

# .xlsファイルを .xlsx に変換
xlsx_file = "converted.xlsx"
workbook_xls = xlrd.open_workbook(xls_file)
sheet_xls = workbook_xls.sheet_by_index(0)

workbook_xlsx = Workbook()
sheet_xlsx = workbook_xlsx.active

# データを .xls から .xlsx に書き込む
for row in range(sheet_xls.nrows):
    for col in range(sheet_xls.ncols):
        sheet_xlsx.cell(row=row + 1, column=col + 1).value = sheet_xls.cell_value(row, col)

# .xlsx ファイルを保存
workbook_xlsx.save(xlsx_file)

# 変換された .xlsx ファイルを読み込む
data = pd.read_excel(xlsx_file)

# OR条件を使用して条件に一致する行を抽出
condition = (
    (data["市場・商品区分"] == "プライム（内国株式）")
    | (data["市場・商品区分"] == "スタンダード（内国株式）")
    | (data["市場・商品区分"] == "グロース（内国株式）")
)

filtered_df = data[condition]

# 必要な列だけを抽出
selected_df = filtered_df[["コード", "銘柄名", "市場・商品区分", "33業種区分"]]

# DataFrame を JSON 形式（リストの辞書形式）に変換
json_list = selected_df.to_dict(orient="records")

# JSONファイルに保存
with open("stocks_all.json", "w", encoding="utf-8") as f:
    json.dump(json_list, f, ensure_ascii=False, indent=2)

logger.info("JSONファイルに保存しました: stocks_all.json")
