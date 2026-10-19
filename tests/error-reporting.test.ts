import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ErrorEvent } from "@sentry/browser";
import express from "express";
import { createErrorReporter, type Sentry } from "../src/lib/error-reporting/create-reporter.js";
import { scrubBreadcrumb, scrubEvent, shouldDropEvent } from "../src/lib/error-reporting/scrub.js";
import { createErrorTunnel, envelopeUrl } from "../src/server/error-tunnel.js";
import { scrubServerEvent, trpcErrorReporter } from "../src/server/instrument.js";
import { releaseName, scrubText, stripUrl } from "../src/shared/error-scrub.js";

const DSN = "https://abc123@glitchtip.example.com/7";

describe("shared text rules", () => {
  test("stripUrl drops query, fragment and credentials", () => {
    assert.equal(
      stripUrl("https://user:pw@chess.example.com/trpc/game.bySlug?batch=1&input=%7B%7D#x"),
      "https://chess.example.com/trpc/game.bySlug",
    );
    assert.equal(stripUrl("/games/my-game?x=1"), "/games/my-game");
  });

  test("scrubText removes queries, emails and bearer tokens from a message", () => {
    const text = scrubText(
      'GET /trpc/auth.session?input={"json":{"a":1}} failed for me@example.com with Bearer abc.def',
    );
    assert.equal(text, "GET /trpc/auth.session failed for [email] with Bearer [redacted]");
  });

  test("scrubText keeps package paths that only look like addresses", () => {
    const path =
      "/app/node_modules/.pnpm/better-sqlite3@12.11.1/node_modules/better-sqlite3/build/Release/better_sqlite3.node";
    assert.equal(
      scrubText(`The module '${path}' was compiled`),
      `The module '${path}' was compiled`,
    );
    assert.equal(scrubText("mailto:me@example.com"), "mailto:[email]");
  });

  test("releaseName uses the first 12 characters of the commit", () => {
    assert.equal(releaseName("0123456789abcdef0123"), "chess-app@0123456789ab");
    assert.equal(releaseName(""), undefined);
    assert.equal(releaseName(undefined), undefined);
  });
});

describe("server reports", () => {
  test("scrubServerEvent keeps only the error, method, stripped URL and runtime contexts", () => {
    const event = scrubServerEvent({
      type: undefined,
      user: { id: "1", username: "alice" },
      extra: { input: { password: "x" } },
      server_name: "container-123",
      breadcrumbs: [{ category: "console", message: "secret" }],
      request: {
        method: "POST",
        url: "https://chess.example.com/trpc/auth.login?batch=1",
        headers: { cookie: "chess_session=abc" },
        cookies: { chess_session: "abc" },
        data: '{"password":"x"}',
        query_string: "batch=1",
      },
      contexts: { os: { name: "Linux" }, runtime: { name: "node" }, culture: { locale: "de" } },
      exception: {
        values: [
          {
            type: "Error",
            value: "no user bob@example.com",
            stacktrace: { frames: [{ filename: "/app/x.js", vars: { password: "x" } }] },
          },
        ],
      },
    } as ErrorEvent);
    assert.equal(event.user, undefined);
    assert.equal(event.extra, undefined);
    assert.equal(event.server_name, undefined);
    assert.equal(event.breadcrumbs, undefined);
    assert.deepEqual(event.request, {
      method: "POST",
      url: "https://chess.example.com/trpc/auth.login",
    });
    assert.deepEqual(Object.keys(event.contexts ?? {}).sort(), ["os", "runtime"]);
    assert.equal(event.exception?.values?.[0]?.value, "no user [email]");
    assert.equal(event.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars, undefined);
  });

  test("the tRPC reporter ignores refusals", () => {
    // Without SENTRY_DSN reportServerError is a no-op, so this only checks
    // that neither path throws.
    const onError = trpcErrorReporter("http");
    onError({ error: { code: "UNAUTHORIZED" }, path: "auth.logout", type: "mutation" });
    onError({
      error: { code: "INTERNAL_SERVER_ERROR", cause: new Error("boom") },
      path: "game.move",
      type: "mutation",
    });
  });
});

