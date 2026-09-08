"""
Daily screening pipeline entry point.

Usage:
  python -m pipeline.run_daily
  python -m pipeline.run_daily --top 20 --market Prime --preset morning-value
  python -m pipeline.run_daily --csv-dir stock_list/Export --intelligence-json path/to/intelligence_latest.json
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

# Windows のコンソール標準出力は既定で cp932 のため、ログ内の em dash(—) や
# ≥ / ⚠️ などをエンコードできず print がクラッシュする。stdout/stderr を UTF-8 化して回避する。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

# Allow running from yfinance-jp-screener root
sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.config import CandidateConfig, load_preset
from pipeline.filters import (
    apply_basic_quality_filter,
    apply_market_filter,
    apply_min_market_cap,
    apply_per_max,
    apply_pbr_max,
    apply_roe_min,
    apply_net_cash_ratio_min,
)
from pipeline.load_csv import load_latest_combined_csv
from pipeline.output import write_candidates_json
from pipeline.rank import rank_candidates, _load_intelligence
from pipeline.scorers.liquidity import enrich_with_liquidity
from pipeline.reference_freshness import candidate_freshness_fields, combined_market_date, market_date_status


DEFAULT_CSV_DIR = str(Path(__file__).parent.parent / "stock_list" / "Export")
DEFAULT_OUTPUT_DIR = str(Path(__file__).parent.parent / "data" / "candidates")
# Writing outside the clone is opt-in: pass --shared-output / --intelligence-json
# or set the env vars. Defaults are None so `python -m pipeline.run_daily` never
# reaches into sibling directories.
DEFAULT_SHARED = os.environ.get("PIPELINE_SHARED_OUTPUT") or None
DEFAULT_INTELLIGENCE = os.environ.get("PIPELINE_INTELLIGENCE_JSON") or None


_SMALL_CAP_MIN = 2_000_000_000   # 20億円
_SMALL_CAP_MAX = 10_000_000_000  # 100億円
_SMALL_CAP_SLOTS = 15            # 小型株レーンで確保するスロット数
_MAIN_MIN_SCORE  = 0.82          # 通常レーン足切り閾値
_TESTA_MIN_SCORE = 0.70          # 小型株レーン testa_score 足切り閾値
_SMALL_CAP_MIN_AVG_TURNOVER_JPY = 50_000_000  # 20日平均売買代金の下限(5,000万円)

_GROUNDING_MIN_SCORE = 0.5   # グラウンディングプール（AI推奨向け広域候補）の足切り閾値
_GROUNDING_TOP_TOTAL = 100   # グラウンディングプールの合計件数上限（通常レーン+小型株レーン）

# presets.yaml の filters キーのうち、pipeline/filters.py 関数で対応可能なもの。
_KNOWN_PRESET_FILTER_KEYS = {"min_market_cap", "per_max", "pbr_max", "roe_min", "net_cash_ratio_min"}


def _apply_preset(df: pd.DataFrame, cfg: CandidateConfig, preset_name: str, use_presets: bool) -> tuple[pd.DataFrame, CandidateConfig]:
    """use_presets=True の場合のみ presets.yaml の value_weight/quality_weight/filters を
    df・cfg に適用する。デフォルト(use_presets=False)では何もせず、そのまま返す
    (=presets.yaml未ロード状態の現行挙動を完全に維持するゲート)。"""
    if not use_presets:
        return df, cfg

    preset = load_preset(preset_name)
    cfg.value_weight = preset["value_weight"]
    cfg.quality_weight = preset["quality_weight"]
    for key, value in preset["filters"].items():
        if key == "min_market_cap":
            df = apply_min_market_cap(df, value)
        elif key == "per_max":
            df = apply_per_max(df, value)
        elif key == "pbr_max":
            df = apply_pbr_max(df, value)
        elif key == "roe_min":
            df = apply_roe_min(df, value)
        elif key == "net_cash_ratio_min":
            df = apply_net_cash_ratio_min(df, value)
        else:
            print(f"[pipeline] preset '{preset_name}' の filter '{key}'={value} は未対応のためスキップします")
    return df, cfg


def _build_grounding_pool(
    df: pd.DataFrame,
    df_raw: pd.DataFrame,
    market: str,
    preset: str,
    min_market_cap: float,
    intelligence: dict | None,
    use_technical: bool,
    use_presets: bool = False,
) -> pd.DataFrame:
    """AI推奨のgroundingモード向けに、足切りを緩めた広い候補プールを作る。
    通常レーン（min_score=0.5・上位100件）+小型株レーン（20〜100億円）を合算し、
    通常出力(ranked)の足切り・件数には一切影響しない。"""
    cfg_wide = CandidateConfig(top_n=_GROUNDING_TOP_TOTAL, market=market, preset=preset, min_market_cap=min_market_cap)
    df_wide, cfg_wide = _apply_preset(df, cfg_wide, preset, use_presets)
    ranked_wide = rank_candidates(df_wide, cfg_wide, intelligence, use_technical=use_technical, min_score=_GROUNDING_MIN_SCORE)

    df_small = df_raw[
        df_raw["時価総額"].fillna(0).between(_SMALL_CAP_MIN, _SMALL_CAP_MAX)
    ].copy()
    df_small = apply_basic_quality_filter(df_small)

    pool = ranked_wide
    if len(df_small) > 0:
        cfg_small_wide = CandidateConfig(
            top_n=_GROUNDING_TOP_TOTAL, market="All", preset=preset, min_market_cap=0
        )
        df_small_wide, cfg_small_wide = _apply_preset(df_small, cfg_small_wide, preset, use_presets)
        ranked_small_wide = rank_candidates(df_small_wide, cfg_small_wide, intelligence, use_technical=False)
        wide_tickers = set(ranked_wide["ticker"].tolist())
        ranked_small_wide = ranked_small_wide[~ranked_small_wide["ticker"].isin(wide_tickers)]
        pool = pd.concat([ranked_wide, ranked_small_wide], ignore_index=True)

    return pool.head(_GROUNDING_TOP_TOTAL)


def _apply_liquidity_filter(df: pd.DataFrame, min_avg_turnover_jpy: float, lookback_days: int = 20) -> pd.DataFrame:
    """
    20日平均売買代金(終値×出来高)が min_avg_turnover_jpy 未満の銘柄を除外する。

    現行パイプラインの結合CSVには出来高列が存在しないため、この関数のみ
    ticker単位でyfinanceの日足履歴を追加取得する。呼び出し側で候補数を
    事前に絞ってから渡すこと（全銘柄に対して呼ぶとAPI呼び出しが増えすぎる）。
    データ取得に失敗した銘柄は判定不能として除外せず通過させる。
    """
    import yfinance as yf

    keep_flags = []
    for ticker in df["ticker"]:
        try:
            hist = yf.Ticker(ticker).history(period=f"{lookback_days + 10}d", auto_adjust=True)
            if hist.empty or len(hist) < 5:
                keep_flags.append(True)  # データ欠損は通過させる
                continue
            turnover = (hist["Close"] * hist["Volume"]).tail(lookback_days)
            avg_turnover = float(turnover.mean())
            keep_flags.append(avg_turnover >= min_avg_turnover_jpy)
        except Exception:
            keep_flags.append(True)  # 取得失敗も通過させる（安全側）

    return df[pd.Series(keep_flags, index=df.index)].copy()


def run(
    csv_dir: str = DEFAULT_CSV_DIR,
    intelligence_json: str | None = DEFAULT_INTELLIGENCE,
    output: str | None = None,
    shared_output: str | None = DEFAULT_SHARED,
    grounding_output: str | None = None,
    top: int = 15,
    market: str = "Prime",
    preset: str = "morning-value",
    min_market_cap: float = 0,
    use_technical: bool = False,
    use_presets: bool = False,
    enrich_liquidity: bool = False,
) -> str:
    today = datetime.now().strftime("%Y%m%d")
    if output is None:
        output = str(Path(DEFAULT_OUTPUT_DIR) / f"{today}_candidates.json")

    print(f"[pipeline] CSV読込: {csv_dir}")
    df_raw, csv_path = load_latest_combined_csv(csv_dir)
    print(f"[pipeline] {len(df_raw)}銘柄 ({Path(csv_path).name})")

    # Filters（通常レーン: Prime市場 + 指定市場上限以上）
    df = apply_market_filter(df_raw, market)
    df = apply_min_market_cap(df, min_market_cap)
    df = apply_basic_quality_filter(df)
    universe_size = len(df)
    print(f"[pipeline] フィルター後: {universe_size}銘柄")

    fundamentals_date = combined_market_date(csv_path)
    fundamentals_status = market_date_status(fundamentals_date, "combined_fundamentals")

    # Intelligence
    intelligence = _load_intelligence(intelligence_json)
    if intelligence:
        print(f"[pipeline] 注目セクター: {intelligence.get('focus_sectors', [])}")
        events = intelligence.get("upcoming_events", [])
        if events:
            print(f"[pipeline] 予定イベント: {len(events)}件")

    # 通常レーン・小型株レーンのスロット配分。top指定がSMALL_CAP_SLOTS*2未満でも
    # 小型株レーンが1件未満に潰れないよう按分する(旧: main_slots=max(1,top-15)固定で
    # top=10指定時にmain=1・small=15上限のまま小型株が0件枯渇していた問題の是正)。
    small_slots = min(_SMALL_CAP_SLOTS, top // 2)
    main_slots = max(1, top - small_slots)
    cfg = CandidateConfig(top_n=main_slots, market=market, preset=preset, min_market_cap=min_market_cap)
    df, cfg = _apply_preset(df, cfg, preset, use_presets)
    ranked = rank_candidates(df, cfg, intelligence, use_technical=use_technical, min_score=_MAIN_MIN_SCORE)
    print(f"[pipeline] 通常レーン: {len(ranked)}銘柄を選出 (score>={_MAIN_MIN_SCORE})")

    # 小型株レーン（テスタ式: 20〜100億円、全市場）
    df_small = df_raw[
        df_raw["時価総額"].fillna(0).between(_SMALL_CAP_MIN, _SMALL_CAP_MAX)
    ].copy()
    df_small = apply_basic_quality_filter(df_small)
    print(f"[pipeline] 小型株レーン: {len(df_small)}銘柄（20〜100億円）")

    if len(df_small) > 0:
        cfg_small = CandidateConfig(
            top_n=_SMALL_CAP_SLOTS * 3, market="All", preset=preset, min_market_cap=0
        )
        df_small, cfg_small = _apply_preset(df_small, cfg_small, preset, use_presets)
        ranked_small = rank_candidates(df_small, cfg_small, intelligence, use_technical=False)
        main_tickers = set(ranked["ticker"].tolist())
        ranked_small = ranked_small[ranked_small["testa_score"] >= _TESTA_MIN_SCORE]
        ranked_small = ranked_small[~ranked_small["ticker"].isin(main_tickers)]

        pre_liquidity_count = len(ranked_small)
        ranked_small = _apply_liquidity_filter(ranked_small, _SMALL_CAP_MIN_AVG_TURNOVER_JPY)
        filtered_count = pre_liquidity_count - len(ranked_small)
        print(f"[pipeline] 流動性フィルタ(20日平均売買代金>={_SMALL_CAP_MIN_AVG_TURNOVER_JPY:,}円): {filtered_count}銘柄を除外")

        ranked_small = ranked_small.head(small_slots)
        if len(ranked_small) > 0:
            ranked = pd.concat([ranked, ranked_small], ignore_index=True)
            print(f"[pipeline] 小型株{len(ranked_small)}銘柄を追加 → 合計{len(ranked)}銘柄 (testa>={_TESTA_MIN_SCORE})")

    # Output
    cfg_info = {
        "preset": preset,
        "universe_size": universe_size,
        "quality_neutralized": False,
        **candidate_freshness_fields(fundamentals_date, fundamentals_status, intelligence),
    }
    path = write_candidates_json(ranked, output, cfg_info, intelligence)
    print(f"[pipeline] 保存: {path}")

    # Optional copy to an external shared path (opt-in via --shared-output)
    if shared_output and shared_output != output:
        Path(shared_output).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output, shared_output)
        print(f"[pipeline] 共有パスにコピー: {shared_output}")

    # グラウンディングプール（AI推奨向け広域候補・足切り緩め）を別ファイルに出力
    if grounding_output:
        pool = _build_grounding_pool(df, df_raw, market, preset, min_market_cap, intelligence, use_technical, use_presets)
        # 値動き系の材料列(出来高/売買代金/ATR%/ボラ)を付与。既定OFF=呼ばれない限り休眠。
        # スコアリング・順位・銘柄集合には影響せず、列を追加するだけ(AI推奨向けの材料提示用)。
        if enrich_liquidity:
            pre_cols = set(pool.columns)
            pool = enrich_with_liquidity(pool)
            print(f"[pipeline] 流動性/ボラ列を付与: {sorted(set(pool.columns) - pre_cols)}")
        pool_cfg_info = dict(cfg_info)
        pool_path = write_candidates_json(pool, grounding_output, pool_cfg_info, intelligence)
        print(f"[pipeline] グラウンディングプール保存: {pool_path} ({len(pool)}銘柄, score>={_GROUNDING_MIN_SCORE})")

    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Daily JP stock screening pipeline")
    parser.add_argument("--csv-dir", default=DEFAULT_CSV_DIR)
    parser.add_argument("--intelligence-json", default=DEFAULT_INTELLIGENCE)
    parser.add_argument("--output", default=None)
    parser.add_argument("--shared-output", default=DEFAULT_SHARED)
    parser.add_argument("--grounding-output", default=None, help="AI推奨grounding向け広域候補プールの出力先(指定時のみ生成)")
    parser.add_argument("--top", type=int, default=35)
    parser.add_argument("--market", default="Prime")
    parser.add_argument("--preset", default="morning-value")
    parser.add_argument("--min-market-cap", type=float, default=0)
    parser.add_argument("--technical", action="store_true", help="技術指標スコアリングを有効化（yfinance API追加呼び出し）")
    parser.add_argument("--use-presets", action="store_true", help="presets.yamlのvalue_weight/quality_weight/filtersを適用する(デフォルトoff=現行挙動維持)")
    parser.add_argument("--enrich-liquidity", action="store_true", help="グラウンディングプールに出来高/売買代金/ATR%%/ボラ列を付与する(yfinance追加呼び出し・デフォルトoff)")
    args = parser.parse_args()

    run(
        csv_dir=args.csv_dir,
        intelligence_json=args.intelligence_json,
        output=args.output,
        shared_output=args.shared_output,
        grounding_output=args.grounding_output,
        top=args.top,
        market=args.market,
        preset=args.preset,
        min_market_cap=args.min_market_cap,
        use_technical=args.technical,
        use_presets=args.use_presets,
        enrich_liquidity=args.enrich_liquidity,
    )


if __name__ == "__main__":
    main()
