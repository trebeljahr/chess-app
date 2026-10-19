/**
 * Text rules for error reports, shared by the server (src/server/instrument.ts)
 * and the browser (src/lib/error-reporting/scrub.ts). Every rule removes
 * something; nothing adds data.
 *
 *  - No query string and no fragment in any URL: a tRPC GET puts its whole
 *    input into `?input=`.
 *  - No `user:password@` in a URL.
 *  - Email addresses and bearer tokens inside a message are replaced.
 */

// No `/` on either side: `node_modules/.pnpm/better-sqlite3@12.11.1/...` is a
// path, not an address, and the server's module errors name such paths.
const EMAIL = /[^\s@<>"'(),;:/]+@[^\s@<>"'(),;:/]+\.[a-z]{2,}/gi;
const BEARER = /\bBearer\s+[\w.~+/=-]+/gi;
/** `?` or `#` and everything after it, inside a longer text. Stops at whitespace and quotes. */
const QUERY_IN_TEXT = /[?#][^\s"'<>]*/g;
/**
 * A URL (absolute, or a root-relative path) inside a longer text. The path
 * stops at a quote or bracket; a query string or fragment, once begun, runs
 * to the next whitespace, so a tRPC `?input={"a":1}` is removed whole rather
 * than cut at its first quote with the rest left in the message.
 */
const URL_IN_TEXT = /(?:\b[a-z][\w+.-]*:\/\/|(?<![\w.])\/)[^\s"'<>?#]*(?:[?#]\S*)?/gi;

/**
 * A URL with its query string, fragment and any `user:password@` removed.
 * Never parses, so a URL that would fail to parse is still stripped.
 */
export function stripUrl(url: string): string {
  const cut = url.search(/[?#]/);
  const bare = cut === -1 ? url : url.slice(0, cut);
  return bare.replace(/^([a-z][\w+.-]*:\/\/)[^/@]*@/i, "$1");
}

/** Free text (an error message) with URLs stripped, email addresses and bearer tokens replaced. */
export function scrubText(text: string): string {
  // URLs first: stripping one removes any `user:password@` before the email
  // rule could half-match it, and any address that was only in its query.
  return text
    .replace(BEARER, "Bearer [redacted]")
    .replace(URL_IN_TEXT, (url) => stripUrl(url))
    .replace(QUERY_IN_TEXT, (rest) => (rest.includes("=") ? "" : rest))
    .replace(EMAIL, "[email]");
}

/** `chess-app@<commit>`, the release every report carries; undefined without a commit. */
export function releaseName(commit: string | undefined): string | undefined {
  const build = commit?.trim().slice(0, 12);
  return build ? `chess-app@${build}` : undefined;
}
