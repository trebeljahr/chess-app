FROM node:24-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.33.2

ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY src ./src
COPY tsconfig.json tsconfig.server.json ./

RUN pnpm run build:server
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3514
ENV HOST=0.0.0.0
ENV CHESS_DB_FILE=/app/data/chess.db
ENV REDIS_URL=""

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/server ./dist/server

RUN mkdir -p /app/data

EXPOSE 3514

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3514') + '/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "dist/server/server/index.js"]
