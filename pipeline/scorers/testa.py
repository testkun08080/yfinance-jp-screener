import pandas as pd

# Grokが出力するテーマ名 → JPX標準業種名のマッピング
GROK_TO_JPX: dict[str, list[str]] = {
    "半導体": ["電気機器", "精密機器"],
    "テクノロジー": ["情報・通信業", "電気機器"],
    "防衛": ["機械", "その他製品"],
    "AI": ["情報・通信業"],
    "インバウンド": ["サービス業", "小売業"],
    "再生可能エネルギー": ["電気機器", "化学"],
    "物流": ["倉庫・運輸関連業"],
    "自動車": ["輸送用機器"],
    "金融": ["銀行業", "証券", "保険業"],
    "建設": ["建設業"],
    "不動産": ["不動産業"],
    "医療": ["医薬品", "サービス業"],
    "資源": ["石油・石炭製品", "非鉄金属"],
    "食料品": ["食料品"],
    "化学": ["化学"],
    "鉄鋼": ["鉄鋼"],
    "繊維": ["繊維製品"],
}

_CAP_SMALL_MIN = 2_000_000_000   # 20億円
_CAP_SMALL_MAX = 10_000_000_000  # 100億円


def score_testa(
    row: pd.Series,
    upcoming_events: list | None = None,
) -> tuple[float, list[str]]:
    """
    テスタ式conjunction scorer。

    Returns (score, reasons):
      score   — 0.0–1.0。PBR割れ×小型株×イベント連想の3条件AND時に高得点
      reasons — candidatesJSONに記録するラベルリスト

    テスタ氏の3条件:
      1. PBR割れ（0.5倍以下を最優先）
      2. 小型株（時価総額20〜100億円）
      3. イベント連想（ニュースから隠れ銘柄を先読み）
    """
    pbr = row.get("PBR")
    market_cap = row.get("時価総額")
    sector = str(row.get("業種", ""))

    score = 0.0
    reasons: list[str] = []

    # ── 条件1: PBR割れ ─────────────────────────────────────────
    pbr_ok = False
    if pd.notna(pbr) and pbr > 0:
        if pbr < 0.5:
            score += 0.40
            reasons.append(f"テスタ:PBR{pbr:.2f}倍(超割安)")
            pbr_ok = True
        elif pbr < 0.7:
            score += 0.30
            reasons.append(f"テスタ:PBR{pbr:.2f}倍(割安優先)")
            pbr_ok = True
        elif pbr < 1.0:
            score += 0.20
            reasons.append(f"テスタ:PBR{pbr:.2f}倍(割安)")
            pbr_ok = True

    # ── 条件2: 小型株 ────────────────────────────────────────────
    cap_ok = False
    if pd.notna(market_cap) and market_cap > 0:
        cap_bn = market_cap / 1e8
        if _CAP_SMALL_MIN <= market_cap <= _CAP_SMALL_MAX:
            score += 0.30
            reasons.append(f"小型株{cap_bn:.0f}億")
            cap_ok = True
        elif market_cap < _CAP_SMALL_MIN:
            score += 0.05  # 流動性リスクあり、わずかなボーナスのみ

    # ── 条件3: イベント連想 ───────────────────────────────────────
    event_ok = False
    if upcoming_events:
        for event in upcoming_events:
            event_sectors = event.get("sectors", [])
            event_name = event.get("event", "")
            stocks = event.get("stocks", [])
            code = str(row.get("銘柄コード", ""))
            sector_match = any(s in sector for s in event_sectors)
            stock_match = any(code in s for s in stocks)
            if sector_match or stock_match:
                score += 0.30
                reasons.append(f"連想:{event_name}")
                event_ok = True
                break

    # ── Conjunction ボーナス ──────────────────────────────────────
    if pbr_ok and cap_ok:
        score += 0.10
        if event_ok:
            score += 0.10
            reasons.append("テスタ3条件✓")

    return min(1.0, round(score, 4)), reasons


def map_grok_sector_to_jpx(grok_sector: str) -> list[str]:
    """Grokが出力するテーマ名をJPX標準業種名リストに変換する。"""
    return GROK_TO_JPX.get(grok_sector, [grok_sector])
