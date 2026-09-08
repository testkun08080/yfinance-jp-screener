"""Daytrade candidate scanner — price/volume-based universe selection.

Selects day-trading candidates from the JPX Prime universe by *price action*
(turnover, ATR%, ADX, momentum) instead of the fundamentals-only ranking used
by pipeline.run_daily. Fundamentals from the combined CSV are joined only as a
minor quality component and for grounding columns.

Usage (standalone):
  python -m pipeline.run_daytrade_scan \
      --csv-dir stock_list/Export \
      --shared-output out/candidates_daytrade.json \
      --grounding-output out/grounding_pool_daytrade.json

Fail-safe: if the price fetch fails for most of the universe or too few names
pass the filters, nothing is written (exit 1) so consumers keep using the
previous day's files via their 72h freshness fallback.
"""
import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

sys.path.insert(0, str(Path(__file__).parent.parent))
from pipeline.load_csv import load_latest_combined_csv, to_ticker
from pipeline.output import write_candidates_json
from pipeline.reference_freshness import market_date_asof, market_date_status

# Windows console defaults to cp932; avoid UnicodeEncodeError on ≥ etc.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

_STOCKS_ALL = Path(__file__).parent.parent / "stock_list" / "stocks_all.json"
_CHUNK_SIZE = 200
_HISTORY_PERIOD = "3mo"
_ADX_PERIOD = 14
_ATR_PERIOD = 14
_TURNOVER_WINDOW = 20
_MOM_WINDOW = 20
# Hard liquidity floor for both pool and candidates
_MIN_TURNOVER_JPY = 5e8
# Candidates: strict volatility/trend gate. Pool: looser (grounding pool is
# by design the wider, softer-cutoff set — see ai_recommendation_service).
_CAND_MIN_ADX = 25.0
_CAND_MIN_ATR_PCT = 2.0
_POOL_MIN_ADX = 20.0
_POOL_MIN_ATR_PCT = 1.5
# Abort thresholds (fail-safe: leave previous output files untouched)
_MIN_FETCH_SUCCESS_RATIO = 0.5
_MIN_CANDIDATES = 5


def load_prime_universe() -> list[dict]:
    """Prime members from the JPX master list: [{code, name, sector}, ...]."""
    with open(_STOCKS_ALL, encoding="utf-8") as f:
        data = json.load(f)
    out = []
    for row in data:
        if "プライム" not in str(row.get("市場・商品区分", "")):
            continue
        out.append({
            "code": str(row["コード"]),
            "name": row.get("銘柄名", ""),
            "sector": row.get("33業種区分", ""),
        })
    return out