describe("browser reports", () => {
  test("scrubEvent removes user, cookies, headers and queries", () => {
    const event = scrubEvent({
      type: undefined,
      user: { ip_address: "1.2.3.4" },
      request: {
        url: "https://chess.example.com/games/x?ref=mail#top",
        headers: { "User-Agent": "UA", Cookie: "a=b", Referer: "https://x.example/?q=1" },
      },
      contexts: { browser: { name: "Firefox" }, culture: { timezone: "Europe/Berlin" } },
      exception: {
        values: [
          {
            type: "TypeError",
            value: "x",
            stacktrace: {
              frames: [{ filename: "https://chess.example.com/assets/index-abc.js?v=1" }],
            },
          },
        ],
      },
      breadcrumbs: [
        { category: "console", message: "hello" },
        {
          category: "fetch",
          data: { method: "GET", status_code: 500, url: "/trpc/lobby.list?input=1", body: "x" },
        },
      ],
    } as ErrorEvent);
    assert.equal(event.user, undefined);
    assert.deepEqual(event.request, {
      url: "https://chess.example.com/games/x",
      headers: { "User-Agent": "UA" },
    });
    assert.deepEqual(Object.keys(event.contexts ?? {}), ["browser"]);
    assert.equal(
      event.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename,
      "https://chess.example.com/assets/index-abc.js",
    );
    assert.deepEqual(event.breadcrumbs, [
      {
        type: undefined,
        category: "fetch",
        level: undefined,
        timestamp: undefined,
        data: { method: "GET", status_code: 500, url: "/trpc/lobby.list" },
      },
    ]);
  });

  test("scrubBreadcrumb drops clicks and console lines", () => {
    assert.equal(scrubBreadcrumb({ category: "ui.click", message: "input#password" }), null);
    assert.equal(scrubBreadcrumb({ category: "console", message: "x" }), null);
  });

  test("tRPC client errors are dropped, page errors are kept", () => {
    const trpcError = Object.assign(new Error("Please sign in first."), {
      name: "TRPCClientError",
    });
    assert.equal(
      shouldDropEvent({ type: undefined } as ErrorEvent, { originalException: trpcError }),
      true,
    );
    assert.equal(
      shouldDropEvent(
        {
          type: undefined,
          exception: { values: [{ type: "TRPCWebSocketClosedError" }] },
        } as ErrorEvent,
        {},
      ),
      true,
    );
    assert.equal(
      shouldDropEvent({ type: undefined } as ErrorEvent, { originalException: new TypeError("x") }),
      false,
    );
  });

  const fakeSdk = () => {
    const calls = { init: [] as unknown[], capture: [] as unknown[] };
    const integration = (name: string) => () => ({ name });
    const sdk = {
      init: (options: unknown) => calls.init.push(options),
      captureException: (error: unknown, hint: unknown) => calls.capture.push([error, hint]),
      eventFiltersIntegration: integration("EventFilters"),
      functionToStringIntegration: integration("FunctionToString"),
      browserApiErrorsIntegration: integration("BrowserApiErrors"),
      breadcrumbsIntegration: integration("Breadcrumbs"),
      globalHandlersIntegration: integration("GlobalHandlers"),
      linkedErrorsIntegration: integration("LinkedErrors"),
      dedupeIntegration: integration("Dedupe"),
      httpContextIntegration: integration("HttpContext"),
    } as unknown as Sentry;
    return { sdk, calls };
  };

  const options = (dsn: string, load: () => Promise<Sentry>) => ({
    dsn,
    load,
    release: "chess-app@abc",
    environment: "production",
    tunnel: "/trpc/_e",
  });

  test("without a DSN the SDK is never loaded", async () => {
    let loads = 0;
    const reporter = createErrorReporter(
      options("", async () => {
        loads += 1;
        return fakeSdk().sdk;
      }),
    );
    reporter.report(new Error("boom"), { source: "boundary" });
    assert.equal(await reporter.start(), false);
    assert.equal(loads, 0);
  });

  test("with a DSN the SDK loads once, through the tunnel, and held errors are sent", async () => {
    const { sdk, calls } = fakeSdk();
    let loads = 0;
    const reporter = createErrorReporter(
      options(DSN, async () => {
        loads += 1;
        return sdk;
      }),
    );
    const early = new Error("before load");
    reporter.report(early, { source: "boundary" });
    assert.equal(await reporter.start(), true);
    assert.equal(await reporter.start(), true);
    assert.equal(loads, 1);
    const init = calls.init[0] as Record<string, unknown>;
    assert.equal(init.tunnel, "/trpc/_e");
    assert.equal(init.sendDefaultPii, false);
    assert.equal(init.defaultIntegrations, false);
    assert.equal(init.tracesSampleRate, undefined);
    assert.deepEqual(calls.capture, [[early, { tags: { source: "boundary" } }]]);
  });

  test("an SDK chunk that fails to load is swallowed", async () => {
    const reporter = createErrorReporter(options(DSN, () => Promise.reject(new Error("offline"))));
    assert.equal(await reporter.start(), false);
  });
});

