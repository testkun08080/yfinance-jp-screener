#!/bin/sh
# Docker用: 市場（JP/US）に応じてリスト取得・分割・データ収集・CSV結合を実行
# 環境変数: MARKET (JP|US), STOCK_FILE, CHUNK_SIZE, SEC_USER_AGENT_CONTACT (US時推奨)

set -e

# 前後の空白・CRを除去し大文字に正規化（.env の "MARKET = US" / "us" / Windows改行にも対応）
MARKET=$(echo "${MARKET:-JP}" | tr -d '[:space:]' | tr -d '\r' | tr '[:lower:]' '[:upper:]')
CHUNK_SIZE=${CHUNK_SIZE:-1000}

# STOCK_FILE未指定時は市場ごとのデフォルト（実用リスト）
if [ -z "$STOCK_FILE" ] || [ "$STOCK_FILE" = " " ]; then
  if [ "$MARKET" = "US" ]; then
    STOCK_FILE=us_stocks_1.json
  else
    STOCK_FILE=stocks_1.json
  fi
fi

echo "=============================================="
echo "MARKET=$MARKET  STOCK_FILE=$STOCK_FILE  CHUNK_SIZE=$CHUNK_SIZE"
echo "=============================================="

if [ "$MARKET" = "US" ]; then
  echo "🇺🇸 US stock list and data fetch..."
  python get_us_stocklist.py
  python split_stocks.py --input us_stocks_all.json --size "$CHUNK_SIZE"
  python sumalize.py "$STOCK_FILE"
  python combine_latest_csv.py --market-type US
else
  echo "🇯🇵 JP stock list and data fetch..."
  python get_jp_stocklist.py
  python split_stocks.py --input stocks_all.json --size "$CHUNK_SIZE"
  python sumalize.py "$STOCK_FILE"
  python combine_latest_csv.py --market-type JP
fi

echo "=============================================="
echo "Done. Export directory:"
ls -la Export/ 2>/dev/null || true
echo "=============================================="
