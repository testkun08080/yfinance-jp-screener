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

# TypeScriptコンパイルとViteビルド
RUN npm run build --loglevel=info

# 本番環境ステージ（nginx使用）
FROM nginx:alpine AS runner

# nginxの設定ファイルをコピー
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# ビルド成果物のみをコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# ポート公開（nginx は 80 で待受）
EXPOSE 80

# nginx起動
CMD ["nginx", "-g", "daemon off;"]
