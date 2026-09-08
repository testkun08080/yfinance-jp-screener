import pandas as pd


def score_value(row: pd.Series) -> float:
    """Score valuation attractiveness. Returns 0.0-1.0."""
    score = 0.5

    pbr = row.get("PBR")
    if pd.notna(pbr) and pbr > 0:
        if pbr < 0.5:
            score += 0.30
        elif pbr < 1.0:
            score += 0.20
        elif pbr < 1.5:
            score += 0.10
        elif pbr > 3.0:
            score -= 0.20

    per = row.get("PER(会予)")
    if pd.notna(per) and per > 0:
        if per < 8:
            score += 0.20
        elif per < 12:
            score += 0.15
        elif per < 15:
            score += 0.08
        elif per > 30:
            score -= 0.20
        elif per > 20:
            score -= 0.10

    return max(0.0, min(1.0, score))


def score_quality(row: pd.Series) -> float:
    """Score business quality. Returns 0.0-1.0."""
    score = 0.5

    roe = row.get("ROE")
    if pd.notna(roe):
        if roe > 0.15:
            score += 0.20
        elif roe > 0.10:
            score += 0.10
        elif roe > 0.05:
            score += 0.05
        elif roe < 0:
            score -= 0.20

    net_cash = row.get("ネットキャッシュ比率")
    if pd.notna(net_cash):
        if net_cash > 0.30:
            score += 0.15
        elif net_cash > 0.10:
            score += 0.08
        elif net_cash < -0.20:
            score -= 0.10

    op_margin = row.get("営業利益率")
    if pd.notna(op_margin):
        if op_margin > 0.15:
            score += 0.10
        elif op_margin > 0.08:
            score += 0.05
        elif op_margin < 0:
            score -= 0.15

    equity_ratio = row.get("自己資本比率")
    if pd.notna(equity_ratio):
        if equity_ratio > 0.50:
            score += 0.05
        elif equity_ratio < 0.20:
            score -= 0.05

    return max(0.0, min(1.0, score))


def score_row(row: pd.Series, value_weight: float = 0.5, quality_weight: float = 0.5) -> dict:
    sv = score_value(row)
    sq = score_quality(row)
    total = sv * value_weight + sq * quality_weight
    return {"score_value": round(sv, 4), "score_quality": round(sq, 4), "score_total": round(total, 4)}
