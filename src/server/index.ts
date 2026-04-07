import { createServer } from "node:http";
import express, { type Request } from "express";
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

// Simple in-memory rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_ATTEMPTS = 10;

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

app.use("/trpc/auth.login", (req, res, next) => {
  if (req.method !== "POST") return next();
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = authAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= AUTH_MAX_ATTEMPTS) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }
    entry.count += 1;
  } else {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
  }

  next();
});

app.use("/trpc/auth.register", (req, res, next) => {
  if (req.method !== "POST") return next();
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = authAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= AUTH_MAX_ATTEMPTS) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }
    entry.count += 1;
  } else {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
  }

  next();
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
