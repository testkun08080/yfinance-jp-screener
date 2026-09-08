import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.scorers.technical import _rsi


def test_rsi_all_gains_near_100():
    """全上昇系列ではRSIが100に近い(過熱)こと。"""
    closes = pd.Series([100 + i for i in range(30)], dtype=float)
    rsi = _rsi(closes)
    assert rsi >= 95.0


def test_rsi_all_losses_near_0():
    """全下落系列ではRSIが0に近い(売られ過ぎ)こと。"""
    closes = pd.Series([100 - i for i in range(30)], dtype=float)
    rsi = _rsi(closes)
    assert rsi <= 5.0


def test_rsi_flat_series_returns_50():
    """変化なし系列ではgain=loss=0となりRSI=50.0(中立)を返すこと。"""
    closes = pd.Series([100.0] * 30)
    rsi = _rsi(closes)
    assert rsi == 50.0


def test_rsi_mixed_series_between_0_and_100():
    """通常の増減混在系列ではRSIが0と100の間に収まること。"""
    values = [100, 102, 101, 103, 99, 100, 104, 98, 105, 97,
              106, 96, 107, 95, 108, 94, 109, 93, 110, 92,
              111, 91, 112, 90, 113, 89, 114, 88, 115, 87]
    closes = pd.Series(values, dtype=float)
    rsi = _rsi(closes)
    assert 0 < rsi < 100
