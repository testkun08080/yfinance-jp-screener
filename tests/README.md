# テスト実行手順（2026-07-14 不足要素是正実装 Phase5）

## screener側（pytest基盤あり）

```
cd yfinance-jp-screener
python -m pytest tests/ -v
```

- `test_technical_rsi.py`（Phase1・M-5）: RSI符号反転修正の検証。全上昇→RSI≒100、全下落→RSI≒0、変化なし→50.0、通常系列→0<RSI<100
- `test_lesson_penalties.py`（Phase2・M-6）: `apply_lesson_penalties`のticker減点＋再ソート／減点なし時のdf不変／壊れたJSONスキップを検証
- `test_presets.py`: 既存テスト（今回のPhase1-4変更対象外）

### 既知のFAIL 1件（今回の変更とは無関係・対応保留）

`test_presets.py::test_load_preset_momentum_matches_default` が現在FAILする。原因は`pipeline/presets/presets.yaml`に07-11以降追加された`momentum`プリセットが`daytrade-liquid`と同一値(value_weight=0.2/quality_weight=0.8)で定義されている一方、テストは「momentum未定義→PRESET_DEFAULTS(0.5/0.5)へフォールバック」という旧前提のまま、という既存の齟齬。Phase1着手時に発見・裏取り済みで、今回変更した3ファイルとは無関係と確認済み（詳細: `fable_log/decisions/2026-07-14_不足要素是正実装.md`「Phase1で発見した既存不整合」節）。

対応案（未実施・ユーザー判断待ち）:
1. テスト期待値をYAML実値（0.2/0.8）に更新する
2. YAML側の`momentum`定義を削除し、フォールバック挙動に戻す

## simulator側（構造変更のためユニット化は今回スコープ外）

Phase3（M-4 get_db統一）・Phase4（C-1スケジューラ是正）はDB接続管理・並列実行のブロック構造変更で、ユニットテスト化が困難なため、手動smokeで代替する。simulator用pytest基盤の本格新設は今回スコープ外（必要になったら別途提案）。

### 手動smoke手順（invest-simulator-deploy手順の一部・再起動後に実施）

1. ヘルスチェック: `GET /api/system/health` → 200
2. 代表APIのGET各1本が200であることを確認:
   - `GET /api/stocks/watchlist`
   - `GET /api/portfolio/holdings`
   - `GET /api/decisions`
3. 起動ログ（`uvicorn.log`）にエラーが出ていないこと
4. （C-1のみ）翌スケジューラサイクル1巡分のログで`TimeoutError`・未捕捉例外が出ていないこと（`[measure]`ログで確認）

Phase3・Phase4実施時はいずれも上記が正常であることを確認済み（詳細: `fable_log/decisions/2026-07-14_不足要素是正実装.md`）。
