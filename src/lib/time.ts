export function formatRelativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp;

  if (delta < 60_000) {
    return "just now";
  }

  if (delta < 3_600_000) {
    return `${Math.floor(delta / 60_000)}m ago`;
  }

  if (delta < 86_400_000) {
    return `${Math.floor(delta / 3_600_000)}h ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp);
}
