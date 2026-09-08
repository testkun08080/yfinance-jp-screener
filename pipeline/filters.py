import pandas as pd

MARKET_KEYWORDS = {
    "Prime": "プライム",
    "Standard": "スタンダード",
    "Growth": "グロース",
}


def apply_market_filter(df: pd.DataFrame, market: str = "Prime") -> pd.DataFrame:
    if market in ("All", "all", "ALL", None, ""):
        return df.copy()
    keyword = MARKET_KEYWORDS.get(market, market)
    return df[df["優先市場"].str.contains(keyword, na=False)].copy()


def apply_min_market_cap(df: pd.DataFrame, min_cap: float = 0) -> pd.DataFrame:
    if min_cap <= 0:
        return df
    return df[df["時価総額"].fillna(0) >= min_cap].copy()


def apply_sector_filter(df: pd.DataFrame, sectors: list[str]) -> pd.DataFrame:
    if not sectors:
        return df
    return df[df["業種"].isin(sectors)].copy()


def apply_basic_quality_filter(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows that cannot be scored (no PBR or clearly erroneous)."""
    df = df[df["PBR"].notna() & (df["PBR"] > 0)].copy()
    return df


def apply_per_max(df: pd.DataFrame, value: float) -> pd.DataFrame:
    col = "PER(会予)"
    return df[df[col].isna() | (df[col] <= value)].copy()


def apply_pbr_max(df: pd.DataFrame, value: float) -> pd.DataFrame:
    col = "PBR"
    return df[df[col].isna() | (df[col] <= value)].copy()


def apply_roe_min(df: pd.DataFrame, value: float) -> pd.DataFrame:
    col = "ROE"
    return df[df[col].isna() | (df[col] >= value)].copy()


def apply_net_cash_ratio_min(df: pd.DataFrame, value: float) -> pd.DataFrame:
    col = "ネットキャッシュ比率"
    return df[df[col].isna() | (df[col] >= value)].copy()
