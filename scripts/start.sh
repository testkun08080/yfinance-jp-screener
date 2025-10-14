#!/bin/bash

# 株式分析プラットフォーム - Docker起動スクリプト
# Stock Analysis Platform - Docker Startup Script

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 株式分析プラットフォーム Docker起動"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境変数読み込み
if [ -f .env ]; then
    echo -e "${BLUE}ℹ️  .env ファイルを読み込んでいます...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# オプション解析
BUILD_FLAG=""
DETACH_FLAG=""
STOCK_FILE=${STOCK_FILE:-stocks_1.json}

while [[ $# -gt 0 ]]; do
    case $1 in
        --build|-b)
            BUILD_FLAG="--build"
            shift
            ;;
        --detach|-d)
            DETACH_FLAG="-d"
            shift
            ;;
        --stock-file)
            STOCK_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "使用方法:"
            echo "  ./scripts/start.sh [オプション]"
            echo ""
            echo "オプション:"
            echo "  --build, -b          イメージを再ビルドする"
            echo "  --detach, -d         バックグラウンドで実行"
            echo "  --stock-file FILE    処理する株式ファイルを指定"
            echo "  --help, -h           このヘルプを表示"
            echo ""
            echo "例:"
            echo "  ./scripts/start.sh --build"
            echo "  ./scripts/start.sh --stock-file stocks_2.json"
            exit 0
            ;;
        *)
            echo "不明なオプション: $1"
            echo "--help でヘルプを表示"
            exit 1
            ;;
    esac
done

# Docker がインストールされているか確認
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker がインストールされていません${NC}"
    echo "https://docs.docker.com/get-docker/ からインストールしてください"
    exit 1
fi

# Docker Compose がインストールされているか確認
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose がインストールされていません${NC}"
    echo "https://docs.docker.com/compose/install/ からインストールしてください"
    exit 1
fi

echo -e "${GREEN}✅ Docker環境の確認完了${NC}"
echo ""

# 株式ファイルを環境変数として設定
export STOCK_FILE

echo -e "${BLUE}📋 設定情報:${NC}"
echo "  - 株式データファイル: ${STOCK_FILE}"
echo "  - ビルドフラグ: ${BUILD_FLAG:-なし}"
echo "  - デタッチモード: ${DETACH_FLAG:-なし (フォアグラウンド)}"
echo ""

# Docker Compose実行
echo -e "${GREEN}🚀 Dockerコンテナを起動しています...${NC}"
echo ""

if command -v docker-compose &> /dev/null; then
    docker-compose up $BUILD_FLAG $DETACH_FLAG
else
    docker compose up $BUILD_FLAG $DETACH_FLAG
fi

# 起動完了メッセージ
if [ -n "$DETACH_FLAG" ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 起動完了！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📱 アプリケーションURL:${NC}"
    echo "   http://localhost:4173"
    echo ""
    echo -e "${BLUE}📊 ログ確認:${NC}"
    echo "   docker-compose logs -f"
    echo ""
    echo -e "${BLUE}🛑 停止:${NC}"
    echo "   docker-compose down"
    echo ""
fi

exit 0
