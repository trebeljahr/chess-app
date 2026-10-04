# Rolling server deployment contract

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
