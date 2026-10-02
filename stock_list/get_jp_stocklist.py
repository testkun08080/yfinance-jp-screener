"""
JPX公式データから日本株式リストを取得するスクリプト

JPX（日本取引所グループ）の公式ウェブサイトから、
上場企業の最新株式リストをダウンロードし、JSON形式で保存します。

主な機能:
- JPX「東証上場銘柄一覧」ページからExcelファイルのリンクを自動検出
  （2026年に .xls → .xlsx へ移行したため、拡張子は固定しない）
- ダウンロード結果を検証（HTTPステータス・ファイル形式）
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
    - stocks_all.json: 全上場企業のJSONリスト（~3700社）

依存関係:
    - requests: ファイルダウンロード
    - pandas: データ処理
    - openpyxl: .xlsx読み込み
    - xlrd: .xls読み込み（旧形式へのフォールバック用）
"""

import io
import json
import logging
import re
import sys
from urllib.parse import urljoin

import pandas as pd
import requests

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# 東証上場銘柄一覧ページ（ここからExcelのリンクを検出する）
JPX_LIST_PAGE_URL = "https://www.jpx.co.jp/markets/statistics-equities/misc/01.html"
# リンク検出に失敗した場合のフォールバック
JPX_FALLBACK_URL = "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xlsx"

REQUEST_TIMEOUT = 60
OUTPUT_FILE = "stocks_all.json"

TARGET_MARKETS = [
    "プライム（内国株式）",
    "スタンダード（内国株式）",
    "グロース（内国株式）",
]
SELECTED_COLUMNS = ["コード", "銘柄名", "市場・商品区分", "33業種区分"]

# Excelファイルのマジックバイト
XLSX_MAGIC = b"PK\x03\x04"  # zip (Office Open XML)
XLS_MAGIC = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"  # OLE2 (BIFF)


def find_excel_url() -> str:
    """一覧ページから data_j.xlsx / data_j.xls のURLを検出する"""
    try:
        response = requests.get(JPX_LIST_PAGE_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        match = re.search(r'href="([^"]*data_j\.xlsx?)"', response.text)
        if match:
            return urljoin(JPX_LIST_PAGE_URL, match.group(1))
        logger.warning("一覧ページにExcelリンクが見つかりません。フォールバックURLを使用します")
    except requests.RequestException as e:
        logger.warning(f"一覧ページの取得に失敗しました（フォールバックURLを使用）: {e}")
    return JPX_FALLBACK_URL


def download_excel(url: str) -> pd.DataFrame:
    """Excelファイルをダウンロードし、形式を検証してDataFrameとして返す"""
    logger.info(f"ダウンロード中: {url}")
    response = requests.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()

    content = response.content
    if content.startswith(XLSX_MAGIC):
        engine = "openpyxl"
    elif content.startswith(XLS_MAGIC):
        engine = "xlrd"
    else:
        raise ValueError(
            "Excelファイルではありません "
            f"(Content-Type: {response.headers.get('Content-Type')}, 先頭: {content[:16]!r})"
        )

    return pd.read_excel(io.BytesIO(content), engine=engine)


def main() -> int:
    try:
        data = download_excel(find_excel_url())
    except Exception as e:
        logger.error(f"❌ 株式リストの取得に失敗しました: {e}")
        return 1

    missing = [c for c in SELECTED_COLUMNS if c not in data.columns]
    if missing:
        logger.error(f"❌ 想定したカラムがありません: {missing} (実際: {list(data.columns)})")
        return 1

    selected_df = data[data["市場・商品区分"].isin(TARGET_MARKETS)][SELECTED_COLUMNS]
    if selected_df.empty:
        logger.error("❌ 対象市場の銘柄が0件でした")
        return 1

    json_list = selected_df.to_dict(orient="records")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(json_list, f, ensure_ascii=False, indent=2)

    logger.info(f"JSONファイルに保存しました: {OUTPUT_FILE} ({len(json_list)}社)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
