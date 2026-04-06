import { EventEmitter, on } from "node:events";
import { getRedisClient } from "./redis.js";

export interface RealtimeEvent {
  id: string;
  type: string;
  slug?: string;
  emittedAt: number;
}

const localBus = new EventEmitter();
localBus.setMaxListeners(0);

function createEvent(type: string, slug?: string): RealtimeEvent {
  return {
    id: crypto.randomUUID(),
    type,
    slug,
    emittedAt: Date.now()
  };
}

export function emitLobbyUpdate(type: string, slug?: string): void {
  const event = createEvent(type, slug);
  const redis = getRedisClient();
  if (redis) {
    redis.publish("lobby", JSON.stringify(event));
  } else {
    localBus.emit("lobby", event);
  }
}

export function emitGameUpdate(slug: string, type: string): void {
  const event = createEvent(type, slug);
  const redis = getRedisClient();
  if (redis) {
    redis.publish(`game:${slug}`, JSON.stringify(event));
  } else {
    localBus.emit(`game:${slug}`, event);
  }
  emitLobbyUpdate(type, slug);
}

export async function* subscribeToChannel(
  channel: string,
  signal?: AbortSignal
): AsyncGenerator<RealtimeEvent, void, void> {
  const redis = getRedisClient();

  if (!redis) {
    const iterable = signal
      ? on(localBus, channel, { signal })
      : on(localBus, channel);
    for await (const [event] of iterable) {
      yield event as RealtimeEvent;
    }
    return;
  }

  const subscriber = redis.duplicate();
  subscriber.on("error", () => {});
  await subscriber.subscribe(channel);

  const pending: RealtimeEvent[] = [];
  let notify: (() => void) | null = null;

  subscriber.on("message", (_ch: string, raw: string) => {
    pending.push(JSON.parse(raw) as RealtimeEvent);
    if (notify) {
      notify();
      notify = null;
    }
  });

  const cleanup = () => {
    subscriber.unsubscribe(channel).catch(() => {});
    subscriber.quit().catch(() => {});
  };

  signal?.addEventListener("abort", cleanup, { once: true });

  try {
    while (!signal?.aborted) {
      if (pending.length === 0) {
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
      }
      while (pending.length > 0) {
        yield pending.shift()!;
      }
    }
  } finally {
    cleanup();
  }
}
