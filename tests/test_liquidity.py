import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.scorers.liquidity import (
    LIQUIDITY_COLUMNS,
    compute_liquidity_metrics,
    enrich_with_liquidity,
)


def _make_hist(n: int, close_start: float = 100.0, volume: float = 1000.0) -> pd.DataFrame:
    """High/Low/Close/Volume を持つ合成日足を作る(Close は+1ずつ, レンジ幅一定)。"""
    closes = [close_start + i for i in range(n)]
    return pd.DataFrame({
        "High": [c + 2 for c in closes],
        "Low": [c - 2 for c in closes],
        "Close": closes,
        "Volume": [volume] * n,
    })


def test_metrics_full_window_values():
    """十分な履歴で4指標が計算されること(平均出来高・売買代金は既知値)。"""
    hist = _make_hist(40, close_start=100.0, volume=1000.0)
    m = compute_liquidity_metrics(hist, lookback_days=20)
    assert m["avg_volume_20d"] == 1000.0
    # 直近20日の (Close×1000) の平均 = 平均終値×1000
    expected_turnover = round(float((hist["Close"] * hist["Volume"]).tail(20).mean()), 0)
    assert m["avg_turnover_jpy_20d"] == expected_turnover
    assert m["atr14_pct"] is not None and m["atr14_pct"] > 0
    assert m["hist_vol_20d"] is not None and m["hist_vol_20d"] >= 0


def test_metrics_insufficient_data_returns_none():
    """履歴が短い場合は該当指標が None になること。"""
    hist = _make_hist(5)
    m = compute_liquidity_metrics(hist, lookback_days=20)
    assert m["avg_volume_20d"] is None
    assert m["avg_turnover_jpy_20d"] is None
    assert m["hist_vol_20d"] is None
    assert m["atr14_pct"] is None  # n<15


def test_metrics_empty_or_none():
    """None / 空 DataFrame でも例外にならず全 None を返すこと。"""
    for arg in (None, pd.DataFrame()):
        m = compute_liquidity_metrics(arg)
        assert all(m[c] is None for c in LIQUIDITY_COLUMNS)


def test_metrics_missing_columns_returns_none():
    """必須列(Volume等)が欠けている場合は全 None を返すこと。"""
    hist = pd.DataFrame({"Close": [100.0] * 30})
    m = compute_liquidity_metrics(hist, lookback_days=20)
    assert all(m[c] is None for c in LIQUIDITY_COLUMNS)


def test_enrich_adds_columns_with_injected_fetch():
    """fetch_fn 注入(ネット不要)で全 ticker に4列が付与されること。"""
    df = pd.DataFrame([
        {"ticker": "1234.T", "score_total": 0.9},
        {"ticker": "5678.T", "score_total": 0.8},
    ])
    result = enrich_with_liquidity(df, fetch_fn=lambda t: _make_hist(40))
    for col in LIQUIDITY_COLUMNS:
        assert col in result.columns
        assert result[col].notna().all()
    # 既存列・行順は保持される
    assert result["ticker"].tolist() == ["1234.T", "5678.T"]
    assert result["score_total"].tolist() == [0.9, 0.8]


def test_enrich_fail_open_per_ticker():
    """取得失敗の ticker は列 None のまま通過し、他の ticker は計算されること。"""
    def flaky_fetch(ticker):
        if ticker == "5678.T":
            raise RuntimeError("network error")
        return _make_hist(40)

    df = pd.DataFrame([
        {"ticker": "1234.T"},
        {"ticker": "5678.T"},
    ])
    result = enrich_with_liquidity(df, fetch_fn=flaky_fetch)
    assert result.loc[result["ticker"] == "1234.T", "avg_volume_20d"].iloc[0] == 1000.0
    # 失敗tickerは欠損(混在列でpandasがNaNへ昇格。出力層でNaN→None変換される)
    assert pd.isna(result.loc[result["ticker"] == "5678.T", "avg_volume_20d"].iloc[0])


def test_enrich_empty_df_unchanged():
    """空 df はそのまま返る(列追加なし)こと。"""
    df = pd.DataFrame(columns=["ticker"])
    result = enrich_with_liquidity(df, fetch_fn=lambda t: _make_hist(40))
    assert len(result) == 0
