# React Frontend Service Dockerfile
# フロントエンドビルド・本番サービス用Dockerfile

FROM node:20-alpine AS base

# 作業ディレクトリ設定
WORKDIR /app

# 依存関係のインストール（キャッシュ最適化）
FROM base AS deps
COPY stock_search/package*.json ./
RUN npm ci

# ビルドステージ
FROM base AS builder
COPY stock_search/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY stock_search/ .

# データディレクトリを準備
RUN mkdir -p public/csv

# TypeScriptコンパイルとViteビルド (Docker環境: CSV copy skipped)
ENV DOCKER_ENV=true
RUN npm run build

# 本番環境ステージ（nginx使用）
FROM nginx:alpine AS runner

# 環境変数のデフォルト値を設定
ENV PORT=80

# nginxの設定ファイルをコピー
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# ビルド成果物のみをコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# CSVデータディレクトリを作成（ボリュームマウント用）
RUN mkdir -p /usr/share/nginx/html/csv && \
    chown -R nginx:nginx /usr/share/nginx/html

# ポート公開
EXPOSE ${PORT}

# nginx起動
CMD ["nginx", "-g", "daemon off;"]
