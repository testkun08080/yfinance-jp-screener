"""
日本株式財務データ収集スクリプト

yfinance APIを使用して日本株式市場の財務データを自動収集し、CSV形式で保存します。

主な機能:
- yfinance APIによる株式財務データの取得
- 郵便番号から都道府県名の自動取得（digital-address API使用）
- 財務諸表データの安全な取得とフォールバック機能
- ネットキャッシュ比率の自動計算
- タイムスタンプ付きCSVファイルの自動生成
- 詳細なログ出力とエラーハンドリング

使用例:
    $ python sumalize.py                    # stocks_sample.jsonを処理（デフォルト）
    $ python sumalize.py stocks_1.json     # stocks_1.jsonを処理
    $ python sumalize.py --json stocks_2.json  # stocks_2.jsonを処理

依存関係:
    - yfinance: 株式データ取得
    - pandas: データ処理
    - requests: API通信
"""

import yfinance as yf
import pandas as pd
import json
import time
import argparse
from datetime import datetime
import warnings
import logging
import requests
import sys
import os

# utilsモジュールをインポート（同じディレクトリから）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import detect_market_type, format_ticker_for_market


warnings.filterwarnings("ignore")

# ログ設定
# Exportフォルダが存在しない場合は作成
import os

os.makedirs("Export", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("Export/stock_data_log.txt", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def get_prefecture_from_zip(zip_code):
    """郵便番号から都道府県名を取得（digital-address API使用）

    Args:
        zip_code (str): 郵便番号（ハイフンあり/なし両方対応）

    Returns:
        str: 都道府県名（例: "東京都", "大阪府"）
        None: 取得失敗時またはデータなし

    Note:
        - digital-address APIを使用してリアルタイム取得
        - 郵便番号の前処理（ハイフン・空白除去）を自動実行
        - タイムアウト設定: 10秒
    """
    try:
        if not zip_code:
            return None

        # 郵便番号の前処理（ハイフンや空白を除去）
        clean_zip = str(zip_code).replace("-", "").replace("−", "").replace(" ", "").replace("　", "")

        if len(clean_zip) < 7:  # 郵便番号として短すぎる場合
            return None

        # digital-address APIにリクエスト
        url = f"https://digital-address.app/{clean_zip}"

        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        if data.get("addresses") and len(data["addresses"]) > 0:
            # addressesの最初の要素からpref_nameを取得
            address = data["addresses"][0]
            prefecture = address.get("pref_name")
            logger.debug(f"  🏢 都道府県: {prefecture}")
            return prefecture

        return None

    except Exception as e:
        logger.debug(f"    郵便番号変換エラー ({zip_code}): {e}")
        return None


def format_duration(seconds):
    """秒数を読みやすい形式に変換

    Args:
        seconds (float): 秒数

    Returns:
        str: 読みやすい時間表示
            - 60秒未満: "X.X秒"
            - 60秒以上: "X分Y.Y秒"
            - 3600秒以上: "X時間Y分Z.Z秒"

    Examples:
        >>> format_duration(45.5)
        '45.5秒'
        >>> format_duration(125.3)
        '2分5.3秒'
        >>> format_duration(3725.8)
        '1時間2分5.8秒'
    """
    if seconds < 60:
        return f"{seconds:.1f}秒"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        remaining_seconds = seconds % 60
        return f"{minutes}分{remaining_seconds:.1f}秒"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        remaining_seconds = seconds % 60
        return f"{hours}時間{minutes}分{remaining_seconds:.1f}秒"


def format_ticker(code, market_type=None):
    """銘柄コードをyfinance用の形式に変換

    Args:
        code (str or int): 銘柄コード（数値または英数字混合）
        market_type (str, optional): 市場タイプ（"JP" または "US"）
            - 未指定の場合はティッカー形式から自動判定

    Returns:
        str: yfinance用のティッカーシンボル（例: "7203.T", "AAPL"）

    Examples:
        >>> format_ticker(7203)
        '7203.T'
        >>> format_ticker("130A")
        '130A.T'
        >>> format_ticker("AAPL", "US")
        'AAPL'
        >>> format_ticker("AAPL")
        'AAPL'

    Note:
        - 市場タイプが未指定の場合、ティッカー形式から自動判定
        - 日本株: 数値コードは4桁にゼロパディング、すべてのコードに".T"を付加
        - 米国株: そのまま返す
    """
    code_str = str(code).strip()

    # 市場タイプが未指定の場合、自動判定
    if market_type is None:
        market_type = detect_market_type(code_str)

    # 市場タイプに応じた形式を生成
    return format_ticker_for_market(code_str, market_type)


def safe_get_value(data, key, default=None):
    """安全にデータを取得（KeyErrorを回避）

    Args:
        data (dict or object): データソース（辞書またはget()メソッドを持つオブジェクト）
        key (str): 取得するキー
        default: キーが存在しない場合のデフォルト値（デフォルト: None）

    Returns:
        取得した値、またはdefault値

    Note:
        - KeyError, AttributeErrorを安全にキャッチ
        - 辞書、yfinanceのinfoオブジェクトなど様々なデータ型に対応
    """
    try:
        if isinstance(data, dict):
            return data.get(key, default)
        elif hasattr(data, "get"):
            return data.get(key, default)
        else:
            return default
    except:
        return default


def safe_get_financial_data(ticker, statement_type, item, fallback_items=None):
    """財務諸表から安全にデータを取得（フォールバック機能付き）

    Args:
        ticker (yfinance.Ticker): yfinanceのTickerオブジェクト
        statement_type (str): 財務諸表タイプ（"financials" または "balance_sheet"）
        item (str): 取得する項目名（例: "Total Revenue", "Total Assets"）
        fallback_items (list, optional): メイン項目が存在しない場合の代替項目リスト

    Returns:
        float: 取得した財務データ値
        None: データが存在しない、またはエラー時

    Note:
        - 最新決算期（最初の列）のデータを自動取得
        - フォールバック機能により複数の項目名に対応
        - データが空の場合や存在しない場合は安全にNoneを返す

    Examples:
        >>> safe_get_financial_data(ticker, "financials", "Total Revenue")
        1234567890.0
        >>> safe_get_financial_data(ticker, "balance_sheet", "Total Liabilities Net Minority Interest",
        ...                          fallback_items=["Total Liab"])
        9876543210.0
    """
    try:
        if statement_type == "financials":
            data = ticker.financials
        elif statement_type == "balance_sheet":
            data = ticker.balance_sheet
        else:
            return None

        if data.empty:
            return None

        # 決算期の列を確認し、最新の決算データ（最初の列）を取得
        cols = data.columns.tolist()
        if len(cols) == 0:
            return None

        latest_period = cols[0]  # 最新の決算期

        # メイン項目をチェック
        if item in data.index:
            value = data.loc[item, latest_period]
            return value if pd.notna(value) else None

        # フォールバック項目をチェック
        if fallback_items:
            for fallback_item in fallback_items:
                if fallback_item in data.index:
                    value = data.loc[fallback_item, latest_period]
                    return value if pd.notna(value) else None

        return None
    except Exception as e:
        logger.debug(f"    データ取得エラー ({item}): {e}")
        return None


def calculate_net_cash(current_assets, investments, total_liabilities):
    """ネットキャッシュを計算: 流動資産 + 投資有価証券×70% - 負債

    Args:
        current_assets (float): 流動資産
        investments (float): 投資有価証券
        total_liabilities (float): 総負債

    Returns:
        float: ネットキャッシュ額
        None: 必須データが不足している場合

    Note:
        - 投資有価証券は70%で評価（保守的な見積もり）
        - 流動資産と総負債は必須、投資有価証券はオプション
        - ネットキャッシュ = 流動資産 + (投資有価証券 × 0.7) - 総負債

    Examples:
        >>> calculate_net_cash(10000000, 5000000, 3000000)
        10500000.0
        >>> calculate_net_cash(10000000, None, 3000000)
        7000000.0
    """
    try:
        if current_assets is not None and total_liabilities is not None:
            inv_value = (investments * 0.7) if investments is not None else 0
            return current_assets + inv_value - total_liabilities
        return None
    except:
        return None


def calculate_previous_year_per(ticker, financials):
    """前年度のPERとEPSを計算

    Args:
        ticker (yfinance.Ticker): yfinanceのTickerオブジェクト
        financials (pd.DataFrame): 年度別損益計算書

    Returns:
        tuple: (前年度のPER, 前年度のEPS) のタプル
        None: データが不足している場合

    Note:
        - 最新年度（financials.columns[0]）の次の年度を前年度として使用
        - 前年度のNet IncomeとDiluted Average SharesからEPSを計算
        - 前年度末の株価を取得してPERを計算
        - ハードコードを避けるため、動的に前年度を取得

    Examples:
        >>> result = calculate_previous_year_per(ticker, financials)
        >>> if result:
        ...     per, eps = result
        ...     print(f"PER: {per}, EPS: {eps}")
    """
    try:
        if financials.empty:
            return None

        # 年度の列を取得（最新年度が最初、前年度が2番目）
        cols = financials.columns.tolist()
        if len(cols) < 2:
            # 前年度のデータが存在しない場合
            return None

        # 前年度の決算期を取得（2番目の列）
        previous_year_period = cols[1]

        # 前年度のNet Incomeを取得
        net_income_key = "Net Income"
        if net_income_key not in financials.index:
            return None

        net_income_last_year = financials.loc[net_income_key, previous_year_period]
        if pd.isna(net_income_last_year) or net_income_last_year == 0:
            return None

        # 前年度のDiluted Average Sharesを取得
        shares_key = "Diluted Average Shares"
        if shares_key not in financials.index:
            return None

        shares_last_year = financials.loc[shares_key, previous_year_period]
        if pd.isna(shares_last_year) or shares_last_year == 0:
            return None

        # 前年度EPSを計算
        eps_last_year = net_income_last_year / shares_last_year

        # 前年度末の日付を取得（決算期の日付から）
        if hasattr(previous_year_period, "to_pydatetime"):
            previous_year_date = previous_year_period.to_pydatetime()
        elif hasattr(previous_year_period, "strftime"):
            # datetimeオブジェクトの場合
            previous_year_date = previous_year_period
        else:
            # 文字列の場合、パースを試みる
            try:
                previous_year_date = pd.to_datetime(previous_year_period).to_pydatetime()
            except:
                return None

        # 前年度末の株価を取得（決算期の前後数日で取得）
        from datetime import timedelta

        start_date = previous_year_date - timedelta(days=3)
        end_date = previous_year_date + timedelta(days=3)

        try:
            price_history = ticker.history(start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
            if price_history.empty:
                return None

            # 決算期に最も近い日付のClose価格を取得
            price_last_year = price_history["Close"].iloc[0]
            if pd.isna(price_last_year) or price_last_year == 0:
                return None
        except Exception as e:
            logger.debug(f"    前年度株価取得エラー: {e}")
            return None

        # 前年度PERを計算
        per_last_year = price_last_year / eps_last_year

        return (per_last_year, eps_last_year)

    except Exception as e:
        logger.debug(f"    前年度PER計算エラー: {e}")
        return None


def get_stock_data(stock_info):
    """個別銘柄の財務データを取得

    Args:
        stock_info (dict): 株式情報（コード、銘柄名、業種など）
            - 必須キー: "コード", "銘柄名"
            - オプションキー: "市場・商品区分", "33業種区分", "市場タイプ"

    Returns:
        dict: 財務データ辞書（以下の項目を含む）
            - 基本情報: 会社名、銘柄コード、業種、優先市場、決算月、都道府県（日本株のみ）、市場タイプ
            - 市場データ: 時価総額、PBR、PER(会予)
            - 収益性: 売上高、営業利益、営業利益率、当期純利益、純利益率、ROE
            - 財務健全性: 自己資本比率、負債、流動負債、流動資産、総負債
            - キャッシュ: 現金及び現金同等物、投資有価証券、ネットキャッシュ、ネットキャッシュ比率
        None: データ取得失敗時

    Note:
        - yfinance APIを使用してリアルタイムデータ取得
        - API制限回避のため0.5秒のスリープを実施
        - 日本株の場合のみ郵便番号から都道府県を自動取得
        - 市場タイプが未指定の場合、ティッカー形式から自動判定
        - 詳細なログ出力（開始時刻、終了時刻、実行時間）
        - エラー時も詳細なログを記録

    Examples:
        >>> stock_info = {"コード": 7203, "銘柄名": "トヨタ自動車"}
        >>> data = get_stock_data(stock_info)
        >>> data['会社名']
        'トヨタ自動車'
        >>> stock_info_us = {"コード": "AAPL", "銘柄名": "Apple Inc.", "市場タイプ": "US"}
        >>> data_us = get_stock_data(stock_info_us)
        >>> data_us['市場タイプ']
        'US'
    """
    code = stock_info["コード"]
    
    # 市場タイプを取得（stock_infoから、または自動判定）
    market_type = stock_info.get("市場タイプ")
    if market_type is None:
        market_type = detect_market_type(str(code))
    
    ticker_symbol = format_ticker(code, market_type)

    start_time = time.time()
    start_datetime = datetime.now()

    logger.info(f"取得中: {stock_info['銘柄名']} ({ticker_symbol})")
    logger.debug(
        f"データ取得開始: {stock_info['銘柄名']} ({ticker_symbol}) - 開始時刻: {start_datetime.strftime('%Y-%m-%d %H:%M:%S')}"
    )

    try:
        # yfinanceでティッカー作成
        ticker = yf.Ticker(ticker_symbol)

        # 基本情報取得
        info = ticker.info
        if not info:
            logger.warning(f"  ⚠️ 基本情報が取得できませんでした: {ticker_symbol}")
            return None

        # 時間を置いてAPIレート制限を回避
        time.sleep(0.5)

        # 財務諸表データ取得
        try:
            financials = ticker.financials
            balance_sheet = ticker.balance_sheet
        except Exception as e:
            logger.warning(f"  ⚠️ 財務諸表取得エラー: {e}")
            financials = pd.DataFrame()
            balance_sheet = pd.DataFrame()

        # 決算月を取得（バランスシートの最新期から）
        settlement_period = None
        if not balance_sheet.empty:
            cols = balance_sheet.columns.tolist()
            if cols:
                # 最新決算期から日付部分のみ抽出（例：2025-03-31）
                latest_period = cols[0]
                if hasattr(latest_period, "strftime"):
                    # datetimeオブジェクトの場合、日付部分のみ取得
                    settlement_period = latest_period.strftime("%Y-%m-%d")
                else:
                    # 文字列の場合、時間部分を削除
                    settlement_period = str(latest_period).split(" ")[0]

        # PER(会予)のデバッグ
        forward_pe = info.get("forwardPE", None)

        # 配当方向性（payoutRatio）- 生データをそのまま保存（小数、例: 0.3 = 30%）
        dividend_direction = safe_get_value(info, "payoutRatio")

        # 配当利回り（trailingAnnualDividendYield）- 生データをそのまま保存（小数、例: 0.03 = 3%）
        dividend_yield = safe_get_value(info, "trailingAnnualDividendYield")

        # PER（trailingPE）- 過去12ヶ月分を考慮したもの
        trailing_pe = safe_get_value(info, "trailingPE")

        # EPS関連データ
        trailing_eps = safe_get_value(info, "trailingEps")  # 過去12ヶ月のEPS
        forward_eps = safe_get_value(info, "forwardEps")  # 予想EPS

        # 前年度PERとEPSを計算
        previous_year_pe = None
        previous_year_eps = None
        if not financials.empty:
            previous_year_data = calculate_previous_year_per(ticker, financials)
            if previous_year_data:
                previous_year_pe, previous_year_eps = previous_year_data

        # 市場区分のマッピング（米国株の場合）
        market = stock_info.get("市場・商品区分", "")
        if market_type == "US":
            # 米国株の場合、市場区分をそのまま使用（NYSE, NASDAQ, AMEXなど）
            if not market:
                # infoから取得を試みる
                exchange = safe_get_value(info, "exchange", "").upper()
                if "NASDAQ" in exchange:
                    market = "NASDAQ"
                elif "NYSE" in exchange or "NYSEARCA" in exchange:
                    market = "NYSE"
                elif "AMEX" in exchange or "AMERICAN" in exchange:
                    market = "AMEX"
                else:
                    market = market or "NASDAQ"  # デフォルト

        # データ収集
        result = {
            "会社名": stock_info["銘柄名"] or safe_get_value(info, "longName") or safe_get_value(info, "shortName"),
            "銘柄コード": code,
            "業種": stock_info.get("33業種区分") or safe_get_value(info, "industry") or safe_get_value(info, "sector"),
            "優先市場": market,
            "決算月": settlement_period,
            # "会計基準": None,  # yfinanceでは詳細不明 - コメントアウト
            "市場タイプ": market_type,
            "都道府県": get_prefecture_from_zip(safe_get_value(info, "zip")) or None if market_type == "JP" else None,
            "時価総額": safe_get_value(info, "marketCap"),
            "PBR": safe_get_value(info, "priceToBook"),
            "PER(会予)": forward_pe,
            "PER(過去12ヶ月)": trailing_pe,
            "PER(前年度)": previous_year_pe,
            "配当方向性": dividend_direction,
            "配当利回り": dividend_yield,
            "EPS(過去12ヶ月)": trailing_eps,
            "EPS(予想)": forward_eps,
            "EPS(前年度)": previous_year_eps,
            "ROE": safe_get_value(info, "returnOnEquity"),
            "営業利益率": safe_get_value(info, "operatingMargins"),
            "純利益率": safe_get_value(info, "profitMargins"),
        }

        # 財務諸表からのデータ取得
        if not financials.empty:
            result["売上高"] = safe_get_financial_data(ticker, "financials", "Total Revenue")
            result["営業利益"] = safe_get_financial_data(ticker, "financials", "Operating Income")
            result["当期純利益"] = safe_get_financial_data(ticker, "financials", "Net Income")
        else:
            result.update({"売上高": None, "営業利益": None, "当期純利益": None})

        if not balance_sheet.empty:
            # バランスシートデータ（test.csvの項目名に基づく、フォールバック付き）
            total_liabilities = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Total Liabilities Net Minority Interest",
                fallback_items=["Total Liab"],
            )
            current_liabilities = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Current Liabilities",
                fallback_items=["Total Current Liabilities"],
            )
            current_assets = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Current Assets",
                fallback_items=["Total Current Assets"],
            )
            total_equity = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Stockholders Equity",
                fallback_items=["Total Stockholder Equity"],
            )
            total_assets = safe_get_financial_data(ticker, "balance_sheet", "Total Assets")
            total_debt = safe_get_financial_data(ticker, "balance_sheet", "Total Debt")
            cash_and_equivalents = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Cash And Cash Equivalents",
                fallback_items=["Cash Cash Equivalents And Short Term Investments"],
            )
            investments = safe_get_financial_data(
                ticker,
                "balance_sheet",
                "Available For Sale Securities",
                fallback_items=[
                    "Short Term Investments",
                    "Investmentin Financial Assets",
                ],
            )

            result.update({
                "負債": total_liabilities,
                "流動負債": current_liabilities,
                "流動資産": current_assets,
                "総負債": total_debt,
                "現金及び現金同等物": cash_and_equivalents,
                "投資有価証券": investments,
            })

            # 自己資本比率の計算
            if total_equity and total_assets:
                result["自己資本比率"] = total_equity / total_assets
            else:
                result["自己資本比率"] = None

            # ネットキャッシュの計算（流動資産 + 投資有価証券×70% - 負債）
            net_cash = calculate_net_cash(current_assets, investments, total_liabilities)
            result["ネットキャッシュ"] = net_cash

            # デバッグ用: ネットキャッシュ計算の詳細を表示
            if any(x is not None for x in [current_assets, investments, total_liabilities]):
                inv_70 = (investments * 0.7) if investments is not None else 0
                logger.debug(
                    f"  📊 ネットキャッシュ計算: {current_assets} + {inv_70:.0f} - {total_liabilities} = {net_cash}"
                )

            # ネットキャッシュ比率の計算
            if net_cash and result["時価総額"]:
                result["ネットキャッシュ比率"] = net_cash / result["時価総額"]
            else:
                result["ネットキャッシュ比率"] = None
        else:
            result.update({
                "負債": None,
                "流動負債": None,
                "流動資産": None,
                "総負債": None,
                "現金及び現金同等物": None,
                "投資有価証券": None,
                "自己資本比率": None,
                "ネットキャッシュ": None,
                "ネットキャッシュ比率": None,
            })

        end_time = time.time()
        end_datetime = datetime.now()
        duration = end_time - start_time

        logger.info(f"  ✅ 取得完了: {result['会社名']}")
        logger.debug(
            f"データ取得完了: {result['会社名']} ({ticker_symbol}) - 終了時刻: {end_datetime.strftime('%Y-%m-%d %H:%M:%S')} - 実行時間: {format_duration(duration)}"
        )
        return result

    except Exception as e:
        end_time = time.time()
        end_datetime = datetime.now()
        duration = end_time - start_time

        logger.error(f"  ❌ エラー: {ticker_symbol} - {e}")
        logger.error(
            f"データ取得エラー: {stock_info['銘柄名']} ({ticker_symbol}) - 終了時刻: {end_datetime.strftime('%Y-%m-%d %H:%M:%S')} - 実行時間: {format_duration(duration)} - エラー: {e}"
        )
        return None


