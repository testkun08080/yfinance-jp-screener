import builtins
import io
import json
from datetime import date, datetime, timezone

from pipeline.rank import _load_intelligence as load_jp_intelligence
from pipeline.reference_freshness import (
    candidate_freshness_fields,
    intelligence_status,
    market_date_status,
    parse_data_asof,
    usable_intelligence,
)


def test_stale_intelligence_is_not_usable():
    payload = {"fetched_at": "2026-01-01T00:00:00+09:00", "focus_sectors": ["AI"]}
    usable = usable_intelligence(payload, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert usable["intelligence_status"] == "stale"
    assert usable["intelligence_asof"] == {
        "kind": "timestamp",
        "data_asof": "2026-01-01T00:00:00+09:00",
    }
    assert usable["focus_sectors"] == []
    assert usable["focus_stocks"] == []
    assert usable["upcoming_events"] == []


def test_known_legacy_naive_timestamp_assumes_jst_and_month_event_is_excluded():
    payload = {
        "fetched_at": "2026-09-05T08:00:00",
        "focus_sectors": ["AI"],
        "upcoming_events": [{"event": "monthly", "precision": "month"}, {"event": "dated", "precision": "day"}],
    }
    status, assumed = intelligence_status(payload, datetime(2026, 9, 5, 1, tzinfo=timezone.utc))
    usable = usable_intelligence(payload, datetime(2026, 9, 5, 1, tzinfo=timezone.utc))
    assert (status, assumed) == ("fresh", True)
    assert usable["timezone_assumed"] is True
    assert [event["event"] for event in usable["upcoming_events"]] == ["dated"]


def test_tagged_and_legacy_asof_reader_compatibility():
    tagged, assumed = parse_data_asof({"kind": "market_date", "data_asof_date": "2026-09-05"})
    legacy, legacy_assumed = parse_data_asof("2026-09-05T08:00:00")
    assert tagged.isoformat() == "2026-09-05" and assumed is False
    assert legacy.isoformat().endswith("+09:00") and legacy_assumed is True


def test_jp_reader_zero_stale_intelligence_bonus(monkeypatch):
    raw = json.dumps({"fetched_at": "2020-01-01T00:00:00+09:00", "focus_stocks": ["AAPL"]})
    monkeypatch.setattr(builtins, "open", lambda *a, **k: io.StringIO(raw))
    loaded = load_jp_intelligence("ignored.json")
    assert loaded["intelligence_status"] == "stale"
    assert loaded["focus_stocks"] == []


def test_stale_price_market_date_is_detected():
    now = datetime(2026, 9, 5, 9, tzinfo=timezone.utc)
    assert market_date_status(date(2026, 8, 1), "price", now) == "stale"


def test_price_budget_covers_long_jp_exchange_closures():
    assert market_date_status(
        date(2024, 12, 30), "price", datetime(2025, 1, 6, 7, 30, tzinfo=timezone.utc)
    ) == "fresh"
    assert market_date_status(
        date(2029, 12, 28), "price", datetime(2030, 1, 4, 7, 30, tzinfo=timezone.utc)
    ) == "fresh"
    assert market_date_status(
        date(2029, 12, 27), "price", datetime(2030, 1, 5, 7, 30, tzinfo=timezone.utc)
    ) == "stale"


def test_fundamentals_retains_existing_fourteen_day_policy():
    now = datetime(2026, 9, 15, 9, tzinfo=timezone.utc)
    assert market_date_status(date(2026, 9, 1), "combined_fundamentals", now) == "fresh"
    assert market_date_status(date(2026, 8, 31), "combined_fundamentals", now) == "stale"


def test_candidate_and_grounding_root_fields_keep_stale_intelligence_metadata():
    intelligence = usable_intelligence(
        {"fetched_at": "2026-01-01T00:00:00+09:00", "focus_sectors": ["AI"]},
        datetime(2026, 9, 5, tzinfo=timezone.utc),
    )
    fields = candidate_freshness_fields(date(2026, 9, 5), "fresh", intelligence)
    assert fields["data_asof"] == fields["fundamentals_asof"] == {
        "kind": "market_date",
        "data_asof_date": "2026-09-05",
    }
    assert fields["intelligence_status"] == "stale"
    assert fields["intelligence_asof"]["kind"] == "timestamp"
    assert fields["intelligence_timezone_assumed"] is False

    legacy = usable_intelligence(
        {"fetched_at": "2026-01-01T00:00:00"},
        datetime(2026, 9, 5, tzinfo=timezone.utc),
    )
    legacy_fields = candidate_freshness_fields(date(2026, 9, 5), "fresh", legacy)
    assert legacy_fields["intelligence_timezone_assumed"] is True


def test_future_tagged_market_date_is_invalid():
    parsed, assumed = parse_data_asof({"kind": "market_date", "data_asof_date": "2026-09-06"})
    now = datetime(2026, 9, 5, 9, tzinfo=timezone.utc)
    assert assumed is False
    assert market_date_status(parsed, "combined_fundamentals", now) == "invalid"


def test_future_aware_and_legacy_intelligence_are_invalid_and_bonus_free():
    now = datetime(2026, 9, 5, 0, tzinfo=timezone.utc)
    for fetched_at, expected_assumed in (
        ("2026-09-06T09:00:00+09:00", False),
        ("2026-09-06T09:00:00", True),
    ):
        usable = usable_intelligence(
            {"fetched_at": fetched_at, "focus_sectors": ["AI"], "focus_stocks": ["AAPL"]},
            now,
        )
        assert usable["intelligence_status"] == "invalid"
        assert usable["timezone_assumed"] is expected_assumed
        assert usable["intelligence_asof"]["kind"] == "timestamp"
        assert usable["focus_sectors"] == []
        assert usable["focus_stocks"] == []
        assert usable["upcoming_events"] == []

    tagged, assumed = parse_data_asof({
        "kind": "timestamp",
        "data_asof": "2026-09-06T09:00:00+09:00",
    })
    tagged_usable = usable_intelligence({"fetched_at": tagged.isoformat(), "focus_sectors": ["AI"]}, now)
    assert assumed is False
    assert tagged_usable["intelligence_status"] == "invalid"
    assert tagged_usable["focus_sectors"] == []
