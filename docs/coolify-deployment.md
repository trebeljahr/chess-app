# Chess App On Coolify

This app is set up to deploy as a single web container:

- the Vite frontend is built into `dist/client`
- the Node server serves that built frontend
- tRPC HTTP and WebSocket traffic stay on the same origin at `/trpc`
- the container listens on `3000`
- readiness is exposed at `/health`

That shape matches the Docker/Coolify approach used for the sibling realtime apps.

## Recommended production shape

Use one Coolify application built from this repo's [Dockerfile](/Users/rico/projects/chess-app/Dockerfile).

Because this app uses SQLite today, add one persistent storage mount in Coolify:

- mount path: `/app/data`

That keeps the database file alive across container restarts and redeploys.

## Coolify application settings

Suggested base settings:

- Build Pack: `Dockerfile`
- Port: `3000`
- Health Check Path: `/health`
- Domain: `https://chess.your-domain.com`

If you prefer image-based deploys instead of building on the VPS:

- publish from GitHub Actions to `ghcr.io/<owner>/<repo>:main`
- point the Coolify app at that image
- add these GitHub secrets so pushes to `main` trigger a redeploy through the Coolify API:
  - `COOLIFY_BASE_URL`
  - `COOLIFY_API_TOKEN`
  - `COOLIFY_RESOURCE_UUID`

If the repository or package is private:

- add a GHCR registry entry in Coolify
- use a GitHub personal access token with package read access
- configure the Coolify app to pull from that private registry

## Environment variables

Start from [.env.example](/Users/rico/projects/chess-app/.env.example).

Core variables:

- `NODE_ENV=production`
- `PORT=3000`
- `HOST=0.0.0.0`
- `CHESS_DB_FILE=/app/data/chess.db`

Notes:

- `CHESS_DB_FILE` should point inside the persistent volume path in production.
- If you later move to Postgres, this variable will likely disappear and the app's database layer should be updated accordingly.

## DNS / proxy notes

This app expects:

- normal HTTPS traffic on the app domain
- WebSocket upgrade requests on the same domain at `/trpc`

No special browser-side WebSocket URL configuration is needed when the app is served from the same origin.

## Deploy flow

1. Push to `main`
2. GitHub Actions runs typecheck + build
3. GitHub Actions builds and publishes the Docker image to GHCR
4. GitHub Actions calls the Coolify deploy API for the app UUID
5. Coolify pulls the updated image and replaces the running container

## Realtime limitation

This app currently keeps live subscription fanout in a single Node.js process and stores game state in a single SQLite file.

That is acceptable for a single-instance hobby deployment, but it means:

- active clients may briefly reconnect during deploys
- this is not yet a multi-replica / zero-downtime realtime architecture

To move beyond that later, the next steps would be:

- move persistence from SQLite to Postgres
- replace the in-process realtime bus with shared pub/sub
- make the app safe for more than one running container
