import { createServer } from "node:http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter } from "./router.js";
import { createExpressContext, createWsContext } from "./context.js";
import { getRedisClient } from "./redis.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const app = express();

app.get("/health", (_req, res) => {
  const redis = getRedisClient();
  res.json({
    ok: true,
    uptime: process.uptime(),
    redis: redis ? redis.status : "disabled"
  });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createExpressContext
  })
);

const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/trpc"
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createWsContext
});

server.listen(port, host, () => {
  console.log(`Chess app listening on http://${host}:${port}`);
  console.log(
    getRedisClient()
      ? "[redis] Pub/sub enabled"
      : "[redis] No REDIS_URL, using in-process events"
  );
});

process.on("SIGTERM", () => {
  handler.broadcastReconnectNotification();
  getRedisClient()?.quit();
  wss.close();
  server.close();
});
