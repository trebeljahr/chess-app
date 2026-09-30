import { TRPCError } from "@trpc/server";

// Socket peers are the trust boundary. Forwarding headers are never accepted.
// Behind a proxy, peers share a budget until a trusted proxy scheme is configured.
export function createAuthLimiter(maxAttempts = 10, windowMs = 60_000, maxPeers = 10_000) {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  return (peer: string, now = Date.now()) => {
    for (const [key, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(key);
    }
    const entry = attempts.get(peer);
    if ((entry && entry.count >= maxAttempts) || (!entry && attempts.size >= maxPeers)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Try again later.",
      });
    }
    if (entry) entry.count += 1;
    else attempts.set(peer, { count: 1, resetAt: now + windowMs });
  };
}
