import { Redis } from "ioredis";

let client: Redis | null = null;
let connected = false;

const url = process.env.REDIS_URL;

if (url && process.env.NODE_ENV !== "test") {
  client = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 500, 5000);
    },
    lazyConnect: true
  });

  let errorLogged = false;

  client.on("connect", () => {
    connected = true;
    errorLogged = false;
    console.log("[redis] Connected");
  });

  client.on("close", () => {
    connected = false;
  });

  client.on("error", (err: Error) => {
    connected = false;
    if (!errorLogged) {
      errorLogged = true;
      console.error("[redis] Connection error, retrying in background...");
    }
  });

  client.connect().catch(() => {});
}

export function getRedisClient(): Redis | null {
  return connected ? client : null;
}
