"""Liquidity / volatility enrichment for candidate pools.

現行の結合CSVには出来高列が無いため、値動き系の指標(出来高・売買代金・ATR・
ボラティリティ)はここで ticker 単位に yfinance の日足履歴を追加取得して計算する。
グラウンディングプールへ「材料として提示する列」を足すのが目的で、スコアリングや
順位・銘柄集合には一切影響しない(呼び出し側で列を付与するだけ)。

計算ロジック(compute_liquidity_metrics)はネットワーク非依存の純関数として分離し、
yfinance 取得は enrich_with_liquidity 側に閉じ込める(テストは fetch_fn 注入で実施)。
"""
import pandas as pd


# 付与する列名。呼び出し側・テストと共有する単一の真実。
LIQUIDITY_COLUMNS = ("avg_volume_20d", "avg_turnover_jpy_20d", "atr14_pct", "hist_vol_20d")


def compute_liquidity_metrics(hist: pd.DataFrame | None, lookback_days: int = 20) -> dict:
    """日足履歴から流動性・ボラティリティ指標を計算する(純関数・ネット非依存)。

    hist は yfinance 互換の日足 DataFrame(High/Low/Close/Volume 列, auto_adjust済)を想定。
    - avg_volume_20d       : 直近 lookback_days の平均出来高(株)
    - avg_turnover_jpy_20d : 直近 lookback_days の平均売買代金(終値×出来高, 円)
    - atr14_pct            : ATR(14) を最新終値で割った割合(%)
    - hist_vol_20d         : 直近 lookback_days の日次リターン標準偏差(%)
    データ不足・欠損の指標は None を返す(誤誘導を避けるため補完しない)。
    """
    out = {col: None for col in LIQUIDITY_COLUMNS}
    if hist is None or len(hist) == 0:
        return out

    required = {"High", "Low", "Close", "Volume"}
    if not required.issubset(set(hist.columns)):
        return out

    close = hist["Close"].astype(float)
    high = hist["High"].astype(float)
    low = hist["Low"].astype(float)
    volume = hist["Volume"].astype(float)
    n = len(hist)

    if n >= lookback_days:
        recent_volume = volume.tail(lookback_days)
        avg_volume = float(recent_volume.mean())
        if pd.notna(avg_volume):
            out["avg_volume_20d"] = round(avg_volume, 1)

        turnover = (close * volume).tail(lookback_days)
        avg_turnover = float(turnover.mean())
        if pd.notna(avg_turnover):
            out["avg_turnover_jpy_20d"] = round(avg_turnover, 0)

        returns = close.pct_change().tail(lookback_days).dropna()
        if len(returns) >= 2:
            vol = float(returns.std())
            if pd.notna(vol):
                out["hist_vol_20d"] = round(vol * 100, 2)

    # ATR(14): True Range = max(H-L, |H-prevClose|, |L-prevClose|) の14期間単純平均。
    if n >= 15:
        prev_close = close.shift(1)
        true_range = pd.concat(
            [(high - low), (high - prev_close).abs(), (low - prev_close).abs()],
            axis=1,
        ).max(axis=1)
        atr = true_range.rolling(14).mean().iloc[-1]
        last_close = float(close.iloc[-1])
        if pd.notna(atr) and last_close > 0:
            out["atr14_pct"] = round(float(atr) / last_close * 100, 2)

    return out


def enrich_with_liquidity(
    df: pd.DataFrame,
    lookback_days: int = 20,
    fetch_fn=None,
) -> pd.DataFrame:
    """df の各 ticker に流動性・ボラティリティ列(LIQUIDITY_COLUMNS)を付与して返す。

    fetch_fn(ticker) -> 日足 DataFrame を注入可能(未指定時は yfinance を使用)。
    銘柄ごとに fail-open: 取得・計算に失敗した銘柄は列を None のまま通過させ、
    パイプライン全体を止めない(既存 _apply_liquidity_filter と同じ安全側の方針)。
    df は変更せずコピーに列を足して返す。
    """
    if df is None or len(df) == 0:
        return df

    if fetch_fn is None:
        import yfinance as yf

        def fetch_fn(ticker: str) -> pd.DataFrame:
            return yf.Ticker(ticker).history(
                period=f"{lookback_days + 15}d", interval="1d", auto_adjust=True
            )

    df = df.copy()
    collected = {col: [] for col in LIQUIDITY_COLUMNS}
    for ticker in df["ticker"]:
        try:
            hist = fetch_fn(ticker)
            metrics = compute_liquidity_metrics(hist, lookback_days)
        except Exception:
            metrics = {col: None for col in LIQUIDITY_COLUMNS}
        for col in LIQUIDITY_COLUMNS:
            collected[col].append(metrics.get(col))

    for col in LIQUIDITY_COLUMNS:
        df[col] = collected[col]
    return df
