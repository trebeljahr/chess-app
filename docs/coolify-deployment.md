# Online Chess — Coolify Deployment

## Architecture

Split client/server containers with Redis sidecar:

- **Client** (`chess-app-client`) — Vite-built SPA served by a lightweight Node.js server, proxies `/trpc` to the backend. Port 80.
- **Server** (`chess-app-server`) — Express + tRPC + WebSocket backend with SQLite persistence. Port 3514.
- **Redis** — Pub/sub for distributed realtime events (multi-instance support).

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
2. Parallel builds: client and server Docker images pushed to GHCR
3. After both succeed: Coolify deployment triggered via webhook

### Required GitHub secrets

- `COOLIFY_API_TOKEN` — Coolify API bearer token
- `COOLIFY_WEBHOOK_URL` — Coolify deploy webhook endpoint

### GHCR images

- `ghcr.io/trebeljahr/chess-app-client:latest`
- `ghcr.io/trebeljahr/chess-app-server:latest`

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
