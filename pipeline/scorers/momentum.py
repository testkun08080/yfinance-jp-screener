"""Momentum scorer using yfinance 20-day return."""
import yfinance as yf


def score_momentum(ticker: str, lookback_days: int = 20) -> float:
    """
    Download last lookback_days+5 trading days and compute return.
    Returns 0.0-1.0. Returns 0.5 (neutral) on any error.
    """
    try:
        hist = yf.Ticker(ticker).history(period=f"{lookback_days + 10}d", auto_adjust=True)
        if hist.empty or len(hist) < 5:
            return 0.5
        ret = (hist["Close"].iloc[-1] - hist["Close"].iloc[0]) / hist["Close"].iloc[0]
        # Map return to score: -20%→0.1, 0%→0.5, +10%→0.75, +20%→0.9
        if ret > 0.20:
            return 0.90
        elif ret > 0.10:
            return 0.75
        elif ret > 0.05:
            return 0.65
        elif ret > 0.00:
            return 0.55
        elif ret > -0.05:
            return 0.45
        elif ret > -0.10:
            return 0.35
        else:
            return 0.20
    except Exception:
        return 0.5
