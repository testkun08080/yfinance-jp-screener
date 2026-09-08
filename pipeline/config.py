from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class CandidateConfig:
    top_n: int = 15
    market: str = "Prime"          # Prime / Standard / Growth
    min_market_cap: float = 0      # 0 = no filter
    preset: str = "morning-value"
    value_weight: float = 0.5
    quality_weight: float = 0.5
    sector_bonus: float = 0.2      # bonus when sector matches focus_sectors
    stock_bonus: float = 0.3       # bonus when ticker matches focus_stocks
    exclude_sectors: list = field(default_factory=list)


_PRESETS_PATH = Path(__file__).parent / "presets" / "presets.yaml"

# CandidateConfig のデフォルトと同値。presets.yaml 不在・プリセット名未定義時のフォールバック。
PRESET_DEFAULTS = {"value_weight": 0.5, "quality_weight": 0.5, "filters": {}}


def load_preset(name: str) -> dict:
    """presets.yaml から指定プリセットの value_weight/quality_weight/filters を読み込む。

    presets.yaml が存在しない、または name が未定義の場合は警告をprintし、
    PRESET_DEFAULTS(CandidateConfigの既定値と同値・filtersなし)を返す。
    呼び出し側でCandidateConfigへ適用するかどうかは呼び出し側の責務(本関数は読込のみ)。
    """
    try:
        with open(_PRESETS_PATH, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    except FileNotFoundError:
        print(f"[config] presets.yaml not found ({_PRESETS_PATH}), using defaults for preset='{name}'")
        return dict(PRESET_DEFAULTS)

    preset = (data.get("presets") or {}).get(name)
    if preset is None:
        print(f"[config] preset '{name}' not defined in presets.yaml, using defaults")
        return dict(PRESET_DEFAULTS)

    return {
        "value_weight": preset.get("value_weight", PRESET_DEFAULTS["value_weight"]),
        "quality_weight": preset.get("quality_weight", PRESET_DEFAULTS["quality_weight"]),
        "filters": preset.get("filters") or {},
    }
