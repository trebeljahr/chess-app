# Rolling server deployment contract

The production client requires `ASSET_STORE_DIR` on a persistent shared directory,
mounted into every overlapping client replica. Startup atomically publishes its
Vite assets before readiness and refuses a filename collision with different
bytes. Each replica can serve either release's assets from that directory;
missing asset URLs return 404 instead of the SPA HTML. Do not garbage-collect
retained releases while their browser documents can remain open. During the
first adoption, seed the directory from the running legacy client's assets
before retiring it, and verify the mount is writable by UID 1000.

Client readiness checks backend readiness. Both client proxy and API mark health
unready before the 20-second drain, finish accepted HTTP requests, reconnect
WebSockets, and enforce a 28-second final deadline inside the 30-second container
stop grace. The client closes both sides of a failed WebSocket tunnel.

Browser sockets open only when an authenticated subscription starts and reset
after login/logout. Protected server operations refresh the session from SQLite
so revocation on another replica fences an already-open WebSocket too.

For the first version-CAS deployment, stop the old writer before any new writer
starts using the same volume. An older binary that does not advance the version
counter is not safe to overlap. Later releases can overlap once every writer
honors this protocol. Keep the old image digests and original volumes for rollback.

`node scripts/browser-rolling-fixture.mjs` starts a synthetic loopback-only
two-server/two-client environment from the built app. Its stdin controls retire
the API and client independently; `stop` removes its Redis container and data.
Use Node 24 and mute the browser before gameplay. No project dotenv is loaded.

The server requires shared Redis in production. `/health` performs a bounded
Redis PING and returns 503 if Redis is missing, disconnected, stalled, or the
server is draining. HTTP mutations also reject unavailable realtime transport.

Both replicas must open the same local SQLite database, including its WAL and
shared-memory files. Keep the existing Docker volume and mount the directory,
not an individual database file. This supports overlap on one host; it is not a
multi-host database or host-failure recovery strategy. Back up and restore-check
the database before changing its volume or application resource.

Game writes use a version compare-and-swap inside a SQLite transaction, including
rating updates and rematch links. For first adoption, retire any legacy writer
that does not update that version before allowing the new server to write.
An older writer cannot be made safe by a fence it does not understand. Subsequent
rolling releases may overlap only while both sides preserve this contract and
have compatible schema and client protocols. Do not retry ambiguous mutations
blindly; fetch the current game state before a user retries.

Redis Pub/Sub carries snapshot invalidations, not durable game state. On initial
subscription and after either Redis connection recovers, the server emits a
snapshot-required event. The client refetches the authoritative SQLite state.
Events coalesce while a websocket is slow. Committed database mutations remain
successful even when their notification transport fails; reconnection and the
client's periodic query repair missed notifications.

On SIGTERM, readiness fails immediately. The server serves accepted traffic for
20 seconds, then notifies websocket clients to reconnect and closes its HTTP and
websocket listeners. It keeps SQLite and Redis open until accepted HTTP requests
and websocket closure finish. A 28-second deadline exits with failure if that
cannot complete. The deployment platform must allow at least 30 seconds before
SIGKILL, route new connections to the healthy replacement, and preserve the
shared volume and Redis endpoint. Verify the actual stop behavior, not merely a
saved configuration field.

## Local verification

Use Node 24 with dependencies installed and Docker available. All test accounts,
databases, and the bounded Redis container are synthetic and temporary.

- `pnpm test:rolling`: two independent app processes sharing SQLite; concurrent
  game CAS; authenticated cross-replica fanout and channel isolation; paused
  Redis makes readiness fail; recovery resnapshots a still-open websocket;
  retiring one process preserves authentication and two committed moves.
- `pnpm build && pnpm smoke:health`: built server and client health, including
  production fail-closed behavior without Redis, using a temporary Redis server.

The retirement test starts an HTTP request during the drain and finishes its body
after listener closure. This verifies that accepted requests retain their database
and Redis dependencies. The last local run sampled 167 requests without failure
and observed a 25.524-second clean drain. This is a local protocol proof, not a
claim about the live Coolify route or deployment. Live acceptance still requires
an independently observed A-to-B deployment with the exact image digests, old
container retirement, public HTTP samples, and a browser held across replacement.
