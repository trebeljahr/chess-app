import { EventEmitter, on } from "node:events";
import { getRedisClient, getRedisConnection } from "./redis.js";

export interface RealtimeEvent {
  id: string;
  type: string;
  slug?: string;
  emittedAt: number;
}

const localBus = new EventEmitter();
localBus.setMaxListeners(0);
const subscribers = new Set<() => void>();

function createEvent(type: string, slug?: string): RealtimeEvent {
  return { id: crypto.randomUUID(), type, slug, emittedAt: Date.now() };
}

function publish(channel: string, event: RealtimeEvent): void {
  const redis = getRedisClient();
  if (redis) {
    // The database commit already completed. A transport failure must not
    // turn it into an ambiguous mutation error; reconnect snapshots repair gaps.
    void redis.publish(channel, JSON.stringify(event)).catch(() => {});
  } else if (!process.env.REDIS_URL) {
    localBus.emit(channel, event);
  }
}

export function emitLobbyUpdate(type: string, slug?: string): void {
  publish("lobby", createEvent(type, slug));
}

export function emitGameUpdate(slug: string, type: string): void {
  publish(`game:${slug}`, createEvent(type, slug));
  emitLobbyUpdate(type, slug);
}

function parseEvent(raw: string): RealtimeEvent | null {
  if (raw.length > 4096) return null;
  try {
    const event = JSON.parse(raw) as Partial<RealtimeEvent>;
    if (
      typeof event.id !== "string" ||
      event.id.length > 100 ||
      typeof event.type !== "string" ||
      event.type.length > 100 ||
      typeof event.emittedAt !== "number" ||
      !Number.isFinite(event.emittedAt) ||
      (event.slug !== undefined && (typeof event.slug !== "string" || event.slug.length > 100))
    )
      return null;
    return {
      id: event.id,
      type: event.type,
      emittedAt: event.emittedAt,
      ...(event.slug === undefined ? {} : { slug: event.slug }),
    };
  } catch {
    return null;
  }
}

export function closeRealtime(): void {
  for (const close of [...subscribers]) close();
}

export async function* subscribeToChannel(
  channel: string,
  signal?: AbortSignal,
): AsyncGenerator<RealtimeEvent, void, void> {
  if (signal?.aborted) return;
  const redis = getRedisConnection();
  if (!redis) {
    if (process.env.REDIS_URL || process.env.NODE_ENV === "production")
      throw new Error("Realtime unavailable");
    const iterable = signal ? on(localBus, channel, { signal }) : on(localBus, channel);
    try {
      for await (const [event] of iterable) yield event as RealtimeEvent;
    } catch (error) {
      if (!signal?.aborted) throw error;
    }
    return;
  }

  const subscriber = redis.duplicate({ lazyConnect: false });
  let stopped = false;
  // These events only invalidate snapshots. Coalesce bursts so a slow
  // websocket cannot grow an unbounded in-memory queue.
  let pending: RealtimeEvent | undefined;
  let notify: (() => void) | undefined;
  const wake = () => {
    const next = notify;
    notify = undefined;
    next?.();
  };
  const enqueue = (event: RealtimeEvent) => {
    pending = event;
    wake();
  };
  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    signal?.removeEventListener("abort", cleanup);
    subscribers.delete(cleanup);
    redis.off("ready", resubscribe);
    subscriber.disconnect();
    wake();
  };
  subscriber.on("error", () => {});
  subscriber.on("message", (received: string, raw: string) => {
    if (received !== channel) return;
    const event = parseEvent(raw);
    if (event) enqueue(event);
  });
  const resubscribe = () => {
    // Listener comes before SUBSCRIBE. Invalidate after every Redis reconnect,
    // even when the client's websocket stayed connected throughout the gap.
    void subscriber
      .subscribe(channel)
      .then(() => {
        if (!stopped) enqueue(createEvent("snapshot-required"));
      })
      .catch(() => {});
  };
  subscriber.on("ready", resubscribe);
  redis.on("ready", resubscribe);
  subscribers.add(cleanup);
  signal?.addEventListener("abort", cleanup, { once: true });
  if (signal?.aborted) cleanup();
  try {
    while (!stopped) {
      if (!pending)
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
      if (stopped) break;
      if (pending) {
        const event = pending;
        pending = undefined;
        yield event;
      }
    }
  } finally {
    cleanup();
  }
}
