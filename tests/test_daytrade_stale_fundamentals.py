from pipeline.run_daytrade_scan import score_rows, suppress_stale_fundamentals


def test_stale_fundamentals_force_neutral_quality():
    rows = [{"mom20": 10, "roe": -1, "adx": 25, "turnover_jpy": 1e9, "atr_pct": 2}]
    score_rows(rows, "stale")
    assert rows[0]["score_quality"] == 0.5


def test_fresh_fundamentals_keep_existing_roe_thresholds():
    rows = [{"mom20": 10, "roe": -1, "adx": 25, "turnover_jpy": 1e9, "atr_pct": 2}]
    score_rows(rows, "fresh")
    assert rows[0]["score_quality"] == 0.3


def test_stale_fundamental_fields_are_suppressed_for_consumers():
    rows = [{"per": 10, "pbr": 1, "roe": .1, "net_cash_ratio": .2, "market_cap_jpy": 100}]
    suppress_stale_fundamentals(rows, "stale")
    assert all(value is None for value in rows[0].values())
