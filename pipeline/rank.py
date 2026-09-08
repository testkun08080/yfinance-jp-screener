import json
import pandas as pd
from pipeline.config import CandidateConfig
from pipeline.scorers.fundamentals import score_row
from pipeline.scorers.testa import score_testa, map_grok_sector_to_jpx
from pipeline.load_csv import to_ticker
from pipeline.reference_freshness import usable_intelligence

# Technical scorers are optional (Phase 2)
try:
    from pipeline.scorers.momentum import score_momentum
    from pipeline.scorers.technical import score_technical
    _HAS_TECHNICAL = True
except ImportError:
    _HAS_TECHNICAL = False


def _load_intelligence(intelligence_path: str | None) -> dict:
    if not intelligence_path:
        return {}
    try:
        with open(intelligence_path, encoding="utf-8") as f:
            return usable_intelligence(json.load(f))
    except Exception:
        return {}


def _extract_focus_tickers(focus_stocks: list[str]) -> set[str]:
    """Extract ticker codes from strings like 'トヨタ自動車（7203）'."""
    tickers = set()
    for s in focus_stocks:
        start = s.rfind("（")
        end = s.rfind("）")
        if start != -1 and end != -1:
            code = s[start + 1:end]
            tickers.add(code)
            tickers.add(f"{code}.T")
    return tickers


def apply_lesson_penalties(df: pd.DataFrame, lessons_dir: str | None = None) -> pd.DataFrame:
    """
    Read stock_skills lesson notes from last 7 days and penalise tickers/sectors
    that match recent failure patterns. Returns updated DataFrame.
    """
    import os
    from pathlib import Path
    from datetime import date, timedelta

    if lessons_dir is None:
        lessons_dir = os.environ.get("PIPELINE_LESSONS_DIR")
    if not lessons_dir:
        # Opt-in only: never reach implicitly into a sibling repo.
        return df
    base = Path(lessons_dir)

    if not base.exists():
        return df

    cutoff = (date.today() - timedelta(days=7)).isoformat()
    lesson_files = [p for p in base.glob("*.json") if p.stem[:10] >= cutoff]

    penalised_tickers: dict[str, float] = {}  # ticker → penalty amount
    rsi_penalty = False

    for f in lesson_files:
        try:
            raw = json.loads(f.read_text(encoding="utf-8"))
            notes = raw if isinstance(raw, list) else [raw]
            for data in notes:
                if data.get("type") != "lesson":
                    continue
                trigger = data.get("trigger", "")
                if "RSI" in trigger and "超" in trigger:
                    rsi_penalty = True
                ticker = data.get("symbol") or data.get("ticker")
                if ticker:
                    penalised_tickers[ticker] = penalised_tickers.get(ticker, 0) + 0.1
        except Exception:
            continue

    if not penalised_tickers and not rsi_penalty:
        print("[rank] lesson減点なし")
        return df

    df = df.copy()
    applied_count = 0
    for i, row in df.iterrows():
        ticker = row.get("ticker", "")
        penalty = penalised_tickers.get(ticker, 0)
        # RSI overbought penalty
        rsi = row.get("rsi")
        if rsi_penalty and rsi is not None and rsi > 70:
            penalty += 0.15
        if penalty > 0:
            df.at[i, "score_total"] = max(0.0, round(row["score_total"] - penalty, 4))
            reasons = list(row.get("reasons", []))
            reasons.append(f"lesson⚠️(-{penalty:.2f})")
            df.at[i, "reasons"] = reasons
            applied_count += 1
            print(f"[rank] lesson減点: {ticker} -{penalty:.2f}")

    print(f"[rank] lesson減点適用: {applied_count}銘柄")
    return df.sort_values("score_total", ascending=False).reset_index(drop=True)


def _apply_technical_scores(rows: list[dict], top_factor: int = 3) -> list[dict]:
    """Fetch technical/momentum scores for pre-filtered top candidates."""
    if not _HAS_TECHNICAL:
        return rows
    # Only fetch for pre-candidates (top_n × top_factor) to limit API calls
    for row in rows:
        ticker = row["ticker"]
        print(f"  [technical] {ticker}...", end=" ", flush=True)
        try:
            tech = score_technical(ticker)
            mom = score_momentum(ticker)
            row["score_technical"] = tech["score"]
            row["score_momentum"] = mom
            row["rsi"] = tech["rsi"]
            row["ma_trend"] = tech["ma_trend"]
            row["volume_ratio"] = tech["volume_ratio"]
            # Blend: 70% fundamental + 20% technical + 10% momentum
            row["score_total"] = round(
                row["score_total"] * 0.70 + tech["score"] * 0.20 + mom * 0.10, 4
            )
            if tech["rsi"] > 70:
                row["reasons"].append(f"RSI{tech['rsi']:.0f}⚠️")
            elif tech["rsi"] < 35:
                row["reasons"].append(f"RSI{tech['rsi']:.0f}(売られ過ぎ)")
            print("OK")
        except Exception as e:
            print(f"SKIP({e})")
    return rows


