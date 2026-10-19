// Error reports to GlitchTip (a Sentry-protocol endpoint), on when SENTRY_DSN
// is set in the chess-server app's env and silent without it. Imported first
// in index.ts so the global handlers are in place before anything else runs.
//
// The integration list replaces the SDK defaults: no http/express
// instrumentation (it would attach request headers, cookies and query strings
// to every event), no tracing, no breadcrumbs (a console line can hold
// anything), no session pings. What is left reports uncaught exceptions,
// unhandled rejections and the tRPC errors index.ts hands to
// reportServerError. An uncaught exception still ends the process, as it did
// before: the SDK flushes the report, then exits.
//
// A report carries the error, its stack, the release, the platform tag and
// the procedure path. Never a user, a cookie, a header, a request body or a
// procedure's input. Keep the privacy note in docs/coolify-deployment.md in
// step with this file.
import * as Sentry from "@sentry/node";
import { releaseName, scrubText, stripUrl } from "../shared/error-scrub.js";

const dsn = process.env.SENTRY_DSN?.trim() ?? "";

/** The only `contexts` keys a report keeps. */
const KEPT_CONTEXTS: ReadonlySet<string> = new Set(["os", "runtime", "trace"]);

/** An event with everything outside the policy above removed. Mutates and returns it. */
export function scrubServerEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  delete event.user;
  delete event.extra;
  delete event.server_name;
  delete event.breadcrumbs;
  delete event.modules;

  if (event.request) {
    event.request = {
      ...(event.request.method ? { method: event.request.method } : {}),
      ...(event.request.url ? { url: stripUrl(event.request.url) } : {}),
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
    for (const frame of exception.stacktrace?.frames ?? []) delete frame.vars;
  }

  return event;
}

export const errorReportingEnabled = dsn !== "";

if (errorReportingEnabled) {
  Sentry.init({
    dsn,
    release: releaseName(process.env.COMMIT_SHA),
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    sendDefaultPii: false,
    sendClientReports: false,
    // No OpenTelemetry hooks on every later import: nothing here traces.
    registerEsmLoaderHooks: false,
    defaultIntegrations: false,
    integrations: [
      Sentry.eventFiltersIntegration(),
      Sentry.functionToStringIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
      Sentry.contextLinesIntegration(),
      Sentry.nodeContextIntegration(),
    ],
    maxBreadcrumbs: 0,
    beforeSend: (event) => scrubServerEvent(event),
    initialScope: { tags: { platform: "server" } },
  });
}

/** Where index.ts caught an error. Every value becomes a tag on the report. */
export interface ServerErrorContext {
  transport: "http" | "ws";
  /** The tRPC procedure, e.g. `game.move`. Never its input. */
  path?: string;
  type?: string;
}

/** Reports an error a handler caught. A no-op without SENTRY_DSN. */
export function reportServerError(error: unknown, context: ServerErrorContext): void {
  if (!errorReportingEnabled) return;
  Sentry.captureException(error, {
    tags: {
      source: "trpc",
      transport: context.transport,
      ...(context.path ? { trpc_path: context.path } : {}),
      ...(context.type ? { trpc_type: context.type } : {}),
    },
  });
}

/**
 * tRPC's onError, for one transport. Only INTERNAL_SERVER_ERROR is a bug;
 * every other code (UNAUTHORIZED, BAD_REQUEST, TOO_MANY_REQUESTS, …) is the
 * server refusing a request on purpose. A thrown non-tRPC error arrives
 * wrapped, with the original as `cause`: that one has the useful stack.
 */
export function trpcErrorReporter(transport: ServerErrorContext["transport"]) {
  return ({
    error,
    path,
    type,
  }: {
    error: { code: string; cause?: unknown };
    path?: string;
    type: string;
  }): void => {
    if (error.code !== "INTERNAL_SERVER_ERROR") return;
    reportServerError(error.cause instanceof Error ? error.cause : error, {
      transport,
      path,
      type,
    });
  };
}