def _wilder_smooth(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(alpha=1.0 / period, adjust=False).mean()


def compute_metrics(ohlcv: pd.DataFrame) -> dict | None:
    """ATR%(14), ADX(14) (Wilder, same spec as simulator indicators.calc_adx),
    20-day median turnover (JPY) and 20-day return, from a daily OHLCV frame."""
    df = ohlcv.dropna(subset=["High", "Low", "Close"])
    if len(df) < _ADX_PERIOD * 2 + 5:
        return None
    high, low, close = df["High"], df["Low"], df["Close"]
    volume = df["Volume"].fillna(0)

    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    atr = _wilder_smooth(tr, _ATR_PERIOD)

    up_move = high.diff()
    down_move = -low.diff()
    plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
    minus_dm = pd.Series(np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index)
    atr_for_di = atr.replace(0, np.nan)
    plus_di = 100 * _wilder_smooth(plus_dm, _ADX_PERIOD) / atr_for_di
    minus_di = 100 * _wilder_smooth(minus_dm, _ADX_PERIOD) / atr_for_di
    di_sum = (plus_di + minus_di).replace(0, np.nan)
    dx = 100 * (plus_di - minus_di).abs() / di_sum
    adx = _wilder_smooth(dx.fillna(0), _ADX_PERIOD)

    last_close = float(close.iloc[-1])
    if last_close <= 0:
        return None
    turnover = (close * volume).tail(_TURNOVER_WINDOW)
    mom_base = close.iloc[-_MOM_WINDOW] if len(close) >= _MOM_WINDOW else close.iloc[0]

    return {
        "last_close": last_close,
        "last_bar_date": df.index[-1].strftime("%Y-%m-%d"),
        "atr_pct": round(float(atr.iloc[-1]) / last_close * 100, 2),
        "adx": round(float(adx.iloc[-1]), 1),
        "turnover_jpy": float(turnover.median()),
        "mom20": round((last_close - float(mom_base)) / float(mom_base) * 100, 2),
    }


def fetch_metrics(universe: list[dict]) -> tuple[list[dict], int]:
    """Batch-download daily bars and compute metrics. Returns (rows, n_fetched)."""
    tickers = [to_ticker(u["code"]) for u in universe]
    by_ticker = {to_ticker(u["code"]): u for u in universe}
    rows: list[dict] = []
    fetched = 0
    for i in range(0, len(tickers), _CHUNK_SIZE):
        chunk = tickers[i:i + _CHUNK_SIZE]
        print(f"[scan] fetch {i + 1}-{i + len(chunk)} / {len(tickers)}...", flush=True)
        data = None
        for attempt in range(2):
            try:
                data = yf.download(
                    chunk, period=_HISTORY_PERIOD, interval="1d",
                    group_by="ticker", auto_adjust=True, threads=True,
                    progress=False,
                )
                break
            except Exception as e:
                print(f"[scan] chunk failed (attempt {attempt + 1}): {e}", flush=True)
                time.sleep(5)
        if data is None or data.empty:
            continue
        for t in chunk:
            try:
                sub = data[t] if isinstance(data.columns, pd.MultiIndex) else data
            except KeyError:
                continue
            if sub.dropna(how="all").empty:
                continue
            fetched += 1
            m = compute_metrics(sub)
            if m is None:
                continue
            u = by_ticker[t]
            rows.append({"ticker": t, "code": u["code"], "name": u["name"], "sector": u["sector"], **m})
    return rows, fetched


def _mom_score(mom20: float) -> float:
    """Same mapping as pipeline.scorers.momentum (percent input)."""
    for th, s in [(20, 0.90), (10, 0.75), (5, 0.65), (0, 0.55), (-5, 0.45), (-10, 0.35)]:
        if mom20 > th:
            return s
    return 0.20


def _quality_score(roe) -> float:
    """Minor quality component from (possibly stale) CSV ROE. Neutral if missing."""
    try:
        v = float(roe)
    except (TypeError, ValueError):
        return 0.5
    if np.isnan(v):
        return 0.5
    # CSV ROE is a fraction (yfinance returnOnEquity), e.g. 0.15 == 15%.
    if v >= 0.15:
        return 0.8
    if v >= 0.08:
        return 0.65
    if v >= 0:
        return 0.5
    return 0.3


def attach_fundamentals(rows: list[dict], csv_dir: str) -> str | None:
    """Join per/pbr/roe/net_cash_ratio/market_cap from the combined CSV.
    Returns the CSV's asof date (from filename) or None when unavailable."""
    try:
        df, latest = load_latest_combined_csv(csv_dir)
    except FileNotFoundError:
        for r in rows:
            r.update({"per": None, "pbr": None, "roe": None,
                      "net_cash_ratio": None, "market_cap_jpy": None})
        return None
    df = df.set_index(df["銘柄コード"].astype(str))
    for r in rows:
        if r["code"] in df.index:
            row = df.loc[r["code"]]
            def _num(col):
                try:
                    v = float(row.get(col))
                    return None if np.isnan(v) else v
                except (TypeError, ValueError):
                    return None
            r["per"] = _num("PER(会予)")
            r["pbr"] = _num("PBR")
            r["roe"] = _num("ROE")
            r["net_cash_ratio"] = _num("ネットキャッシュ比率")
            r["market_cap_jpy"] = _num("時価総額")
        else:
            r.update({"per": None, "pbr": None, "roe": None,
                      "net_cash_ratio": None, "market_cap_jpy": None})
    stem = Path(latest).stem  # e.g. 20260418_jp_combined
    date8 = stem.split("_")[0]
    if len(date8) == 8 and date8.isdigit():
        return f"{date8[:4]}-{date8[4:6]}-{date8[6:8]}"
    return None


def _price_row_fresh(bar_date) -> bool:
    """Per-stock price freshness. A name whose last bar is stale must not be
    selected even when the rest of the universe is fresh."""
    try:
        d = datetime.strptime(bar_date, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return False
    return market_date_status(d, "price") == "fresh"


def score_rows(rows: list[dict], fundamentals_status: str = "fresh") -> None:
    for r in rows:
        r["score_momentum"] = _mom_score(r["mom20"])
        r["score_quality"] = 0.5 if fundamentals_status != "fresh" else _quality_score(r.get("roe"))
        adx_score = min(r["adx"] / 50.0, 1.0)
        r["score_total"] = round(
            0.5 * r["score_momentum"] + 0.3 * adx_score + 0.2 * r["score_quality"], 4
        )
        # Schema compatibility with the fundamentals pipeline output
        r["score_value"] = None
        r["testa_score"] = None
        r["event_catalyst"] = ""
        r["reasons"] = (
            f"ADX{r['adx']:.0f}・売買代金{r['turnover_jpy'] / 1e8:.1f}億円/日・"
            f"ATR{r['atr_pct']:.1f}%・20日{r['mom20']:+.1f}%"
        )


def suppress_stale_fundamentals(rows: list[dict], fundamentals_status: str) -> None:
    """Prevent stale valuation fields from leaking to downstream AI consumers."""
    if fundamentals_status == "fresh":
        return
    for row in rows:
        for field in ("per", "pbr", "roe", "net_cash_ratio", "market_cap_jpy"):
            row[field] = None


def run(csv_dir: str, shared_output: str, grounding_output: str | None,
        top_n: int, pool_n: int) -> int:
    universe = load_prime_universe()
    print(f"[scan] Prime universe: {len(universe)}銘柄")
    rows, fetched = fetch_metrics(universe)
    ratio = fetched / max(len(universe), 1)
    print(f"[scan] fetched={fetched} ({ratio:.0%}), metrics computed={len(rows)}")
    if ratio < _MIN_FETCH_SUCCESS_RATIO:
        print(f"[scan] ABORT: fetch success {ratio:.0%} < {_MIN_FETCH_SUCCESS_RATIO:.0%} — 出力を書かず終了")
        return 1

    # Drop names with stale price history *before* selection so a suspended
    # ticker can't ride the universe-wide freshness of everyone else.
    fresh_rows = [r for r in rows if _price_row_fresh(r.get("last_bar_date"))]
    stale_n = len(rows) - len(fresh_rows)
    if stale_n:
        print(f"[scan] 価格データが古い{stale_n}銘柄を選定対象から除外")
    rows = fresh_rows

    liquid = [r for r in rows if r["turnover_jpy"] >= _MIN_TURNOVER_JPY]
    pool = [r for r in liquid if r["adx"] >= _POOL_MIN_ADX and r["atr_pct"] >= _POOL_MIN_ATR_PCT]
    cands = [r for r in liquid if r["adx"] >= _CAND_MIN_ADX and r["atr_pct"] >= _CAND_MIN_ATR_PCT]
    print(f"[scan] 売買代金≥{_MIN_TURNOVER_JPY / 1e8:.0f}億: {len(liquid)} / "
          f"pool(ADX≥{_POOL_MIN_ADX:.0f},ATR≥{_POOL_MIN_ATR_PCT}%): {len(pool)} / "
          f"cand(ADX≥{_CAND_MIN_ADX:.0f},ATR≥{_CAND_MIN_ATR_PCT}%): {len(cands)}")
    if len(cands) < _MIN_CANDIDATES:
        print(f"[scan] ABORT: 候補{len(cands)}件 < {_MIN_CANDIDATES} — 出力を書かず終了")
        return 1

    csv_asof = attach_fundamentals(rows, csv_dir)
    try:
        fundamentals_date = datetime.strptime(csv_asof, "%Y-%m-%d").date() if csv_asof else None
    except ValueError:
        fundamentals_date = None
    fundamentals_status = market_date_status(fundamentals_date, "combined_fundamentals")
    score_rows(rows, fundamentals_status)
    pool.sort(key=lambda r: r["score_total"], reverse=True)
    cands.sort(key=lambda r: r["score_total"], reverse=True)
    pool = pool[:pool_n]
    cands = cands[:top_n]

    # data_asof = freshness of the price data actually emitted (pool + candidates);
    # selection already dropped stale names, so this is not the universe max.
    emitted = pool + cands
    price_asof = max(r["last_bar_date"] for r in emitted)
    try:
        price_date = datetime.strptime(price_asof, "%Y-%m-%d").date()
    except ValueError:
        price_date = None
    price_status = market_date_status(price_date, "price")
    if price_status != "fresh":
        print(f"[scan] ABORT: price source status={price_status} — 出力を書かず終了")
        return 1
    cfg_info = {
        "preset": "daytrade-scan",
        "universe_size": len(universe),
        "data_asof": market_date_asof(price_asof),
        "fundamentals_asof": market_date_asof(csv_asof) if csv_asof else None,
        "fundamentals_status": fundamentals_status,
        "quality_neutralized": fundamentals_status != "fresh",
        "price_status": price_status,
    }
    for r in pool + cands:
        r["fundamentals_asof"] = market_date_asof(csv_asof) if csv_asof else None
        r["fundamentals_status"] = fundamentals_status
        r["quality_neutralized"] = fundamentals_status != "fresh"
    suppress_stale_fundamentals(pool, fundamentals_status)
    suppress_stale_fundamentals(cands, fundamentals_status)

    med = lambda xs: float(np.median(xs)) if xs else float("nan")
    print(f"[scan] pool median: ADX={med([r['adx'] for r in pool]):.1f} "
          f"turnover={med([r['turnover_jpy'] for r in pool]) / 1e8:.1f}億 "
          f"ATR%={med([r['atr_pct'] for r in pool]):.2f} n={len(pool)}")
    print(f"[scan] cand median: ADX={med([r['adx'] for r in cands]):.1f} n={len(cands)}")

    write_candidates_json(pd.DataFrame(cands), shared_output, cfg_info=cfg_info)
    print(f"[scan] candidates → {shared_output}")
    if grounding_output:
        write_candidates_json(pd.DataFrame(pool), grounding_output, cfg_info=cfg_info)
        print(f"[scan] grounding pool → {grounding_output}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Daytrade price-action scanner")
    parser.add_argument("--csv-dir", default="stock_list/Export")
    parser.add_argument("--shared-output", required=True)
    parser.add_argument("--grounding-output", default=None)
    parser.add_argument("--top", type=int, default=10)
    parser.add_argument("--pool", type=int, default=100)
    args = parser.parse_args()
    sys.exit(run(args.csv_dir, args.shared_output, args.grounding_output, args.top, args.pool))


if __name__ == "__main__":
    main()
