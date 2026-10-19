/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GlitchTip DSN for browser error reports; "" turns them off. Defined in vite.config.ts. */
  readonly VITE_SENTRY_DSN: string;
  /** Overrides the report environment (the Vite mode), e.g. `wiring-check`. */
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** The commit this build is from, or "". Defined in vite.config.ts. */
  readonly VITE_BUILD_COMMIT: string;
}
