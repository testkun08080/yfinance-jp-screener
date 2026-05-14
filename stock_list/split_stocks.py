"""
stocks_all.jsonを1000社ずつのファイルに分割するスクリプト
"""

import json
import math
import argparse
import sys
import logging

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def split_stocks_json(input_file="stocks_all.json", chunk_size=1000):
    """
    stocks_all.jsonまたはus_stocks_all.jsonを指定されたサイズのチャンクに分割

    Args:
        input_file (str): 入力JSONファイル名（stocks_all.json または us_stocks_all.json）
        chunk_size (int): 1ファイルあたりの企業数
    """
    try:
        # 元のJSONファイルを読み込み
        with open(input_file, "r", encoding="utf-8") as f:
            stock_data = json.load(f)

        total_companies = len(stock_data)
        total_files = math.ceil(total_companies / chunk_size)

        logger.info(f"総企業数: {total_companies}社")
        logger.info(f"分割ファイル数: {total_files}ファイル")
        logger.info(f"1ファイルあたり: 最大{chunk_size}社")
        logger.info("-" * 50)

        # チャンクに分割して保存
        for i in range(total_files):
            start_idx = i * chunk_size
            end_idx = min((i + 1) * chunk_size, total_companies)
            chunk_data = stock_data[start_idx:end_idx]

            # ファイル名を生成（市場タイプに応じて変更）
            if "us_stocks" in input_file.lower():
                output_filename = f"us_stocks_{i + 1}.json"
            else:
                output_filename = f"stocks_{i + 1}.json"

            # JSON形式で保存
            with open(output_filename, "w", encoding="utf-8") as f:
                json.dump(chunk_data, f, ensure_ascii=False, indent=2)

            logger.info(
                f"✅ {output_filename}: {len(chunk_data)}社 (#{start_idx + 1}-#{end_idx})"
            )

        logger.info("-" * 50)
        logger.info(f"分割完了: {total_files}個のファイルを作成しました")

        # 各ファイルの情報を表示
        logger.info("\n作成されたファイル:")
        for i in range(total_files):
            filename = f"stocks_{i + 1}.json"
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)
            logger.info(f"  {filename}: {len(data)}社")

    except FileNotFoundError:
        logger.error(f"❌ エラー: {input_file}が見つかりません")
    except json.JSONDecodeError:
        logger.error(f"❌ エラー: {input_file}の形式が正しくありません")
    except Exception as e:
        logger.error(f"❌ エラー: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="株式リストJSONファイルを指定されたサイズのチャンクに分割します（日本株・米国株対応）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python split_stocks.py                           # stocks_all.jsonを1000社ずつに分割
  python split_stocks.py -i stocks_all.json       # stocks_all.jsonを1000社ずつに分割
  python split_stocks.py -i data.json -s 500      # data.jsonを500社ずつに分割
  python split_stocks.py --input stocks_all.json --size 2000  # 2000社ずつに分割
        """,
    )

    parser.add_argument(
        "-i",
        "--input",
        default="stocks_all.json",
        help="入力JSONファイル名 (デフォルト: stocks_all.json)",
    )

    parser.add_argument(
        "-s",
        "--size",
        type=int,
        default=1000,
        help="1ファイルあたりの企業数 (デフォルト: 1000)",
    )

    parser.add_argument("-v", "--verbose", action="store_true", help="詳細な出力を表示")

    args = parser.parse_args()

    # バリデーション
    if args.size <= 0:
        logger.error("❌ エラー: チャンクサイズは正の整数である必要があります")
        sys.exit(1)

    logger.info("=" * 60)
    logger.info("📊 株式リスト分割ツール")
    logger.info("=" * 60)
    logger.info(f"入力ファイル: {args.input}")
    logger.info(f"チャンクサイズ: {args.size}社")
    if args.verbose:
        logger.info("詳細モード: ON")
    logger.info("=" * 60)

    split_stocks_json(input_file=args.input, chunk_size=args.size)
