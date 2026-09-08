import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.config import load_preset, PRESET_DEFAULTS


def test_load_preset_momentum_matches_yaml():
    """momentumはデイトレ向けにquality偏重で、defaultとは意図的に異なる。"""
    preset = load_preset("momentum")
    assert preset["value_weight"] == 0.2
    assert preset["quality_weight"] == 0.8
    assert preset["value_weight"] + preset["quality_weight"] == 1.0
    assert preset["filters"] == {"min_market_cap": 100_000_000_000}


def test_load_preset_unknown_name_falls_back_to_default():
    """未定義プリセット名はデフォルト値にフォールバックすること。"""
    preset = load_preset("no-such-preset-xyz")
    assert preset == PRESET_DEFAULTS


def test_load_preset_morning_value_differs_from_default():
    """morning-valueはpresets.yaml定義通りの値(デフォルトと同値だがfiltersあり)を返すこと。"""
    preset = load_preset("morning-value")
    assert preset["value_weight"] == 0.5
    assert preset["quality_weight"] == 0.5
    assert preset["filters"] == {"per_max": 20, "pbr_max": 2.0}


def test_load_preset_testa_value_differs_from_default():
    """testa-valueはデフォルトと異なるweightを持つこと(適用ゲートによる挙動不変性の確認材料)。"""
    preset = load_preset("testa-value")
    assert preset["value_weight"] == 0.7
    assert preset["quality_weight"] == 0.3
    assert preset["filters"] == {"pbr_max": 1.0, "net_cash_ratio_min": 0.1}