def main(json_filename="stocks_sample.json"):
    """メイン処理

    Args:
        json_filename (str): 処理対象のJSONファイル名
    """
    overall_start_time = time.time()
    overall_start_datetime = datetime.now()

    logger.info("=" * 80)
    logger.info(f"株式財務データ取得プロセス開始 - 開始時刻: {overall_start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"処理対象ファイル: {json_filename}")
    logger.info("=" * 80)

    # 指定されたJSONファイルからデータを読み込み
    try:
        with open(json_filename, "r", encoding="utf-8") as f:
            stock_list = json.load(f)
        logger.info(f"{json_filename}から{len(stock_list)}社の銘柄データを読み込みました")
    except FileNotFoundError:
        logger.error(f"❌ {json_filename}ファイルが見つかりません")
        return None
    except json.JSONDecodeError:
        logger.error(f"❌ {json_filename}ファイルの形式が正しくありません")
        return None

    logger.info("=" * 60)
    logger.info("株式財務データ取得開始")
    logger.info("=" * 60)

    results = []

    for i, stock in enumerate(stock_list, 1):
        logger.info(f"\n[{i}/{len(stock_list)}]")
        result = get_stock_data(stock)

        if result:
            results.append(result)

        # API制限回避のため少し待機
        if i < len(stock_list):
            time.sleep(2)

    # 結果をDataFrameに変換
    if results:
        df = pd.DataFrame(results)

        # 列の順序を指定
        columns_order = [
            "会社名",
            "銘柄コード",
            "業種",
            "優先市場",
            "市場タイプ",
            "決算月",
            # "会計基準",  # コメントアウト
            "都道府県",
            "時価総額",
            "PBR",
            "PER(会予)",
            "PER(過去12ヶ月)",
            "PER(前年度)",
            "配当方向性",
            "配当利回り",
            "EPS(過去12ヶ月)",
            "EPS(予想)",
            "EPS(前年度)",
            "売上高",
            "営業利益",
            "営業利益率",
            "当期純利益",
            "純利益率",
            "ROE",
            "自己資本比率",
            "負債",
            "流動負債",
            "流動資産",
            "総負債",
            "現金及び現金同等物",
            "投資有価証券",
            "ネットキャッシュ",
            "ネットキャッシュ比率",
        ]

        df = df.reindex(columns=columns_order)

        overall_end_time = time.time()
        overall_end_datetime = datetime.now()
        overall_duration = overall_end_time - overall_start_time

        # 結果を表示
        logger.info("\n" + "=" * 60)
        logger.info("取得結果サマリー")
        logger.info("=" * 60)
        logger.info(f"取得成功: {len(results)}社")
        logger.info(f"取得失敗: {len(stock_list) - len(results)}社")

        # CSVファイルに保存（Export フォルダに直接保存）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = json_filename.replace(".json", "").replace("stocks_", "").replace("us_stocks_", "")

        # ファイル名を市場タイプに応じて変更
        # 最初のデータから市場タイプを判定
        market_type = results[0].get("市場タイプ", "JP") if results else "JP"
        if market_type == "US":
            filename = f"Export/us_stocks_data_{base_name}_{timestamp}.csv"
        else:
            filename = f"Export/japanese_stocks_data_{base_name}_{timestamp}.csv"
        df.to_csv(filename, index=False, encoding="utf-8-sig")
        logger.info(f"\nデータをCSVファイルに保存しました: {filename}")

        # データの一部を表示
        logger.info("\n取得データ（最初の3列）:")
        logger.info(f"\n{df[['会社名', '銘柄コード', '時価総額', 'PBR', 'ROE']].head()}")

        # 全体の実行時間をログ出力
        logger.info("=" * 80)
        logger.info("株式財務データ取得プロセス完了")
        logger.info(f"開始時刻: {overall_start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"終了時刻: {overall_end_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"総実行時間: {format_duration(overall_duration)}")
        logger.info(
            f"処理結果: 成功 {len(results)}社 / 失敗 {len(stock_list) - len(results)}社 / 合計 {len(stock_list)}社"
        )
        logger.info(f"平均処理時間: {format_duration(overall_duration / len(stock_list))}（1社あたり）")
        logger.info(f"保存ファイル: {filename}")
        logger.info("=" * 80)

        return df
    else:
        overall_end_time = time.time()
        overall_end_datetime = datetime.now()
        overall_duration = overall_end_time - overall_start_time

        logger.error("\n❌ データが取得できませんでした")
        logger.error("=" * 80)
        logger.error("株式財務データ取得プロセス失敗")
        logger.error(f"開始時刻: {overall_start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.error(f"終了時刻: {overall_end_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.error(f"総実行時間: {format_duration(overall_duration)}")
        logger.error("すべてのデータ取得に失敗しました")
        logger.error("=" * 80)
        return None


def parse_arguments():
    """コマンドライン引数を解析

    Returns:
        argparse.Namespace: 解析された引数オブジェクト
            - json_file: 処理対象のJSONファイル名（位置引数）
            - json_file_alt: --jsonオプションで指定されたファイル名

    Note:
        - デフォルトファイル: stocks_sample.json
        - --jsonオプションが位置引数より優先される
        - 詳細なヘルプメッセージと使用例を提供

    Examples:
        >>> args = parse_arguments()
        >>> args.json_file
        'stocks_sample.json'
    """
    parser = argparse.ArgumentParser(
        description="株式の財務データを取得してCSVファイルに保存します（日本株・米国株対応）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python sumalize.py                    # stocks_sample.jsonを処理（デフォルト）
  python sumalize.py stocks_1.json     # stocks_1.jsonを処理
  python sumalize.py --json stocks_2.json  # stocks_2.jsonを処理
  
利用可能なファイル:
  stocks_1.json, stocks_2.json, stocks_3.json, stocks_4.json
  stocks_sample.json, stocks_all.json
        """,
    )

    parser.add_argument(
        "json_file",
        nargs="?",
        default="stocks_sample.json",
        help="処理対象のJSONファイル名 (デフォルト: stocks_sample.json)",
    )

    parser.add_argument(
        "--json",
        "-j",
        dest="json_file_alt",
        help="処理対象のJSONファイル名（--jsonオプション）",
    )

    return parser.parse_args()


if __name__ == "__main__":
    # コマンドライン引数を解析
    args = parse_arguments()

    # ファイル名を決定（--jsonオプションが優先）
    json_filename = args.json_file_alt if args.json_file_alt else args.json_file

    # yfinanceのバージョン確認
    logger.info(f"yfinance version: {yf.__version__}")
    logger.info(f"処理対象ファイル: {json_filename}")
    logger.info("=" * 60)

    # メイン処理実行
    df_result = main(json_filename)

    logger.info("\n" + "=" * 60)
    logger.info("処理完了")
    logger.info("=" * 60)
