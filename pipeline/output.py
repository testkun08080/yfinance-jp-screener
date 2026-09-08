import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import pandas as pd


def write_candidates_json(
    result_df: pd.DataFrame,
    output_path: str,
    cfg_info: dict | None = None,
    intelligence: dict | None = None,
) -> str:
    """Write ranked candidates to JSON. Returns the path written."""
    candidates = []
    for _, row in result_df.iterrows():
        entry = row.to_dict()
        # Convert NaN to None for JSON serialization
        entry = {k: (None if (isinstance(v, float) and pd.isna(v)) else v) for k, v in entry.items()}
        if "quality_neutralized" in (cfg_info or {}):
            entry.setdefault("quality_neutralized", bool(cfg_info["quality_neutralized"]))
        candidates.append(entry)

    generated_at = datetime.now(ZoneInfo("Asia/Tokyo"))
    payload = {
        "date": generated_at.strftime("%Y-%m-%d"),
        "preset": (cfg_info or {}).get("preset", "morning-value"),
        "generated_at": generated_at.isoformat(),
        "universe_size": (cfg_info or {}).get("universe_size", len(result_df)),
        # 元データ(CSV)の生成時刻。generated_at(=本スクリプトの実行時刻)とは別物で、
        # 消費側が「候補は今日作られたが中身は何日前のデータか」を判定するために使う。
        "data_asof": (cfg_info or {}).get("data_asof"),
        "fundamentals_asof": (cfg_info or {}).get("fundamentals_asof"),
        "fundamentals_status": (cfg_info or {}).get("fundamentals_status"),
        "quality_neutralized": (cfg_info or {}).get("quality_neutralized"),
        "price_status": (cfg_info or {}).get("price_status"),
        "intelligence_status": (cfg_info or {}).get("intelligence_status"),
        "intelligence_asof": (cfg_info or {}).get("intelligence_asof"),
        "intelligence_timezone_assumed": (cfg_info or {}).get("intelligence_timezone_assumed", False),
        "focus_sectors": (intelligence or {}).get("focus_sectors", []),
        "candidates": candidates,
    }

    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(path.resolve())
