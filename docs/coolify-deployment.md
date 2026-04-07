# Chess App — Coolify Deployment

## Architecture

Single container app with Redis sidecar:

- Vite frontend built into `dist/client`, served by the Node server
- tRPC HTTP and WebSocket on the same origin at `/trpc`
- Redis for distributed pub/sub (multi-instance support)
- SQLite for persistence (mounted volume)
- Health endpoint at `/health`

## Production deploy with docker-compose

Use `docker-compose-prod.yaml` which pulls pre-built images from GHCR:

```bash
docker-compose -f docker-compose-prod.yaml up -d
```

This starts:
- **redis** — Redis 7 Alpine for pub/sub
- **app** — Chess app from `ghcr.io/trebeljahr/chess-app:latest`

## Coolify setup

1. Create a new Docker Compose application in Coolify
2. Point it at `docker-compose-prod.yaml`
3. Add a persistent storage mount: `/app/data` (for SQLite)
4. Set the exposed port to `6100`
5. Health check path: `/health`
6. Domain: `https://chess.your-domain.com`

## GitHub Actions deploy flow

1. Push to `main`
2. CI runs typecheck + build verification
3. Docker image built and pushed to `ghcr.io/trebeljahr/chess-app:latest`
4. Coolify deployment triggered via webhook

### Required GitHub secrets

- `COOLIFY_API_TOKEN` — Coolify API bearer token
- `COOLIFY_WEBHOOK_URL` — Coolify deploy webhook endpoint

## Environment variables

See `.env.example`. Key variables for production:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `6100` | Server listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `production` | Environment |
| `REDIS_URL` | — | Redis connection URL |
| `CHESS_DB_FILE` | `/app/data/chess.db` | SQLite database path |

## DNS / proxy notes

- Normal HTTPS traffic on the app domain
- WebSocket upgrade requests on the same domain at `/trpc`
- No special browser-side WebSocket URL config needed

## Local development with Docker

```bash
docker-compose up
```

Starts Redis on port 6300 and the app on port 6100.

For development without Docker, use `npm run dev` which starts Redis via
`docker-compose up redis` and the server/client with concurrently.
