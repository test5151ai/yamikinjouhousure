# ベースイメージ
FROM node:20-alpine AS base
WORKDIR /app

# 開発用ステージ
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ビルドステージ
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# 本番用ステージ
FROM base AS production
ENV NODE_ENV=production

# 非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# データディレクトリを作成
RUN mkdir -p /app/data && chown -R sveltekit:nodejs /app/data

COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

USER sveltekit

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build"]
