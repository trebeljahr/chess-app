# Online Chess — Coolify Deployment

## Architecture

- **Client** — Vite-built SPA served by the Cloudflare Worker `chess-app-client`
  (see "Web client on Cloudflare Workers" below). `client/server.mjs` is only a
  local stand-in for the edge in tests; nothing deploys it.
- **Server** (`chess-app-server`) — Express + tRPC + WebSocket backend with SQLite persistence. Port 3514.
- **Redis** — Pub/sub for realtime events. It does not store game state.

## Image rollout gate

The repository variable `CHESS_IMAGE_ROLLOUT_READY=true` turns on the `deploy`
and `deploy-client` jobs (see "Server release"). Unset, CI builds the server
image and uploads a Worker version, and nothing goes live. The webhook response
must name the exact app UUID with `success`; `skipped` does not mean an image
deployed.

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

The server marks health `503` on SIGTERM, waits 20 seconds for proxy routing
to change, then closes sockets. Coolify's Image health check probes `/health`
on port 3514 at 2-second interval, 5-second timeout, 5 retries, and 15-second start period. Use at
least 30 seconds of stop grace. A WebSocket still disconnects when its server
is replaced; the subscription refreshes the durable snapshot on reconnect.
Verify active games and HTTP status during an actual rollout before claiming
continuous service.

## Production deploy

Use `docker-compose-prod.yaml` which pulls pre-built images from GHCR:

```bash
docker-compose -f docker-compose-prod.yaml up -d
```

