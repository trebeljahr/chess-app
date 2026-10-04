import { Redis } from "ioredis";

let client: Redis | null = null;

const url = process.env.REDIS_URL;

if (url && process.env.NODE_ENV !== "test") {
  client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    commandTimeout: 2000,
    retryStrategy(times) {
      return Math.min(times * 500, 5000);
    },
    lazyConnect: true,
  });

  // One recovery listener per active subscription; each removes itself on close.
  client.setMaxListeners(0);

  let errorLogged = false;

  client.on("ready", () => {
    errorLogged = false;
    console.log("[redis] Connected");
  });

  client.on("error", (_err: Error) => {
    if (!errorLogged) {
      errorLogged = true;
      console.error("[redis] Connection error, retrying in background...");
    }
  });

  client.connect().catch(() => {});
}

export function getRedisClient(): Redis | null {
  return client?.status === "ready" ? client : null;
}

export function getRedisConnection(): Redis | null {
  return client;
}

export function realtimeReady(): boolean {
  return process.env.REDIS_URL ? client?.status === "ready" : process.env.NODE_ENV !== "production";
}

let probe: Promise<boolean> | null = null;
export async function probeRealtime(): Promise<boolean> {
  if (!realtimeReady()) return false;
  if (!client) return true;
  const connection = client;
  probe ??= connection
    .ping()
    .then(() => true)
    .catch(() => {
      // A stalled connection can still report "ready". Reconnect also gives
      // subscribers an explicit recovery boundary for snapshot invalidation.
      connection.disconnect(true);
      return false;
    })
    .finally(() => {
      probe = null;
    });
  return probe;
}

export function closeRedis(): void {
  client?.disconnect();
}
