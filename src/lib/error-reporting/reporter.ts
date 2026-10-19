import { releaseName } from "../../shared/error-scrub";
import { createErrorReporter, type ReportContext, type Sentry } from "./create-reporter";

/**
 * Error reports from the web client to GlitchTip, the same project the server
 * reports to with SENTRY_DSN.
 *
 * Opt-in per build: VITE_SENTRY_DSN is inlined by vite.config.ts, and a build
 * without it never loads the SDK. The SDK is a dynamic import started after
 * the first render, so it is never part of the entry chunk.
 *
 * Envelopes go to /trpc/_e on this origin (src/server/error-tunnel.ts), which
 * forwards them to GlitchTip: ad blockers let a same-origin request through,
 * and GlitchTip never sees the visitor's address.
 *
 * What a report may contain is `scrub.ts`. What it adds is only this build's
 * release and the platform tag. No session replay, no tracing, no session
 * pings: the SDK sends something only when an error happens.
 */

/**
 * The SDK import, behind a condition on the inlined DSN in the same
 * expression. vite.config.ts defines VITE_SENTRY_DSN as "" when it is unset,
 * so the condition is a literal in every build; without a DSN the bundler
 * folds it to its false branch and the SDK chunk is never emitted.
 */
const loadSentry = (): Promise<Sentry> =>
  import.meta.env.VITE_SENTRY_DSN
    ? import("./sdk")
    : Promise.reject(new Error("error reporting is not configured"));

const reporter = createErrorReporter({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  load: loadSentry,
  release: releaseName(import.meta.env.VITE_BUILD_COMMIT),
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  tunnel: "/trpc/_e",
});

/** Starts reporting if this build has a DSN. Call once the app has rendered. */
export const startErrorReporting = (): Promise<boolean> => reporter.start();

/** Reports an error an error boundary caught. A no-op in a build without a DSN. */
export const reportClientError = (error: unknown, context: ReportContext): void =>
  reporter.report(error, context);
