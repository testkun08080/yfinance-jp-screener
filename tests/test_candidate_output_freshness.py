import json
from datetime import date, datetime

import pandas as pd

from pipeline.output import write_candidates_json
from pipeline.reference_freshness import candidate_freshness_fields, usable_intelligence


def test_candidate_and_grounding_outputs_preserve_stale_intelligence_status(tmp_path):
    intelligence = usable_intelligence({"fetched_at": "2020-01-01T00:00:00+09:00"})
    cfg = {
        "preset": "morning-value",
        "quality_neutralized": False,
        **candidate_freshness_fields(date.today(), "fresh", intelligence),
    }
    for name in ("jp_candidates.json", "jp_grounding.json", "us_candidates.json"):
        path = tmp_path / name
        write_candidates_json(pd.DataFrame([{"ticker": "7203.T"}]), str(path), cfg, intelligence)
        payload = json.loads(path.read_text(encoding="utf-8"))
        assert payload["intelligence_status"] == "stale"
        assert payload["intelligence_asof"]["kind"] == "timestamp"
        assert payload["data_asof"]["kind"] == "market_date"
        assert payload["fundamentals_asof"]["kind"] == "market_date"
        assert payload["quality_neutralized"] is False
        assert payload["candidates"][0]["quality_neutralized"] is False
        assert payload["focus_sectors"] == []
        assert payload["intelligence_timezone_assumed"] is False
        assert datetime.fromisoformat(payload["generated_at"]).utcoffset() is not None

    legacy = usable_intelligence({"fetched_at": "2020-01-01T00:00:00"})
    legacy_cfg = {
        "preset": "morning-value",
        "quality_neutralized": True,
        **candidate_freshness_fields(date.today(), "fresh", legacy),
    }
    legacy_path = tmp_path / "legacy.json"
    write_candidates_json(pd.DataFrame([{"ticker": "7203.T"}]), str(legacy_path), legacy_cfg, legacy)
    legacy_payload = json.loads(legacy_path.read_text(encoding="utf-8"))
    assert legacy_payload["intelligence_timezone_assumed"] is True
    assert legacy_payload["quality_neutralized"] is True
    assert legacy_payload["candidates"][0]["quality_neutralized"] is True
