import { Redis } from "ioredis";

let client: Redis | null = null;

const url = process.env.REDIS_URL;

if (url && process.env.NODE_ENV !== "test") {
  client = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 500, 5000);
    },
    lazyConnect: true
  });

  client.on("connect", () => {
    console.log("[redis] Connected");
  });

  client.on("error", (err: Error) => {
    console.error("[redis] Error:", err.message || String(err));
  });

  client.connect().catch(() => {
    // retryStrategy handles reconnection
  });
}

export function getRedisClient(): Redis | null {
  return client;
}
