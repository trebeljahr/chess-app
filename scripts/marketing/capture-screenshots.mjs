// Captures the README / social-preview screenshots of chess-app from a local
// dev server. Two browser contexts play a real game against each other, so
// every screen shows live state, not a mock.
//
// Run the app on a fresh database you can throw away (the players below are
// registered on it), then point this at it:
//   CHESS_DB_FILE=/tmp/chess-capture.db API_PORT=<free port> PORT=<free port> pnpm dev
//   BASE_URL=http://127.0.0.1:<PORT> node scripts/marketing/capture-screenshots.mjs
//
// Playwright is not a dependency of this repo. The script loads it from the
// repo if present, else from PLAYWRIGHT_MODULE (a package folder), else from
// the global npm root (`npm i -g playwright`). CHROMIUM_PATH may name a
// Chromium binary when the installed Playwright has no browser of its own.
//
// Output: docs/marketing/screenshots/*.jpg (desktop at 2x, phone at 3x).
// Afterwards, rebuild the social preview cards:
//   node scripts/marketing/render-social-preview.mjs

import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = process.env.SCREENSHOT_OUT ?? join(root, "docs/marketing/screenshots");
const jpeg = { type: "jpeg", quality: 86 };
const baseUrl = (process.env.BASE_URL ?? "").replace(/\/$/, "");
if (!baseUrl) {
  console.error("Set BASE_URL to the running dev server, e.g. http://127.0.0.1:55065");
  process.exit(1);
}

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try {
    return require("playwright");
  } catch {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    return createRequire(join(globalRoot, "noop.js"))("playwright");
  }
}

const { chromium } = loadPlaywright();

// Short names keep the phone header on one line.
const WHITE = { username: "mira", password: "capture-white-1" };
const BLACK = { username: "jonas", password: "capture-black-1" };
const VIEWER = { username: "sam", password: "capture-viewer-1" };
const OTHERS = [
  { username: "lena", password: "capture-other-1", game: "Lunch blitz", color: "white" },
  { username: "kofi", password: "capture-other-2", game: "Sunday classical", color: "black" },
];

// Giuoco Piano, Moller attack, to move 11...d6: a real middlegame with
// captures on both sides, castled white king and a rook in the centre.
const MOVES = [
  ["E2", "E4"],
  ["E7", "E5"],
  ["G1", "F3"],
  ["B8", "C6"],
  ["F1", "C4"],
  ["F8", "C5"],
  ["C2", "C3"],
  ["G8", "F6"],
  ["D2", "D4"],
  ["E5", "D4"],
  ["C3", "D4"],
  ["C5", "B4"],
  ["B1", "C3"],
  ["F6", "E4"],
  ["E1", "G1"],
  ["B4", "C3"],
  ["D4", "D5"],
  ["C3", "F6"],
  ["F1", "E1"],
  ["C6", "E7"],
  ["E1", "E4"],
  ["D7", "D6"],
];

async function call(page, path, input) {
  return page.evaluate(
    async ({ path, input }) => {
      const response = await fetch(`/trpc/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: input }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(`${path}: ${JSON.stringify(body)}`);
      return body.result?.data?.json;
    },
    { path, input },
  );
}

async function signedInPage(browser, user, viewport, deviceScaleFactor = 2) {
  const context = await browser.newContext({ viewport, deviceScaleFactor, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  try {
    await call(page, "auth.register", { username: user.username, password: user.password });
  } catch {
    await call(page, "auth.login", { username: user.username, password: user.password });
  }
  await page.reload({ waitUntil: "networkidle" });
  return { context, page };
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // Move history and chat scroll inside their cards: show the latest entries.
  await page.evaluate(() => {
    for (const list of document.querySelectorAll(".overflow-y-auto"))
      list.scrollTop = list.scrollHeight;
  });
  await page.waitForTimeout(900);
}

// Element box in CSS pixels, for clipping a screenshot to part of the page.
async function box(page, selector) {
  const found = await page.locator(selector).first().boundingBox();
  if (!found) throw new Error(`No element for ${selector}`);
  return found;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const desktop = { width: 1600, height: 1000 };

  // Open games from other players, so the lobby is not empty.
  for (const other of OTHERS) {
    const { context, page } = await signedInPage(browser, other, desktop, 1);
    await call(page, "lobby.create", { name: other.game, color: other.color, timeControl: "5+3" });
    await context.close();
  }

  const white = await signedInPage(browser, WHITE, desktop);
  const black = await signedInPage(browser, BLACK, desktop);

  const created = await call(white.page, "lobby.create", {
    name: "Friday rapid",
    color: "white",
    timeControl: "10+0",
  });
  const slug = created.slug;
  await call(black.page, "lobby.join", { slug });

  for (const [index, [from, to]] of MOVES.entries()) {
    const mover = index % 2 === 0 ? white.page : black.page;
    await call(mover, "game.move", { slug, from, to });
    if (index === 3) await call(white.page, "game.sendMessage", { slug, text: "Good luck!" });
    if (index === 4)
      await call(black.page, "game.sendMessage", { slug, text: "You too. Italian again?" });
    if (index === 6) await call(white.page, "game.sendMessage", { slug, text: "Always." });
  }

  await white.page.goto(`${baseUrl}/games/${slug}`, { waitUntil: "networkidle" });
  await black.page.goto(`${baseUrl}/games/${slug}`, { waitUntil: "networkidle" });
  await settle(white.page);
  await settle(black.page);
  // Desktop game view down to the white player's clock under the board.
  // The player bars are the rows that hold a clock; the lower one ends the board column.
  const barBottom = await white.page.evaluate(() =>
    Math.max(
      ...[...document.querySelectorAll("main .tabular-nums")].map(
        (clock) => clock.closest(".rounded-2xl").getBoundingClientRect().bottom + window.scrollY,
      ),
    ),
  );
  const gameHeight = Math.ceil(barBottom + 32);
  await white.page.setViewportSize({ width: desktop.width, height: gameHeight });
  await black.page.setViewportSize({ width: desktop.width, height: gameHeight });
  await settle(white.page);
  await settle(black.page);
  await white.page.screenshot({ ...jpeg, path: join(outDir, "game-desktop.jpg") });
  await black.page.screenshot({ ...jpeg, path: join(outDir, "game-desktop-black.jpg") });

  // The lobby from a third player's seat: the open games to join.
  const lobby = await signedInPage(browser, VIEWER, desktop);
  await lobby.page.getByRole("button", { name: "new", exact: true }).click();
  await settle(lobby.page);
  const joinBox = await box(lobby.page, "text=Join or spectate by game ID");
  await lobby.page.screenshot({
    ...jpeg,
    path: join(outDir, "lobby-open-games.jpg"),
    fullPage: true,
    clip: { x: 0, y: Math.max(0, joinBox.y - 40), width: desktop.width, height: 500 },
  });
  await lobby.context.close();

  // Phone, the white player's view of the same game.
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    storageState: await white.context.storageState(),
  });
  const phonePage = await phone.newPage();
  await phonePage.goto(`${baseUrl}/games/${slug}`, { waitUntil: "networkidle" });
  await settle(phonePage);
  await phonePage.screenshot({ ...jpeg, path: join(outDir, "game-mobile.jpg") });
  await phone.close();

  await white.context.close();
  await black.context.close();
  await browser.close();
  console.log(`Wrote screenshots to ${outDir} (game ${slug})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