describe("error tunnel", () => {
  const envelope = (dsn: string) =>
    `${JSON.stringify({ dsn, sent_at: "2026-10-19T00:00:00Z" })}\n{"type":"event"}\n{"message":"x"}`;

  async function serve(dsn: string, fetchImpl: typeof fetch) {
    const app = express();
    app.post("/trpc/_e", express.raw({ type: () => true }), createErrorTunnel(dsn, fetchImpl));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return {
      post: (body: string, headers: Record<string, string> = {}) =>
        fetch(`http://127.0.0.1:${port}/trpc/_e`, {
          method: "POST",
          body,
          headers: { "content-type": "text/plain;charset=UTF-8", ...headers },
        }),
      close: () => new Promise((resolve) => server.close(resolve)),
    };
  }

  test("envelopeUrl puts the key in the query", () => {
    assert.equal(
      envelopeUrl(DSN)?.href,
      "https://glitchtip.example.com/api/7/envelope/?sentry_key=abc123&sentry_version=7",
    );
    assert.equal(envelopeUrl("not a url"), null);
    assert.equal(envelopeUrl("https://glitchtip.example.com/7"), null);
  });

  test("without a DSN the tunnel is a 404", async () => {
    const tunnel = await serve("", async () => assert.fail("must not forward"));
    try {
      assert.equal((await tunnel.post(envelope(DSN))).status, 404);
    } finally {
      await tunnel.close();
    }
  });

  test("an envelope for another project or key is refused", async () => {
    const tunnel = await serve(DSN, async () => assert.fail("must not forward"));
    try {
      assert.equal(
        (await tunnel.post(envelope("https://other@glitchtip.example.com/7"))).status,
        400,
      );
      assert.equal(
        (await tunnel.post(envelope("https://abc123@glitchtip.example.com/8"))).status,
        400,
      );
      assert.equal((await tunnel.post(envelope("https://abc123@evil.example.com/7"))).status, 400);
      assert.equal((await tunnel.post("garbage")).status, 400);
    } finally {
      await tunnel.close();
    }
  });

  test("a matching envelope is forwarded alone, and rate limits come back", async () => {
    const seen: Array<{ url: string; init: RequestInit }> = [];
    const tunnel = await serve(DSN, async (url, init) => {
      seen.push({ url: String(url), init: init ?? {} });
      return new Response("{}", {
        status: 200,
        headers: { "x-sentry-rate-limits": "60:error:key", "set-cookie": "x=y" },
      });
    });
    try {
      const body = envelope(DSN);
      const answer = await tunnel.post(body, { cookie: "chess_session=abc" });
      assert.equal(answer.status, 200);
      assert.equal(answer.headers.get("x-sentry-rate-limits"), "60:error:key");
      assert.equal(answer.headers.get("set-cookie"), null);
      assert.equal(seen.length, 1);
      assert.equal(
        seen[0]?.url,
        "https://glitchtip.example.com/api/7/envelope/?sentry_key=abc123&sentry_version=7",
      );
      assert.deepEqual(seen[0]?.init.headers, { "content-type": "application/x-sentry-envelope" });
      assert.equal(Buffer.from(seen[0]?.init.body as Uint8Array).toString("utf8"), body);
    } finally {
      await tunnel.close();
    }
  });
});
