"""Small shared freshness policy and legacy-compatible as-of parsing."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


JST = ZoneInfo("Asia/Tokyo")
SOURCE_POLICY = {
    "combined_fundamentals": {"max_age_days": 14},
    "intelligence": {"max_age_hours": 48},
    "price": {"max_age_days": 8},
}


def market_date_asof(value: str) -> dict:
    return {"kind": "market_date", "data_asof_date": value}


def timestamp_asof(value: datetime) -> dict:
    if value.tzinfo is None:
        raise ValueError("timestamp as-of must be timezone-aware")
    return {"kind": "timestamp", "data_asof": value.isoformat()}


def parse_data_asof(value: object, *, assume_legacy_jst: bool = True):
    """Read tagged as-of values and the legacy string formats they replace."""
    if isinstance(value, dict):
        if value.get("kind") == "market_date":
            raw = value.get("data_asof_date")
            try:
                return date.fromisoformat(raw), False
            except (TypeError, ValueError):
                return None, False
        if value.get("kind") == "timestamp":
            return parse_known_timestamp(value.get("data_asof"), assume_legacy_jst=False)
        return None, False
    if isinstance(value, str):
        try:
            return date.fromisoformat(value), False
        except ValueError:
            return parse_known_timestamp(value, assume_legacy_jst=assume_legacy_jst)
    return None, False


def combined_market_date(path: str | Path) -> date | None:
    """Market date from a combined/raw CSV filename.

    Handles the JP combined form ("20260418_jp_combined.csv", leading token) and
    filenames that embed the date as a YYYYMMDD token elsewhere in the stem
    (before a HHMMSS run stamp). Returns the first underscore-separated token
    that parses as a real date, else None.
    """
    for token in Path(path).stem.split("_"):
        if len(token) == 8 and token.isdigit():
            try:
                return datetime.strptime(token, "%Y%m%d").date()
            except ValueError:
                continue
    return None


def market_date_status(value: date | None, source: str, now: datetime | None = None) -> str:
    if value is None:
        return "missing"
    now_date = (now or datetime.now(JST)).astimezone(JST).date()
    if value > now_date:
        return "invalid"
    return "fresh" if now_date - value <= timedelta(days=SOURCE_POLICY[source]["max_age_days"]) else "stale"


def parse_known_timestamp(value: object, *, assume_legacy_jst: bool = False) -> tuple[datetime | None, bool]:
    if not isinstance(value, str) or not value.strip():
        return None, False
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None, False
    if parsed.tzinfo is None:
        if not assume_legacy_jst:
            return None, False
        return parsed.replace(tzinfo=JST), True
    return parsed, False


def intelligence_status(payload: dict, now: datetime | None = None) -> tuple[str, bool]:
    # fetched_at is a known producer field; legacy naive values are interpreted as JST.
    parsed, assumed = parse_known_timestamp(payload.get("fetched_at"), assume_legacy_jst=True)
    if parsed is None:
        return "missing", assumed
    current = now or datetime.now(timezone.utc)
    current_utc = current.astimezone(timezone.utc)
    parsed_utc = parsed.astimezone(timezone.utc)
    if parsed_utc > current_utc:
        return "invalid", assumed
    age = current_utc - parsed_utc
    status = "fresh" if age <= timedelta(hours=SOURCE_POLICY["intelligence"]["max_age_hours"]) else "stale"
    return status, assumed


def usable_intelligence(payload: dict, now: datetime | None = None) -> dict:
    """Return scoring-safe intelligence while retaining freshness observability."""
    parsed, assumed = parse_known_timestamp(payload.get("fetched_at"), assume_legacy_jst=True)
    status, _ = intelligence_status(payload, now)
    intelligence_asof = timestamp_asof(parsed) if parsed else None
    metadata = {
        "intelligence_status": status,
        "intelligence_asof": intelligence_asof,
        "timezone_assumed": assumed,
    }
    if status != "fresh":
        return {
            **metadata,
            "focus_sectors": [],
            "focus_stocks": [],
            "upcoming_events": [],
        }
    cleaned = {**payload, **metadata}
    # Month-only events are context, not a near-term catalyst.
    cleaned["upcoming_events"] = [
        event for event in payload.get("upcoming_events", [])
        if event.get("precision") != "month"
    ]
    return cleaned


def candidate_freshness_fields(
    fundamentals_date: date | None,
    fundamentals_status: str,
    intelligence: dict,
) -> dict:
    """Build consistent root freshness fields for candidate artifacts."""
    fundamentals_asof = market_date_asof(fundamentals_date.isoformat()) if fundamentals_date else None
    return {
        "data_asof": fundamentals_asof,
        "fundamentals_asof": fundamentals_asof,
        "fundamentals_status": fundamentals_status,
        "intelligence_status": intelligence.get("intelligence_status", "missing"),
        "intelligence_asof": intelligence.get("intelligence_asof"),
        "intelligence_timezone_assumed": bool(intelligence.get("timezone_assumed", False)),
    }
