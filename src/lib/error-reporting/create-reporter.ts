import { scrubBreadcrumb, scrubEvent, shouldDropEvent } from "./scrub";
import type * as Sdk from "./sdk";

/** The SDK surface the reporter uses: the named re-exports in `sdk.ts`. */
export type Sentry = typeof Sdk;

/** Where a report was captured by this code, rather than by the SDK's global handlers. */
export interface ReportContext {
  /** `boundary` is the ErrorBoundary in App.tsx. */
  source: "boundary";
}

export interface ErrorReporter {
  /** Loads and starts the SDK once. Resolves false when there is no DSN or the SDK failed to load. */
  start(): Promise<boolean>;
  /** Reports an error an error boundary caught. A no-op without a DSN. */
  report(error: unknown, context: ReportContext): void;
}

export interface ErrorReporterOptions {
  dsn: string;
  /** Imports the SDK. Never called when `dsn` is empty. */
  load: () => Promise<Sentry>;
  release: string | undefined;
  environment: string;
  /** Same-origin path the SDK posts envelopes to. */
  tunnel: string;
}

/** Errors held while the SDK loads. An error before it loads is the likeliest to matter. */
const MAX_PENDING = 20;

export function createErrorReporter(options: ErrorReporterOptions): ErrorReporter {
  let started: Promise<boolean> | null = null;
  let sdk: Sentry | null = null;
  let pending: Array<{ error: unknown; context: ReportContext }> = [];

  const capture = (client: Sentry, error: unknown, context: ReportContext): void => {
    client.captureException(error, { tags: { source: context.source } });
  };

  const start = (): Promise<boolean> => {
    if (!options.dsn) return Promise.resolve(false);
    started ??= options
      .load()
      .then((client) => {
        client.init({
          dsn: options.dsn,
          tunnel: options.tunnel,
          release: options.release,
          environment: options.environment,
          sendDefaultPii: false,
          sendClientReports: false,
          // No tracing: no tracesSampleRate and no browserTracingIntegration.
          // The list replaces the SDK defaults, leaving out the session
          // integration (a ping on every page load), the culture context and
          // the DOM and console breadcrumbs.
          defaultIntegrations: false,
          integrations: [
            client.eventFiltersIntegration(),
            client.functionToStringIntegration(),
            client.browserApiErrorsIntegration(),
            client.breadcrumbsIntegration({
              console: false,
              dom: false,
              sentry: false,
              fetch: true,
              xhr: true,
              history: true,
            }),
            client.globalHandlersIntegration(),
            client.linkedErrorsIntegration(),
            client.dedupeIntegration(),
            client.httpContextIntegration(),
          ],
          maxBreadcrumbs: 30,
          beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
          beforeSend: (event, hint) => (shouldDropEvent(event, hint) ? null : scrubEvent(event)),
          initialScope: { tags: { platform: "web" } },
        });
        sdk = client;
        const held = pending;
        pending = [];
        for (const { error, context } of held) capture(client, error, context);
        return true;
      })
      .catch(() => {
        // The SDK chunk failed to load (offline, or a deploy removed it).
        pending = [];
        return false;
      });
    return started;
  };

  return {
    start,
    report(error, context) {
      if (!options.dsn) return;
      if (sdk) {
        capture(sdk, error, context);
        return;
      }
      if (pending.length < MAX_PENDING) pending.push({ error, context });
      void start();
    },
  };
}