def rank_candidates(
    df: pd.DataFrame,
    cfg: CandidateConfig,
    intelligence: dict | None = None,
    use_technical: bool = False,
    min_score: float = 0.0,
) -> pd.DataFrame:
    """Score, apply bonuses, sort, return top-n DataFrame."""
    if intelligence is None:
        intelligence = {}

    focus_sectors: list[str] = intelligence.get("focus_sectors", [])
    focus_tickers: set[str] = _extract_focus_tickers(intelligence.get("focus_stocks", []))
    upcoming_events: list[dict] = intelligence.get("upcoming_events", [])

    # Grok業種名 → JPX標準業種名の展開リストを事前作成
    jpx_focus_sectors: list[tuple[str, str]] = []  # (grok名, jpx名)
    for fs in focus_sectors:
        jpx_names = map_grok_sector_to_jpx(fs)
        for jpx in jpx_names:
            jpx_focus_sectors.append((fs, jpx))

    rows = []
    for _, row in df.iterrows():
        scores = score_row(row, cfg.value_weight, cfg.quality_weight)
        ticker = to_ticker(str(row["銘柄コード"]))

        bonus = 0.0
        reasons = []

        # Intelligence bonuses（JPX語彙マッピング修正済み）
        sector = str(row.get("業種", ""))
        for grok_name, jpx_name in jpx_focus_sectors:
            if jpx_name in sector:
                bonus += cfg.sector_bonus
                reasons.append(f"注目セクター:{grok_name}({sector})")
                break

        code = str(row.get("銘柄コード", ""))
        if code in focus_tickers or ticker in focus_tickers:
            bonus += cfg.stock_bonus
            reasons.append("Grok注目銘柄")

        # テスタ式スコアリング（PBR割れ×小型株×イベント連想）
        testa_score, testa_reasons = score_testa(row, upcoming_events)
        if testa_score > 0:
            bonus += testa_score * 0.15  # テスタ信号に15%の重み
            reasons.extend(testa_reasons)

        # Explain value reasons
        pbr = row.get("PBR")
        per = row.get("PER(会予)")
        roe = row.get("ROE")
        net_cash = row.get("ネットキャッシュ比率")
        if pd.notna(pbr) and pbr < 1.5:
            reasons.append(f"PBR{pbr:.2f}")
        if pd.notna(per) and 0 < per < 15:
            reasons.append(f"PER{per:.1f}")
        if pd.notna(roe) and roe > 0.10:
            reasons.append(f"ROE{roe*100:.1f}%")
        if pd.notna(net_cash) and net_cash > 0.1:
            reasons.append(f"NCR{net_cash:.2f}")

        total_with_bonus = min(1.0, scores["score_total"] + bonus)

        # イベント連想情報（最初にマッチしたイベント名）
        event_catalyst = None
        if upcoming_events and testa_score > 0:
            for ev in upcoming_events:
                ev_sectors = ev.get("sectors", [])
                ev_stocks = ev.get("stocks", [])
                if any(s in sector for s in ev_sectors) or any(code in s for s in ev_stocks):
                    event_catalyst = ev.get("event")
                    break

        rows.append({
            "ticker": ticker,
            "name": str(row.get("会社名", "")),
            "market": "プライム" if "プライム" in str(row.get("優先市場", "")) else str(row.get("優先市場", "")),
            "sector": sector,
            "score_total": round(total_with_bonus, 4),
            "score_value": scores["score_value"],
            "score_quality": scores["score_quality"],
            "testa_score": testa_score,
            "event_catalyst": event_catalyst,
            "per": float(per) if pd.notna(per) else None,
            "pbr": float(pbr) if pd.notna(pbr) else None,
            "roe": float(roe) if pd.notna(roe) else None,
            "net_cash_ratio": float(net_cash) if pd.notna(net_cash) else None,
            "market_cap_jpy": float(row.get("時価総額")) if pd.notna(row.get("時価総額")) else None,
            "reasons": reasons,
        })

    # First pass: sort by fundamentals, take top_n×3 for technical scoring
    if not rows:
        return pd.DataFrame(columns=[
            "ticker", "name", "market", "sector", "score_total", "score_value",
            "score_quality", "testa_score", "event_catalyst", "per", "pbr",
            "roe", "net_cash_ratio", "market_cap_jpy", "reasons",
        ])
    result = pd.DataFrame(rows).sort_values("score_total", ascending=False)

    if use_technical and _HAS_TECHNICAL:
        pre_candidates = result.head(cfg.top_n * 3).to_dict("records")
        print(f"[rank] 技術指標スコアリング ({len(pre_candidates)}銘柄)...")
        pre_candidates = _apply_technical_scores(pre_candidates)
        result = pd.DataFrame(pre_candidates).sort_values("score_total", ascending=False)

    result = apply_lesson_penalties(result)

    if min_score > 0.0:
        result = result[result["score_total"] >= min_score]
    return result.head(cfg.top_n).reset_index(drop=True)
