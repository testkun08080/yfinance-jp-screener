import json
import sys
from datetime import date
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.rank import apply_lesson_penalties


def test_apply_lesson_penalties_ticker_penalty_and_resort(tmp_path):
    """該当tickerが減点され、reasonsに追記され、score_total降順で再ソートされること。"""
    today = date.today().isoformat()
    lesson_file = tmp_path / f"{today}_test.json"
    lesson_file.write_text(
        json.dumps([{"type": "lesson", "trigger": "PBR割れ", "symbol": "1234"}]),
        encoding="utf-8",
    )

    df = pd.DataFrame([
        {"ticker": "1234", "score_total": 0.55, "reasons": []},
        {"ticker": "5678", "score_total": 0.50, "reasons": []},
    ])

    result = apply_lesson_penalties(df, lessons_dir=str(tmp_path))

    row_1234 = result[result["ticker"] == "1234"].iloc[0]
    assert row_1234["score_total"] == 0.45
    assert any("lesson⚠️" in r for r in row_1234["reasons"])
    # 減点後は5678(0.50)が1234(0.45)より上位になり、順位が逆転する
    assert result.iloc[0]["ticker"] == "5678"
    assert result.iloc[1]["ticker"] == "1234"


def test_apply_lesson_penalties_no_lessons_df_unchanged(tmp_path):
    """lessonファイルが存在しない場合、dfのscore_total/reasonsが変化しないこと。"""
    df = pd.DataFrame([
        {"ticker": "1234", "score_total": 0.55, "reasons": []},
        {"ticker": "5678", "score_total": 0.50, "reasons": []},
    ])

    result = apply_lesson_penalties(df, lessons_dir=str(tmp_path))

    assert result["score_total"].tolist() == df["score_total"].tolist()
    assert result["reasons"].tolist() == df["reasons"].tolist()


def test_apply_lesson_penalties_skips_broken_json(tmp_path):
    """壊れたJSONファイルがあっても例外にならず、正常なファイル分のみ処理されること。"""
    today = date.today().isoformat()
    broken_file = tmp_path / f"{today}_broken.json"
    broken_file.write_text("{invalid json,,,", encoding="utf-8")

    good_file = tmp_path / f"{today}_good.json"
    good_file.write_text(
        json.dumps([{"type": "lesson", "trigger": "PBR割れ", "symbol": "1234"}]),
        encoding="utf-8",
    )

    df = pd.DataFrame([
        {"ticker": "1234", "score_total": 0.55, "reasons": []},
        {"ticker": "5678", "score_total": 0.50, "reasons": []},
    ])

    result = apply_lesson_penalties(df, lessons_dir=str(tmp_path))

    row_1234 = result[result["ticker"] == "1234"].iloc[0]
    assert row_1234["score_total"] == 0.45
    row_5678 = result[result["ticker"] == "5678"].iloc[0]
    assert row_5678["score_total"] == 0.50
