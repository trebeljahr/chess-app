# Project history

Online Chess started in January 2019 as a Create React App project and moved
to Meteor a month later. In 2026 it was rebuilt on the current stack. This file
keeps the notes that used to open the README.

## The move away from Meteor

The app runs on:

- React 19 + TypeScript
- Vite for the client build
- Express + Node for the app server
- tRPC + TanStack Query for typed data fetching and realtime updates
- Drizzle ORM + SQLite for persistence
- Tailwind CSS v4 with shadcn-style UI components

The old Meteor publications, methods, and accounts flow were replaced with:

- a typed tRPC API
- cookie-based username/password auth
- a Drizzle-backed game store
- WebSocket subscriptions that invalidate TanStack Query caches so the lobby and board update automatically

The chess rules were ported into shared TypeScript so the gameplay logic
survived the framework migration.

## Earlier deployment notes (superseded)

These notes describe deployments before October 2026. Since 2026-10-18 the
web client is the Cloudflare Worker `chess-app-client` and the API server is
the Coolify Docker Image app `chess-server`; see
[coolify-deployment.md](coolify-deployment.md). The server no longer serves
`dist/client`.

- **One web app.** The frontend was built into `dist/client`, the Node server
  served that build, and tRPC HTTP and WebSocket traffic shared the same
  origin at `/trpc`.
- **Uberspace with pm2.** `git push` to the server, `npm install`,
  `npm run build`, `pm2 start npm --name chess-app -- start`. The in-process
  WebSocket layer and the local SQLite file suited a single Node process.
- **One Coolify app from the Dockerfile.** Health check path `/health`, port
  3000, persistent storage at `/app/data` so the SQLite database survived
  redeploys.
- **Scaling beyond one host** would need a hosted database (Postgres), Redis
  or Postgres pub/sub in place of the in-memory realtime bus, and the Drizzle
  adapter swapped to match.
