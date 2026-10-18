# Online Chess — Coolify Deployment

## Architecture

Split client/server containers with Redis sidecar:

- **Client** — Vite-built SPA. In production it is served by the Cloudflare
  Worker `chess-app-client` (see "Web client on Cloudflare Workers" below).
  The `chess-app-client` image (a small Node.js server that proxies `/trpc`)
  remains for local Docker runs and as the rollback target until it retires.
- **Server** (`chess-app-server`) — Express + tRPC + WebSocket backend with SQLite persistence. Port 3514.
- **Redis** — Pub/sub for realtime events. It does not store game state.

## Image rollout gate

The live application is Docker Compose. `CHESS_IMAGE_ROLLOUT_READY` must stay
unset in GitHub repository variables until an Image cutover is complete. CI may
build images on a push, but it will not call the old Compose deploy webhook.
The webhook response must name the exact app UUID with `success`; `skipped`
does not mean an image deployed.

Do not run two independent server containers against separate copies of
`chess.db`. The Compose named volume holds users, sessions, and game state.
Game writes now use a database version check, so a stale replica receives a
conflict instead of overwriting a newer move. This does not make two copies of
the database safe to run.
Redis only carries transient notifications. Before an Image cutover, move this
database to a shared persistence service with atomic game updates and a tested
data migration, or prove a single shared local SQLite volume can safely serve
overlapping instances on the same host. The latter cannot cover host failure.
Keep the old volume and Compose app for rollback. Extract Redis to a durable
separate service; the Compose sidecar would stop with the old app.

The client and server mark health `503` on SIGTERM, wait 20 seconds for proxy
routing to change, then close sockets. Coolify's Image health checks should
probe client `/healthz` on port 80 and server `/health` on port 3514 at 2-second
interval, 5-second timeout, 5 retries, and 15-second start period. Use at
least 30 seconds of stop grace. A WebSocket still disconnects when its server
is replaced; the subscription refreshes the durable snapshot on reconnect.
Verify active games and HTTP status during an actual rollout before claiming
continuous service.

## Production deploy

Use `docker-compose-prod.yaml` which pulls pre-built images from GHCR:

```bash
docker-compose -f docker-compose-prod.yaml up -d
```

## Coolify setup

1. Create a Docker Compose application in Coolify
2. Point it at `docker-compose-prod.yaml`
3. Add persistent storage: `/app/data` on the server container (SQLite)
4. Expose port 80 (client container)
5. Health check: `/healthz` on the client
6. Domain: `https://chess.your-domain.com`

## GitHub Actions deploy flow

1. Push to `main`
2. CI runs typecheck + build + a built-artifact smoke test against `/health` and `/healthz`
3. Parallel builds: client and server Docker images pushed to GHCR
4. After both succeed: Coolify deployment triggered via webhook

### Required GitHub secrets

- `COOLIFY_BASE_URL` — Coolify instance URL
- `COOLIFY_RESOURCE_UUID` — the existing Compose application
- `COOLIFY_DEPLOY_SECRET` — that application’s signed webhook key
- `COOLIFY_DEPLOY_REPOSITORY` — repository name used by its webhook
- `COOLIFY_DEPLOY_BRANCH` — branch used by its webhook

The workflow signs the deploy payload after both images finish building. The
application stays on Compose so its SQLite and Redis volumes remain in place.
The smoke check uses temporary SQLite storage and free loopback ports; it does
not connect to production or test Redis, WebSockets, or container health checks.

### GHCR images

Each push to `main` publishes full-SHA tags only:

- `ghcr.io/trebeljahr/chess-app-client:sha-<full commit>`
- `ghcr.io/trebeljahr/chess-app-server:sha-<full commit>`

Deploy by the recorded digest. `docker-compose-prod.yaml` pins the legacy
digests for the stopped Compose rollback resource and must not track a tag.

## Environment variables

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3514` | Server listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `REDIS_URL` | — | Redis connection URL |
| `CHESS_DB_FILE` | `/app/data/chess.db` | SQLite database path |

### Client

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | Client listen port |
| `BACKEND_URL` | `http://server:3514` | Backend URL for proxying |

## Local development with Docker

```bash
docker-compose up
```

Starts Redis, server, and client. Access at `http://localhost:80`.

For dev without Docker: `npm run dev` starts Redis via docker-compose, the server with tsx watch, and Vite dev server with proxy.

## Current runtime (since 2026-10-06)

Production runs as three Coolify resources in the chess project:

- `chess-server` Docker Image app `ej88smq0caxwc4fecndnexuz`: route
  `https://chess.trebeljahr.com/trpc` (strip prefix off), network alias
  `chess-api`, health `/health`, mounts the original SQLite volume
  `jzolhn29j9n0c3yhu4jmjezp_chess-data` at `/app/data`.
