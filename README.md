# Nrin's Chess

This project has been modernized away from Meteor and now runs on:

- React 19 + TypeScript
- Vite for the client build
- Express + Node for the app server
- tRPC + TanStack Query for typed data fetching and realtime updates
- Drizzle ORM + SQLite for persistence
- Tailwind CSS v4 with shadcn-style UI components

## Deployment shape

Production is designed to run as a single web app:

- the frontend is built into `dist/client`
- the Node server serves that build
- tRPC HTTP and WebSocket traffic share the same origin at `/trpc`

That shape works well with Coolify because the browser can stay on one origin for both HTTP and realtime traffic.

## What Changed

The old Meteor publications, methods, and accounts flow have been replaced with:

- a typed tRPC API
- cookie-based username/password auth
- a Drizzle-backed game store
- WebSocket subscriptions that invalidate TanStack Query caches so the lobby and board update automatically

The chess rules were ported into shared TypeScript so the gameplay logic survives the framework migration.

## Local Development

Install dependencies:

```bash
npm install
```

Start the client and server in development mode:

```bash
npm run dev
```

- Vite serves the frontend
- the Node server runs on port `3000`
- Vite proxies `/trpc` to the backend, including WebSocket upgrades

## Production Build

Build the app:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production server serves the built frontend from `dist/client` and the backend from `dist/server/server`.

## Docker / Coolify deployment

This repo now includes:

- [Dockerfile](/Users/rico/projects/chess-app/Dockerfile)
- [.dockerignore](/Users/rico/projects/chess-app/.dockerignore)
- [.env.example](/Users/rico/projects/chess-app/.env.example)
- [docs/coolify-deployment.md](/Users/rico/projects/chess-app/docs/coolify-deployment.md)
- [build-and-deploy.yml](/Users/rico/projects/chess-app/.github/workflows/build-and-deploy.yml)

The Docker image:

- installs dependencies
- builds the frontend and server
- serves the built frontend from the Node container
- exposes a health endpoint at `/health`
- keeps the app on one origin for both HTTP and realtime traffic

For Coolify, you should add a persistent storage mount at `/app/data` so the SQLite database survives redeploys.

## Runtime Configuration

Supported environment variables:

- `PORT`
  default: `3000`
- `HOST`
  default: `0.0.0.0`
- `CHESS_DB_FILE`
  default: `data/chess.db`

## Deployment Notes

This repo is currently optimized for a regular Node host such as Uberspace with `pm2`.

Suggested deployment flow:

1. `git push` to your server
2. `npm install`
3. `npm run build`
4. `pm2 start npm --name chess-app -- start`

Because this version uses an in-process WebSocket realtime layer plus a local SQLite database, it is a strong fit for a single self-hosted Node process.

If you move to Coolify instead of PM2 directly, the recommended path is:

1. create one Coolify app from the repo Dockerfile
2. set the health check path to `/health`
3. expose port `3000`
4. mount persistent storage at `/app/data`

If you later want true multi-instance horizontal scaling or Vercel-style serverless deployment, the next step would be:

- move the database to hosted Postgres
- replace the in-memory realtime bus with Redis/Postgres pub-sub
- optionally swap the SQLite Drizzle adapter to Postgres
