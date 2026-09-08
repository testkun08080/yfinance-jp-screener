import os
import glob
import pandas as pd


def load_latest_combined_csv(csv_dir: str) -> tuple[pd.DataFrame, str]:
    """Find the latest combined CSV in csv_dir and load it as DataFrame."""
    patterns = [
        os.path.join(csv_dir, "*_jp_combined.csv"),
        os.path.join(csv_dir, "*_combined.csv"),
    ]
    files = []
    for p in patterns:
        files.extend(glob.glob(p))

    if not files:
        raise FileNotFoundError(f"No combined CSV found in: {csv_dir}")

    latest = max(files, key=os.path.getmtime)
    df = pd.read_csv(latest, encoding="utf-8", dtype={"銘柄コード": str})
    return df, latest


def to_ticker(code: str) -> str:
    """Convert JPX code '1301' → yfinance ticker '1301.T'."""
    return f"{code}.T"
