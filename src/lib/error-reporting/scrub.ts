import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/browser";
import { scrubText, stripUrl } from "../../shared/error-scrub";

/**
 * What a browser error report may carry, decided in one place. Every rule
 * here removes something; nothing adds data. docs/coolify-deployment.md
 * ("Error reporting") says the same in plain words.
 *
 *  - No person: `user` is dropped whole and `sendDefaultPii` stays off.
 *  - No query string and no fragment in any URL: the page address, every
 *    stack frame, every breadcrumb, any URL inside a message. A tRPC GET puts
 *    its whole input into `?input=`.
 *  - No headers but the browser identifier, no cookies, no request body.
 *  - No console output and no clicks or keystrokes in breadcrumbs. Only
 *    fetch, XHR and navigation breadcrumbs survive, reduced to method,
 *    status and a stripped URL.
 *  - Email addresses and bearer tokens inside a message are replaced.
 */

/** The only `contexts` keys a report keeps: what the SDK derives from the browser identifier, plus the trace ids it groups by. */
const KEPT_CONTEXTS: ReadonlySet<string> = new Set(["browser", "os", "device", "runtime", "trace"]);

/** The only breadcrumb categories a report keeps. */
const KEPT_BREADCRUMBS: ReadonlySet<string> = new Set(["fetch", "xhr", "navigation"]);

/**
 * One breadcrumb reduced to what is safe to send, or `null` to drop it.
 * Also the SDK's `beforeBreadcrumb`, so a dropped one is never even stored.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  const category = breadcrumb.category ?? "";
  if (!KEPT_BREADCRUMBS.has(category)) return null;
  const data = breadcrumb.data ?? {};
  const kept: Record<string, unknown> = {};
  if (category === "navigation") {
    if (typeof data.from === "string") kept.from = stripUrl(data.from);
    if (typeof data.to === "string") kept.to = stripUrl(data.to);
  } else {
    if (typeof data.method === "string") kept.method = data.method;
    if (typeof data.status_code === "number") kept.status_code = data.status_code;
    if (typeof data.url === "string") kept.url = stripUrl(data.url);
  }
  return {
    type: breadcrumb.type,
    category,
    level: breadcrumb.level,
    timestamp: breadcrumb.timestamp,
    data: kept,
  };
}

/** An error event with everything outside the policy above removed. Mutates and returns it. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  delete event.extra;
  delete event.server_name;

  if (event.request) {
    const userAgent = event.request.headers?.["User-Agent"];
    event.request = {
      ...(event.request.url ? { url: stripUrl(event.request.url) } : {}),
      ...(userAgent ? { headers: { "User-Agent": userAgent } } : {}),
    };
  }

  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      if (!KEPT_CONTEXTS.has(key)) delete event.contexts[key];
    }
  }

  if (typeof event.message === "string") event.message = scrubText(event.message);
  if (event.logentry?.message) event.logentry.message = scrubText(event.logentry.message);
  if (event.logentry) delete event.logentry.params;

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
    for (const frame of exception.stacktrace?.frames ?? []) {
      if (frame.filename) frame.filename = stripUrl(frame.filename);
      if (frame.abs_path) frame.abs_path = stripUrl(frame.abs_path);
      delete frame.vars;
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map(scrubBreadcrumb)
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }

  return event;
}

/** Errors that are the server's answer, not a bug in this page. */
const DROPPED_ERRORS: ReadonlySet<string> = new Set([
  "TRPCClientError",
  "TRPCWebSocketClosedError",
]);

/**
 * Whether an event is noise that must not be sent. A tRPC client error is the
 * server's answer to a request (a refusal, or no answer on a bad connection):
 * a real server fault is reported by the server itself, with the stack that
 * explains it.
 */
export function shouldDropEvent(event: ErrorEvent, hint: EventHint): boolean {
  const original = hint.originalException;
  if (original instanceof Error && DROPPED_ERRORS.has(original.name)) return true;
  return (event.exception?.values ?? []).some((value) => DROPPED_ERRORS.has(value.type ?? ""));
}
