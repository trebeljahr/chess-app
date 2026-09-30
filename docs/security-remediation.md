# Local security remediation

Authentication throttles apply before input parsing at each login/register procedure,
including operations sharing one HTTP batch and WebSocket calls. The combined budget
is 10 attempts per minute per socket peer. Forwarded IP headers are not trusted.
The map expires entries and caps peer count at 10,000, failing closed at capacity.

Behind a reverse proxy, clients share its budget. Configure a reviewed proxy trust
boundary and a shared limiter before scaling to multiple API processes; current
limits are per-process and reset on restart. Do not set global trust-proxy to true.

Local Compose ports bind to 127.0.0.1. Production Compose publishes no host ports.
The API image runs as node; existing named volumes may need a user-authorized,
backup-first ownership migration to UID/GID 1000 before rollout. Runtime services
set no-new-privileges; application services drop Linux capabilities.
Development starts API/client on dynamic loopback ports and respects API_PORT/PORT.
Redis remains optional; start it explicitly with dev:redis when needed.

Validation uses fake procedures: 11 operations in one batch execute 10 times and
reject the final operation. Spoofed X-Forwarded-For does not reset the peer budget.
No production provider settings, services or published history changed.
