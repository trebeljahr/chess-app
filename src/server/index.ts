import { createServer } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import express from "express";
import { WebSocketServer } from "ws";
import { createExpressContext, createWsContext } from "./context.js";
import { getRedisClient } from "./redis.js";
import { appRouter } from "./router.js";

const port = Number(process.env.PORT ?? 0);
const host = process.env.HOST ?? "127.0.0.1";
const app = express();
let draining = false;
const DRAIN_MS = 20_000;

app.get("/health", (_req, res) => {
  const redis = getRedisClient();
  const ready = !draining && (!process.env.REDIS_URL || redis !== null);
  res.status(ready ? 200 : 503).json({
    ok: ready,
    uptime: process.uptime(),
    redis: redis ? redis.status : "disabled",
  });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createExpressContext,
  }),
);

const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/trpc",
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createWsContext,
});

server.listen(port, host, () => {
  const address = server.address();
  console.log(
    `Chess app listening on http://${host}:${typeof address === "object" && address ? address.port : port}`,
  );
  console.log(
    getRedisClient() ? "[redis] Pub/sub enabled" : "[redis] No REDIS_URL, using in-process events",
  );
});

function shutdown() {
  if (draining) return;
  draining = true;
  // Traefik must observe failed health before active sockets leave this node.
  setTimeout(() => {
    handler.broadcastReconnectNotification();
    for (const socket of wss.clients) socket.close(1001, "Server restarting");
    wss.close();
    server.close();
    getRedisClient()
      ?.quit()
      .catch(() => {});
  }, DRAIN_MS);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
