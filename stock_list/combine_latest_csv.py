#!/usr/bin/env python3
"""
Latest CSV Combiner for Japanese Stock Data
最新のCSVファイルを結合して日付付きのファイルを生成するスクリプト

Purpose:
- Exportディレクトリから最新のCSVファイルを特定
- 複数のCSVファイルを結合して一つの統合ファイルを作成
- 日付_combined.csv形式でファイル名を生成
"""

import os
import glob
import pandas as pd
from datetime import datetime
import argparse
import logging
from pathlib import Path

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("combine_csv.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


def get_latest_csv_files(export_dir="./Export", target_date=None):
    """
    Exportディレクトリから最新のCSVファイルを取得

    Args:
        export_dir (str): CSVファイルが格納されているディレクトリ
        target_date (str): 対象日付 (YYYYMMDD形式、Noneの場合は今日)

    Returns:
        list: 最新のCSVファイルのリスト（今日の日付のもののみ）
    """
    # CSVファイルのパターンを定義
    pattern = os.path.join(export_dir, "japanese_stocks_data_*.csv")
    all_csv_files = glob.glob(pattern)

    if not all_csv_files:
        logger.warning(f"CSVファイルが見つかりません: {pattern}")
        return []

    # 対象日付を決定
    if target_date is None:
        target_date = datetime.now().strftime("%Y%m%d")

    logger.info(f"対象日付: {target_date}")

    # 今日の日付のファイルのみをフィルタリング
    csv_files = [f for f in all_csv_files if target_date in os.path.basename(f)]

    if not csv_files:
        logger.warning(f"⚠️  {target_date} のCSVファイルが見つかりません")
        logger.info(f"全{len(all_csv_files)}個のファイルから検索しましたが、該当なし")
        return []

    # ファイルの更新日時でソート（最新順）
    csv_files.sort(key=os.path.getmtime, reverse=True)

    # 各ファイルの情報をログ出力
    logger.info(f"✅ {target_date} のCSVファイル: {len(csv_files)}個")
    for i, file in enumerate(csv_files):
        mod_time = datetime.fromtimestamp(os.path.getmtime(file))
        logger.info(f"  {i + 1}. {os.path.basename(file)} (更新日時: {mod_time})")

    return csv_files


def get_today_date():
    """
    今日の日付をYYYYMMDD形式で取得

    Returns:
        str: 今日の日付（YYYYMMDD形式）
    """
    return datetime.now().strftime("%Y%m%d")


def combine_csv_files(csv_files, output_file):
    """
    複数のCSVファイルを結合して一つのファイルに保存

    Args:
        csv_files (list): 結合するCSVファイルのリスト
        output_file (str): 出力ファイル名

    Returns:
        bool: 成功した場合True、失敗した場合False
    """
    try:
        combined_data = []
        total_rows = 0

        for csv_file in csv_files:
            logger.info(f"読み込み中: {os.path.basename(csv_file)}")

            # CSVファイルを読み込み（日本語対応）
            df = pd.read_csv(csv_file, encoding="utf-8")

            # BOM（Byte Order Mark）を除去
            if df.columns[0].startswith("\ufeff"):
                df.columns = [df.columns[0].replace("\ufeff", "")] + df.columns[
                    1:
                ].tolist()

            # データの基本情報をログ出力
            logger.info(f"  - 行数: {len(df)}, 列数: {len(df.columns)}")

            combined_data.append(df)
            total_rows += len(df)

        if not combined_data:
            logger.error("結合するデータがありません")
            return False

        # データを結合（重複排除）
        logger.info("CSVファイルを結合中...")
        combined_df = pd.concat(combined_data, ignore_index=True)

        # 重複データの除去（銘柄コードベース）
        if "銘柄コード" in combined_df.columns:
            before_dedup = len(combined_df)
            combined_df = combined_df.drop_duplicates(
                subset=["銘柄コード"], keep="last"
            )
            after_dedup = len(combined_df)
            logger.info(
                f"重複除去: {before_dedup} → {after_dedup} 行 ({before_dedup - after_dedup}行を除去)"
            )

        # 出力ディレクトリを作成
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # 結合されたデータを保存
        combined_df.to_csv(output_file, index=False, encoding="utf-8")

        logger.info(f"✅ 結合完了: {output_file}")
        logger.info(f"   - 総行数: {len(combined_df)}")
        logger.info(f"   - 総列数: {len(combined_df.columns)}")
        logger.info(
            f"   - ファイルサイズ: {os.path.getsize(output_file) / (1024 * 1024):.2f} MB"
        )

        return True

    except Exception as e:
        logger.error(f"❌ CSVファイル結合中にエラーが発生: {str(e)}")
        return False


def main():
    """
    メイン実行関数
    """
    parser = argparse.ArgumentParser(
        description="最新のCSVファイルを結合して日付付きファイルを生成"
    )
    parser.add_argument(
        "--export-dir",
        default="./Export",
        help="CSVファイルが格納されているディレクトリ (デフォルト: ./Export)",
    )
    parser.add_argument(
        "--output-dir",
        default="./Export",
        help="出力ディレクトリ (デフォルト: ./Export)",
    )
    parser.add_argument(
        "--date",
        default=None,
        help="使用する日付 (YYYYMMDD形式、未指定の場合は今日の日付)",
    )

    args = parser.parse_args()

    # 実行開始ログ
    logger.info("=" * 60)
    logger.info("🚀 Latest CSV Combiner 実行開始")
    logger.info("=" * 60)

    # 対象日付を決定
    target_date = args.date if args.date else get_today_date()

    # 指定日付のCSVファイルを取得
    csv_files = get_latest_csv_files(args.export_dir, target_date)

    if not csv_files:
        logger.error(f"❌ {target_date} のCSVファイルが見つかりません")
        return False

    # 出力ファイル名を生成
    output_filename = f"{target_date}_combined.csv"
    output_path = os.path.join(args.output_dir, output_filename)

    logger.info(f"📁 出力ファイル: {output_path}")

    # CSVファイルを結合
    success = combine_csv_files(csv_files, output_path)

    if success:
        logger.info("=" * 60)
        logger.info("✅ CSV結合処理が正常に完了しました")
        logger.info("=" * 60)
        print(f"OUTPUT_FILE={output_path}")  # GitHub Actions用の出力
        return True
    else:
        logger.error("=" * 60)
        logger.error("❌ CSV結合処理が失敗しました")
        logger.error("=" * 60)
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
