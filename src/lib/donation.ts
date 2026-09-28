export const DONATE_URL = "https://ricos.site/donate?from=online-chess";
export const DONATION_SUPPORTED_AT_KEY = "donation-supported-at";

// ricos.site/donate sends donors back with ?supported=1. Remember when, then drop the
// param so a reload or shared link does not count again. Runs before the router mounts.
export function recordDonationReturn(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get("supported") !== "1") return;

  try {
    localStorage.setItem(DONATION_SUPPORTED_AT_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode, quota): still strip the param.
  }

  url.searchParams.delete("supported");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
