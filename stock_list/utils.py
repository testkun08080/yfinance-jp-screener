"""
市場タイプ識別ユーティリティ

ティッカーシンボルから市場タイプ（日本株/米国株）を判定し、
適切なティッカー形式に変換する機能を提供します。

主な機能:
- ティッカーシンボルから市場タイプを判定
- 市場タイプに応じたティッカー形式の生成
"""

import re
import logging

logger = logging.getLogger(__name__)


def detect_market_type(ticker: str) -> str:
    """ティッカーシンボルから市場タイプを判定

    Args:
        ticker (str): ティッカーシンボル（例: "7203.T", "AAPL", "7203"）

    Returns:
        str: 市場タイプ
            - "JP": 日本株（.Tで終わる、または4桁の数値コード）
            - "US": 米国株（1-5文字の英字、.Tで終わらない）

    Examples:
        >>> detect_market_type("7203.T")
        'JP'
        >>> detect_market_type("AAPL")
        'US'
        >>> detect_market_type("7203")
        'JP'
        >>> detect_market_type("MSFT")
        'US'
    """
    if not ticker:
        return "JP"  # デフォルトは日本株

    ticker_str = str(ticker).strip()

    # 日本株判定: .Tで終わる
    if ticker_str.endswith(".T"):
        return "JP"

    # 4桁の数値コード（日本株）
    if re.match(r"^\d{4}$", ticker_str):
        return "JP"

    # 米国株判定: 1-5文字の英字（.Tで終わらない）
    if re.match(r"^[A-Z]{1,5}$", ticker_str.upper()):
        return "US"

    # デフォルトは日本株（後方互換性のため）
    logger.warning(f"市場タイプを判定できませんでした（デフォルト: JP）: {ticker_str}")
    return "JP"


def format_ticker_for_market(code: str, market_type: str) -> str:
    """市場タイプに応じたティッカー形式を生成

    Args:
        code (str): 銘柄コード（例: "7203", "AAPL"）
        market_type (str): 市場タイプ（"JP" または "US"）

    Returns:
        str: yfinance用のティッカーシンボル
            - 日本株: "7203.T"（4桁にゼロパディング）
            - 米国株: "AAPL"（そのまま）

    Examples:
        >>> format_ticker_for_market("7203", "JP")
        '7203.T'
        >>> format_ticker_for_market("AAPL", "US")
        'AAPL'
        >>> format_ticker_for_market("130A", "JP")
        '130A.T'
    """
    if market_type == "US":
        # 米国株: そのまま返す
        return str(code).strip().upper()

    # 日本株: .Tを付加
    code_str = str(code).strip()
    if code_str.endswith(".T"):
        return code_str

    # 数値コードの場合は4桁にゼロパディング
    if code_str.isdigit():
        return f"{int(code_str):04d}.T"
    else:
        # 英数字混合コード（例: 130A）はそのまま使用
        return f"{code_str}.T"
