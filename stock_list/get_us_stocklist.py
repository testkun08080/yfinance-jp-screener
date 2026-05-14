"""
米国株式リスト取得スクリプト

SECの公開データから米国上場企業リストを取得し、JSON形式で保存します。

主な機能:
- SECのcompany_tickers.jsonからティッカーシンボルを取得
- yfinanceを使用して各銘柄の詳細情報を取得
- 市場区分（NYSE, NASDAQ, AMEX）の判定
- JSON形式でus_stocks_all.jsonに保存

対象市場:
- SECに登録されている全米国上場企業

出力データ項目:
- コード: ティッカーシンボル（例: "AAPL"）
- 銘柄名: 会社名（例: "Apple Inc."）
- 市場・商品区分: 市場区分（NYSE, NASDAQ, AMEX）
- 33業種区分: 業種分類（Sector）
- 市場タイプ: "US"

使用例:
    $ python get_us_stocklist.py

出力ファイル:
    - us_stocks_all.json: 全米国上場企業のJSONリスト

依存関係:
    - requests: API通信
    - yfinance: 株式情報取得

注意:
    - SECのAPIを使用するため、User-Agentヘッダーに連絡先を含める必要があります
    - 大量のデータを取得するため、実行に時間がかかります
"""

import json
import logging
import os
import time
import requests
import yfinance as yf
from typing import List, Dict, Optional

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def get_us_ticker_list() -> List[str]:
    """SECの公開データから米国上場企業のティッカーシンボルリストを取得

    Returns:
        List[str]: 米国上場企業のティッカーシンボルのリスト

    Note:
        - SECのcompany_tickers.jsonからティッカーシンボルを取得
        - User-Agentヘッダーに連絡先を含める必要がある
        - 連絡先は環境変数 SEC_USER_AGENT_CONTACT から読み込む
        - 環境変数が設定されていない場合はデフォルト値を使用
    """
    try:
        url = "https://www.sec.gov/files/company_tickers.json"
        # SECのAPI使用規約に従い、User-Agentに連絡先を含める
        # 環境変数から連絡先を取得（uvで設定された環境変数またはシステム環境変数）
        # 空文字は未設定扱い（GHA で secret 未設定だと "" が渡る）
        contact_email = (
            os.getenv("SEC_USER_AGENT_CONTACT") or ""
        ).strip() or "your@email.com"
        if contact_email == "your@email.com":
            logger.warning(
                "⚠️  SEC_USER_AGENT_CONTACT が未設定です。SEC が 403 を返す場合があります。"
                "GitHub Actions: リポジトリ Settings → Secrets → SEC_USER_AGENT_CONTACT にメールアドレスを追加してください。"
            )
        headers = {
            "User-Agent": f"yfinance-jp-screener (contact: {contact_email})",
            "Accept-Encoding": "gzip, deflate",
            "Host": "www.sec.gov",
        }

        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()

        # ティッカーシンボルのリストを抽出
        tickers = []
        for value in data.values():
            ticker = value.get("ticker", "").strip()
            if ticker:
                tickers.append(ticker)

        # 重複を除去してソート
        tickers = sorted(list(set(tickers)))

        logger.info(f"SECからティッカーリストを取得: {len(tickers)}社")
        return tickers
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 403:
            logger.error(
                "SEC が 403 Forbidden を返しました。User-Agent の連絡先が必須です。"
                "GitHub Actions の場合: リポジトリの Settings → Secrets and variables → Actions で "
                "SEC_USER_AGENT_CONTACT にあなたのメールアドレスを追加してください。"
            )
        else:
            logger.error(f"SECからのティッカーリスト取得に失敗: {e}")
        return []
    except Exception as e:
        logger.error(f"SECからのティッカーリスト取得に失敗: {e}")
        return []


def get_stock_info(ticker: str) -> Optional[Dict[str, str]]:
    """yfinanceを使用して銘柄情報を取得

    Args:
        ticker (str): ティッカーシンボル（例: "AAPL"）

    Returns:
        Optional[Dict[str, str]]: 銘柄情報辞書
            - コード: ティッカーシンボル
            - 銘柄名: 会社名
            - 市場・商品区分: 市場区分（NYSE, NASDAQ, AMEX）
            - 33業種区分: 業種（Sector）
            - 市場タイプ: "US"
        None: 取得失敗時

    Note:
        - API制限を避けるため、0.5秒のスリープを実施
        - エラー時はNoneを返す
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info:
            logger.warning(f"  ⚠️ 情報が取得できませんでした: {ticker}")
            return None

        # 市場区分を取得
        exchange = info.get("exchange", "").upper()
        market = ""
        if "NASDAQ" in exchange:
            market = "NASDAQ"
        elif "NYSE" in exchange or "NYSEARCA" in exchange:
            market = "NYSE"
        elif "AMEX" in exchange or "AMERICAN" in exchange:
            market = "AMEX"
        else:
            # デフォルトはNASDAQ
            market = "NASDAQ"

        # 業種を取得
        sector = info.get("sector", "") or info.get("industry", "") or "Unknown"

        result = {
            "コード": ticker,
            "銘柄名": info.get("longName", "") or info.get("shortName", "") or ticker,
            "市場・商品区分": market,
            "33業種区分": sector,
            "市場タイプ": "US",
        }

        logger.debug(f"  ✅ {ticker}: {result['銘柄名']} ({market})")
        return result

    except Exception as e:
        logger.warning(f"  ⚠️ {ticker}の情報取得に失敗: {e}")
        return None


def main():
    """メイン処理

    SECの公開データからティッカーリストを取得し、各銘柄の詳細情報を収集してJSONファイルに保存します。
    """
    logger.info("=" * 60)
    logger.info("🚀 米国株リスト取得プロセス開始")
    logger.info("=" * 60)

    # SECからティッカーリストを取得
    tickers = get_us_ticker_list()

    if not tickers:
        logger.error("❌ SECからのティッカーリスト取得に失敗しました")
        return

    logger.info(f"取得対象: {len(tickers)}社")
    logger.info("⚠️  注意: 大量のデータを取得するため、実行に時間がかかります")
    logger.info("-" * 60)

    # 各銘柄の情報を取得
    stock_list = []
    success_count = 0
    fail_count = 0

    for i, ticker in enumerate(tickers, 1):
        if i % 100 == 0:
            logger.info(
                f"[{i}/{len(tickers)}] 進捗: {i}/{len(tickers)} (成功: {success_count}, 失敗: {fail_count})"
            )
        else:
            logger.debug(f"[{i}/{len(tickers)}] 処理中: {ticker}")

        stock_info = get_stock_info(ticker)
        if stock_info:
            stock_list.append(stock_info)
            success_count += 1
        else:
            fail_count += 1

        # API制限を避けるため、少し待機
        if i < len(tickers):
            time.sleep(0.5)

    logger.info("-" * 60)
    logger.info(f"取得成功: {success_count}社")
    logger.info(f"取得失敗: {fail_count}社")

    # JSONファイルに保存
    output_file = "us_stocks_all.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(stock_list, f, ensure_ascii=False, indent=2)

    logger.info("=" * 60)
    logger.info(f"✅ JSONファイルに保存しました: {output_file}")
    logger.info(f"   総企業数: {len(stock_list)}社")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
