FROM node:24-bookworm-slim AS build
WORKDIR /app

ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json ./

RUN npm run build:client

FROM node:24-bookworm-slim AS runtime
WORKDIR /app

COPY --from=build /app/dist/client ./dist
COPY client/server.mjs ./server.mjs

ENV NODE_ENV=production
ENV PORT=80
ENV BACKEND_URL=http://server:3514

USER node

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '80') + '/healthz').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
