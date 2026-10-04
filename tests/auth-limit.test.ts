import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import superjson from "superjson";
import { createAuthLimiter } from "../src/server/auth-limit.js";
import { authProcedure, router } from "../src/server/trpc.js";

test("bounded budgets expire and fail closed at capacity", () => {
  const consume = createAuthLimiter(2, 100, 1);
  consume("peer", 0);
  consume("peer", 1);
  assert.throws(() => consume("peer", 2), /Too many/);
  assert.throws(() => consume("other", 2), /Too many/);
  consume("other", 100);
});

test("each batched auth operation consumes the socket-peer budget", async () => {
  let calls = 0;
  const auth = authProcedure.mutation(() => ++calls);
  const appRouter = router({ auth: router({ login: auth, register: auth }) });
  const app = express();
  let literalPathHits = 0;
  app.use(["/trpc/auth.login", "/trpc/auth.register"], (_req, _res, next) => {
    literalPathHits += 1;
    next();
  });
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req }) => ({
        user: null,
        session: null,
        clientIp: req.socket.remoteAddress ?? "unknown",
        refreshSession: () => ({ user: null, session: null }),
      }),
    }),
  );
  const server = createServer(app).listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const client = createTRPCClient<typeof appRouter>({
    links: [
      httpBatchLink({
        url: `http://127.0.0.1:${address.port}/trpc`,
        transformer: superjson,
        headers: () => ({ "x-forwarded-for": `spoof-${Math.random()}` }),
      }),
    ],
  });
  try {
    const outcomes = await Promise.allSettled(
      Array.from({ length: 11 }, (_, i) =>
        i % 2 ? client.auth.login.mutate() : client.auth.register.mutate(),
      ),
    );
    assert.equal(calls, 10);
    assert.equal(literalPathHits, 0, "legacy literal mounts miss mixed batches");
    assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
    await assert.rejects(client.auth.login.mutate(), /Too many/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
});
