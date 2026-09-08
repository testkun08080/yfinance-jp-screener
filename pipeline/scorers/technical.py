"""Technical indicator scorer using yfinance OHLCV data."""
import yfinance as yf
import pandas as pd


def _rsi(closes: pd.Series, period: int = 14) -> float:
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss
    rsi = 100 - 100 / (1 + rs)
    if rsi.empty:
        return 50.0
    last = rsi.iloc[-1]
    return float(last) if pd.notna(last) else 50.0


def score_technical(ticker: str) -> dict:
    """
    Compute RSI, MA5/15/60 trend, volume ratio for the ticker.
    Returns {"score": float, "rsi": float, "ma_trend": str, "volume_ratio": float}.
    Returns neutral dict on any error.
    """
    neutral = {"score": 0.5, "rsi": 50.0, "ma_trend": "neutral", "volume_ratio": 1.0}
    try:
        hist = yf.Ticker(ticker).history(period="90d", interval="1d", auto_adjust=True)
        if hist.empty or len(hist) < 20:
            return neutral

        closes = hist["Close"]
        volumes = hist["Volume"]

        rsi = _rsi(closes)
        ma5 = float(closes.rolling(5).mean().iloc[-1])
        ma15 = float(closes.rolling(15).mean().iloc[-1])
        ma60_series = closes.rolling(60).mean()
        ma60 = float(ma60_series.iloc[-1]) if not ma60_series.dropna().empty else ma15
        price = float(closes.iloc[-1])

        vol_avg = float(volumes.rolling(20).mean().iloc[-1]) if len(volumes) >= 20 else 1
        vol_ratio = float(volumes.iloc[-1]) / vol_avg if vol_avg > 0 else 1.0

        # MA trend
        if price > ma5 > ma15:
            ma_trend = "bullish"
        elif price < ma5 < ma15:
            ma_trend = "bearish"
        else:
            ma_trend = "neutral"

        # Score
        score = 0.5

        # RSI: avoid overbought, prefer oversold
        if rsi < 30:
            score += 0.20   # oversold
        elif rsi < 45:
            score += 0.10
        elif rsi > 70:
            score -= 0.20   # overbought
        elif rsi > 60:
            score -= 0.05

        # MA trend
        if ma_trend == "bullish":
            score += 0.15
        elif ma_trend == "bearish":
            score -= 0.15

        # Volume: high volume on uptrend is bullish
        if vol_ratio > 1.5 and ma_trend == "bullish":
            score += 0.10
        elif vol_ratio < 0.5:
            score -= 0.05

        return {
            "score": round(max(0.0, min(1.0, score)), 4),
            "rsi": round(rsi, 1),
            "ma_trend": ma_trend,
            "volume_ratio": round(vol_ratio, 2),
        }
    except Exception:
        return neutral