- `chess-client` Docker Image app `hdnhx1xkzmfp5hx2xucdptw8`: route
  `https://chess.trebeljahr.com`, health `/healthz`, shared asset volume
  `chess-client-assets` at `/app/assets`, `BACKEND_URL=http://chess-api:3514`,
  `BACKEND_HEALTH_REQUIRED=false`. Traefik already health-checks the API route,
  so client readiness covers only HTML and assets. With the check on, a draining
  API replica behind the shared alias withdrew the only client replica (measured
  12 s of `/` 503 per server release on 2026-10-06).
- `chess-redis` database `hz02e2cn68c2tky575ow4rdi` (pub/sub only).

Traefik sends `/trpc` HTTP and WebSocket traffic straight to healthy server
containers. Release by pinning each app's tag to its full-SHA build digest and
deploying it; the server and client roll independently.

The stopped Compose app `jzolhn29j9n0c3yhu4jmjezp` is the rollback resource,
pinned to Git commit `a09ce7ef8dc27ca35656521b61b8e1daddf2f8d4`, whose Compose file
holds the pre-migration digests. Its writer has no version CAS: never run it
while either Image app's server is running.

## Web client on Cloudflare Workers

The browser loads the client from Cloudflare and talks to the API on the same
hostname, so cookies and the WebSocket stay first-party. Three Workers routes on
the `trebeljahr.com` zone decide who answers:

| Route | Goes to |
| --- | --- |
| `chess.trebeljahr.com/trpc*` | no Worker: Traefik, the `chess-server` app (HTTP and the WebSocket at bare `/trpc`) |
| `chess.trebeljahr.com/.well-known/acme-challenge/*` | no Worker: Traefik renews the certificate it still holds for the server's `/trpc` route |
| `chess.trebeljahr.com/*` | Worker `chess-app-client`, static assets only |

The `/trpc*` pattern has no slash on purpose: the tRPC WebSocket connects to
`wss://chess.trebeljahr.com/trpc`, which `/trpc/*` would leave on the Worker.
`http://` requests are redirected by hatchkit's one HTTPS rule on the zone
(`hatchkit cloudflare https add|remove chess.trebeljahr.com`), which leaves
`/.well-known/` to the origin.

Files:

- `wrangler.jsonc` — assets only (`dist/client`), `not_found_handling: 404-page`,
  no `main`, no `routes`, `workers_dev: false`. Never add `main`,
  `run_worker_first` or `cache`: each turns free asset requests into counted
  Worker requests.
- `public/_redirects` — client routes (`/games/:slug`, `/imprint`) answer with the
  app shell and status 200. Any other path gets `404.html`, a copy of the shell,
  with status 404; the router then sends it to `/`. A missing `/assets/` file is
  a real 404.
- `public/_headers` — `/version.json` and `/release-assets.json` are `no-store`.
  Hashed assets keep Cloudflare's default (`max-age=0, must-revalidate`, ETag);
  an immutable rule would also cache a 404 for a year.
- `scripts/prepare-worker-assets.mjs` — writes `version.json` (`commit`) and
  `404.html` after `vite build`.
- `scripts/carry-static.mjs` — copied from hatchkit
  (`cli/src/templates/client-host/scripts/`). Each upload carries the hashed
  files of the two releases before it, read from the live
  `/release-assets.json`, so tabs opened before a deploy keep their chunks.

Release order in `build-and-deploy.yml`:

1. `build-client` builds, carries, and runs `wrangler versions upload`. Nothing
   goes live. The run summary names the version id.
2. `deploy` signs the server's Coolify webhook (behind `CHESS_IMAGE_ROLLOUT_READY`).
3. `deploy-client` waits until `GET /trpc/system.version` names the commit,
   runs `wrangler versions deploy <id>@100%`, and polls `/version.json`.

While the server rollout gate is off, `deploy-client` is skipped: switch the
client by hand once the server runs the same commit, with the command in the
`build-client` summary. Required secrets: `CLOUDFLARE_API_TOKEN` (Editor on this
one Worker) and `CLOUDFLARE_ACCOUNT_ID`, set by
`hatchkit cloudflare token --worker chess-app-client`.

Rollback:

- One client release: `npx wrangler versions deploy <previous id>@100% --name chess-app-client`
  (version ids by commit tag: `npx wrangler versions list --name chess-app-client`).
- The whole move: delete the `chess.trebeljahr.com/*` route first; Traefik and the
  `chess-client` Coolify app answer again within seconds. Then the two
  no-Worker routes, then `hatchkit cloudflare https remove chess.trebeljahr.com`.
  This works only while the Coolify client still runs.
