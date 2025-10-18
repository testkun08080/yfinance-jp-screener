import yfinance as yf
import pandas as pd
import json
import time
import argparse
from datetime import datetime
import warnings
import logging
import requests


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
    """郵便番号から都道府県名を取得（digital-address API使用）"""
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
    """秒数を読みやすい形式に変換"""
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


def format_ticker(code):
    """銘柄コードを正しい形式に変換"""
    if isinstance(code, str):
        # 英数字混合コード（例：130A）はそのまま使用
        return f"{code}.T"
    else:
        # 数値コードは4桁にゼロパディング
        return f"{code:04d}.T"


def safe_get_value(data, key, default=None):
    """安全にデータを取得（KeyErrorを回避）"""
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
    """財務諸表から安全にデータを取得（フォールバック機能付き）"""
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
    """ネットキャッシュを計算: 流動資産 + 投資有価証券×70% - 負債"""
    try:
        if current_assets is not None and total_liabilities is not None:
            inv_value = (investments * 0.7) if investments is not None else 0
            return current_assets + inv_value - total_liabilities
        return None
    except:
        return None


def get_stock_data(stock_info):
    """個別銘柄の財務データを取得"""
    code = stock_info["コード"]
    ticker_symbol = format_ticker(code)

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
        # print(f"  📊 forwardPE値: {forward_pe} (type: {type(forward_pe)})")

        # その他のPE関連データもチェック
        # trailing_pe = safe_get_value(info, "trailingPE")
        # pe_ratio = safe_get_value(info, "priceEarningsRatio")
        # print(f"  📊 trailingPE: {trailing_pe}, priceEarningsRatio: {pe_ratio}")

        # 郵便番号と都道府県のデバッグ
        zip_code = safe_get_value(info, "zip")
        # prefecture_from_zip = get_prefecture_from_zip(zip_code)
        # city = safe_get_value(info, "city")
        # state = safe_get_value(info, "state")
        # print(f"  🏢 zip: {zip_code}, 都道府県(zip): {prefecture_from_zip}, city: {city}, state: {state}")

        # データ収集
        result = {
            "会社名": stock_info["銘柄名"] or safe_get_value(info, "longName") or safe_get_value(info, "shortName"),
            "銘柄コード": code,
            "業種": stock_info.get("33業種区分") or safe_get_value(info, "industry") or safe_get_value(info, "sector"),
            "優先市場": stock_info.get("市場・商品区分", ""),
            "決算月": settlement_period,
            # "会計基準": None,  # yfinanceでは詳細不明 - コメントアウト
            "都道府県": get_prefecture_from_zip(safe_get_value(info, "zip")) or None,
            "時価総額": safe_get_value(info, "marketCap"),
            "PBR": safe_get_value(info, "priceToBook"),
            "PER(会予)": forward_pe,
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
    logger.info(f"日本株財務データ取得プロセス開始 - 開始時刻: {overall_start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
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
    logger.info("日本株財務データ取得開始")
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
            "決算月",
            # "会計基準",  # コメントアウト
            "都道府県",
            "時価総額",
            "PBR",
            "売上高",
            "営業利益",
            "営業利益率",
            "当期純利益",
            "純利益率",
            "ROE",
            "自己資本比率",
            "PER(会予)",
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
        base_name = json_filename.replace(".json", "").replace("stocks_", "")

        filename = f"Export/japanese_stocks_data_{base_name}_{timestamp}.csv"
        df.to_csv(filename, index=False, encoding="utf-8-sig")
        logger.info(f"\nデータをCSVファイルに保存しました: {filename}")

        # データの一部を表示
        logger.info("\n取得データ（最初の3列）:")
        logger.info(f"\n{df[['会社名', '銘柄コード', '時価総額', 'PBR', 'ROE']].head()}")

        # 全体の実行時間をログ出力
        logger.info("=" * 80)
        logger.info("日本株財務データ取得プロセス完了")
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
        logger.error("日本株財務データ取得プロセス失敗")
        logger.error(f"開始時刻: {overall_start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.error(f"終了時刻: {overall_end_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.error(f"総実行時間: {format_duration(overall_duration)}")
        logger.error("すべてのデータ取得に失敗しました")
        logger.error("=" * 80)
        return None


def parse_arguments():
    """コマンドライン引数を解析"""
    parser = argparse.ArgumentParser(
        description="日本株の財務データを取得してCSVファイルに保存します",
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
