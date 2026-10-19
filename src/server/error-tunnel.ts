import type { Request, Response } from "express";

// POST /trpc/_e — the browser reporter's envelopes (Sentry's `tunnel` option),
// forwarded to GlitchTip. Same origin, so ad blockers that filter error
// tracker hosts let them through, and GlitchTip sees this server's address
// instead of the visitor's. Under /trpc because the zone sends only /trpc* to
// this app; every other path is the static Worker.
//
// The client and the server report to one GlitchTip project, so an envelope
// is forwarded only when its DSN is this server's own SENTRY_DSN. Only the
// envelope goes on: no cookie, no header of the visitor's.

/** Envelope ingest URL for a DSN, with the key in the query as GlitchTip wants it in tunnel mode. */
export function envelopeUrl(dsn: string): URL | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!/^\d+$/.test(projectId) || !url.username) return null;
    const target = new URL(`/api/${projectId}/envelope/`, url.origin);
    target.searchParams.set("sentry_key", decodeURIComponent(url.username));
    target.searchParams.set("sentry_version", "7");
    return target;
  } catch {
    return null;
  }
}

/** The DSN in an envelope's first line, or null when the body is no envelope. */
export function envelopeDsn(body: Buffer): string | null {
  const newline = body.indexOf(10);
  const head = (newline === -1 ? body : body.subarray(0, newline)).toString("utf8");
  try {
    const dsn = (JSON.parse(head) as { dsn?: unknown }).dsn;
    return typeof dsn === "string" ? dsn : null;
  } catch {
    return null;
  }
}

function sameProject(a: string, b: string): boolean {
  const left = envelopeUrl(a);
  const right = envelopeUrl(b);
  return left !== null && right !== null && left.href === right.href;
}

/** The handler for one DSN. Expects a raw body (express.raw); without a DSN every request is a 404. */
export function createErrorTunnel(dsn: string, fetchImpl: typeof fetch = fetch) {
  const target = dsn ? envelopeUrl(dsn) : null;
  return async (req: Request, res: Response): Promise<void> => {
    res.set("cache-control", "no-store");
    if (!target) {
      res.status(404).end();
      return;
    }
    const body: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const envelope = envelopeDsn(body);
    if (!envelope || !sameProject(envelope, dsn)) {
      res.status(400).end();
      return;
    }
    try {
      const upstream = await fetchImpl(target, {
        method: "POST",
        body: new Uint8Array(body),
        headers: { "content-type": "application/x-sentry-envelope" },
        signal: AbortSignal.timeout(10_000),
      });
      // The SDK backs off on these two.
      for (const name of ["retry-after", "x-sentry-rate-limits"]) {
        const value = upstream.headers.get(name);
        if (value) res.set(name, value);
      }
      res.status(upstream.status).end();
    } catch {
      res.status(502).end();
    }
  };
}