These commands describe the stopped legacy Compose app (see "Current
runtime"); `docker-compose-prod.yaml` still names its client container.

## Coolify setup

The live setup is one Docker Image app, `chess-server`: image
`ghcr.io/trebeljahr/chess-app-server:live`, port 3514, domain
`https://chess.trebeljahr.com/trpc` with strip prefix off, persistent storage at
`/app/data`, health check `/health`. "Server release" lists its webhook settings.

## GitHub Actions deploy flow

1. Push to `main` (or run the workflow by hand: `workflow_dispatch`).
2. `verify`: typecheck, auth and rolling tests, build, built-artifact smoke test.
3. `build-server` pushes `ghcr.io/trebeljahr/chess-app-server:sha-<full commit>`
   (the image reports the commit on `/trpc/system.version`); `build-client`
   uploads a Worker version without activating it.
4. `deploy` (gated): server release, below.
5. `deploy-client`: switches the Worker once the server reports the commit.

### Server release

The Coolify app `chess-server` pulls `ghcr.io/trebeljahr/chess-app-server:live`,
has the watch path `.hatchkit/deploy-webhook`, `git_repository`
`trebeljahr/chess-app`, branch `main`, and its own GitHub webhook secret. The
`deploy` job:

1. fails unless every `COOLIFY_SERVER_*` secret below is set;
2. points `:live` at this run's image, by digest;
3. signs a `push` payload with the app's webhook secret; Coolify rolls the
   app (health `/health`, 20 s drain).

Required GitHub secrets:

- `COOLIFY_BASE_URL` — Coolify instance URL
- `COOLIFY_SERVER_RESOURCE_UUID` — `ej88smq0caxwc4fecndnexuz`
- `COOLIFY_SERVER_DEPLOY_SECRET` — that app's GitHub webhook secret
- `COOLIFY_SERVER_DEPLOY_REPOSITORY` — `trebeljahr/chess-app`
- `COOLIFY_SERVER_DEPLOY_BRANCH` — `main`

The single-app set (`COOLIFY_RESOURCE_UUID`, `COOLIFY_DEPLOY_SECRET`, …) names
the stopped legacy Compose app. The workflow does not read it: that app's writer
has no version check and must never run next to `chess-server`.

The smoke check uses temporary SQLite storage and free loopback ports; it does
not connect to production or test Redis, WebSockets, or container health checks.

Rollback of the server: point `:live` at the previous image and redeploy
`chess-server` in Coolify.

```bash
docker buildx imagetools create --tag ghcr.io/trebeljahr/chess-app-server:live ghcr.io/trebeljahr/chess-app-server:sha-<previous commit>
```

### GHCR images

- `ghcr.io/trebeljahr/chess-app-server:sha-<full commit>` — every build.
- `ghcr.io/trebeljahr/chess-app-server:live` — what `chess-server` runs; moved
  only by the `deploy` job (or a rollback).
- `ghcr.io/trebeljahr/chess-app-client:sha-<…>` — old builds only. The client
  moved to the Worker and its Coolify app was deleted on 2026-10-19.

`docker-compose-prod.yaml` pins the legacy digests for the stopped Compose
rollback resource and must not track a tag.

## Environment variables

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3514` | Server listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `REDIS_URL` | — | Redis connection URL |
| `CHESS_DB_FILE` | `/app/data/chess.db` | SQLite database path |
| `SENTRY_DSN` | — | GlitchTip DSN; unset turns error reports and `/trpc/_e` off (see "Error reporting") |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Environment tag on error reports |
| `COMMIT_SHA` | baked into the image | Reported by `system.version`; the release on error reports |

### Local client proxy (`client/server.mjs`, tests only)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` | Listen port |
| `BACKEND_URL` | `http://127.0.0.1:3514` | API the proxy forwards `/trpc` to |

## Error reporting

Both halves report to the GlitchTip project `chess-app` on
`https://glitchtip.trebeljahr.com` (org `ricos-web-empire`). One DSN serves both:

- **Server:** `SENTRY_DSN` in the env of the Coolify app `chess-server`
  (`src/server/instrument.ts`). It reports uncaught exceptions, unhandled
  rejections and tRPC errors with code `INTERNAL_SERVER_ERROR`; refusals
  (`UNAUTHORIZED`, `BAD_REQUEST`, `TOO_MANY_REQUESTS`, …) are not bugs and are
  not sent. An uncaught exception still ends the process after the report is
  flushed, as before.
- **Browser:** the repository variable `VITE_SENTRY_DSN`, inlined by
  `vite build` in the `build-client` job. It is a variable, not a secret: the DSN
  is in the bundle either way.

  ```bash
  gh variable set VITE_SENTRY_DSN --body 'https://<key>@glitchtip.trebeljahr.com/<id>'
  ```

  Without it, the client ships no SDK at all (the dynamic import folds away)
  and the job prints a `::notice::`. With it, `src/lib/error-reporting/` loads
  the SDK after the first render and reports what the global handlers and the
  `ErrorBoundary` in `App.tsx` catch. tRPC client errors are dropped: a real
  server fault is reported by the server.

The browser posts its reports to `POST /trpc/_e` on its own origin
(`src/server/error-tunnel.ts`), and the server forwards them to GlitchTip. Ad
blockers let a same-origin request through, GlitchTip never sees a visitor's IP
address, and no CSP or CORS change is needed. The tunnel forwards only
envelopes for the server's own `SENTRY_DSN`, so **the client reports only while
the server has `SENTRY_DSN` set** (otherwise `/trpc/_e` is a 404).

The privacy page (`/privacy`, `src/features/privacy/privacy-page.tsx`,
"Error reports") states the following in plain words. Change both together.
What a report carries, on both sides: the error message and stack frames, the
page or request URL with its query string and fragment removed, the release
(`chess-app@<commit>`), the environment and a `platform` tag (`web` or
`server`). Browser reports add the method, status and stripped URL of the last
requests and navigations, and the browser and OS from the user agent. Server
reports add the tRPC procedure name, never its input. No report carries a user
id, username, email address, cookie, other header, request body, console
output, or click and keystroke trail. Email addresses and bearer tokens inside
a message are replaced. No session replay, no tracing, no session pings. The
rules live in `src/shared/error-scrub.ts`, `src/lib/error-reporting/scrub.ts`
and `scrubServerEvent` in `src/server/instrument.ts`, tested in
`tests/error-reporting.test.ts`.

To check delivery without user traffic, send an event with
`SENTRY_ENVIRONMENT=wiring-check` (server) or `VITE_SENTRY_ENVIRONMENT=wiring-check`
(a local `vite` build) and look for it in GlitchTip.

## Local development with Docker

```bash
docker-compose up
```

Starts Redis and the server on `127.0.0.1:3514`. Run `pnpm dev:client` for the
UI; Vite proxies `/trpc` to that port.

For dev without Docker: `npm run dev` starts Redis via docker-compose, the server with tsx watch, and Vite dev server with proxy.

## Current runtime (since 2026-10-06)

Production runs as two Coolify resources in the chess project, plus the
Cloudflare Worker for the web client:

- `chess-server` Docker Image app `ej88smq0caxwc4fecndnexuz`: route
  `https://chess.trebeljahr.com/trpc` (strip prefix off), network alias
  `chess-api`, health `/health`, mounts the original SQLite volume
  `jzolhn29j9n0c3yhu4jmjezp_chess-data` at `/app/data`.
- `chess-redis` database `hz02e2cn68c2tky575ow4rdi` (pub/sub only).

Traefik sends `/trpc` HTTP and WebSocket traffic straight to healthy server
containers. The server releases through CI (see "Server release"). The web
client is the Cloudflare Worker below. The Coolify app `chess-client` served it
until 2026-10-18 and was deleted on 2026-10-19; its volume `chess-client-assets`
(old hashed bundles, no user data) was kept.

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
- `public/_redirects` — client routes (`/games/:slug`, `/imprint`, `/privacy`) answer with the
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

While `CHESS_IMAGE_ROLLOUT_READY` is unset, `deploy-client` is skipped: switch
the client by hand once the server runs the same commit, with the command in the
`build-client` summary. Required secrets: `CLOUDFLARE_API_TOKEN` (Editor on this
one Worker) and `CLOUDFLARE_ACCOUNT_ID`, set by
`hatchkit cloudflare token --worker chess-app-client`.

Rollback:

- One client release: `npx wrangler versions deploy <previous id>@100% --name chess-app-client`
  (version ids by commit tag: `npx wrangler versions list --name chess-app-client`).
- The whole move cannot be undone by deleting the `chess.trebeljahr.com/*` route
  any more: with `chess-client` deleted, Traefik has no router for `/` and answers
  503. Going back would mean a new client image app first.
