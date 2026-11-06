// Renders the GitHub social preview cards (1280x640 PNG) from
// docs/marketing/social-preview/template.html, one per variant.
//
//   node scripts/marketing/render-social-preview.mjs
//
// It then rewrites docs/marketing/manifest.json (every screenshot and card
// with its pixel size, byte size and SHA-256). With REVIEW_DIR set, it also
// writes the three PNGs and a labelled review-sheet.jpg (A, B and C side by
// side) into that folder.
//
// Playwright is loaded as in capture-screenshots.mjs: from the repo, from
// PLAYWRIGHT_MODULE, or from the global npm root; CHROMIUM_PATH may name a
// Chromium binary. The template loads its fonts from Google Fonts, so this
// needs a network connection.

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cardDir = join(root, "docs/marketing/social-preview");
const template = pathToFileURL(join(cardDir, "template.html")).href;
const variants = ["a", "b", "c"];

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

// Pixel size from a PNG IHDR or a JPEG SOF marker.
function imageSize(bytes) {
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  let offset = 2;
  while (offset < bytes.length) {
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error("Unknown image format");
}

const SOURCES = {
  screenshots: "scripts/marketing/capture-screenshots.mjs (local dev server, throwaway database)",
  "social-preview": "scripts/marketing/render-social-preview.mjs from social-preview/template.html",
};

async function writeManifest() {
  const marketingDir = join(root, "docs/marketing");
  const files = [];
  for (const folder of Object.keys(SOURCES)) {
    for (const name of (await readdir(join(marketingDir, folder))).sort()) {
      if (!/\.(png|jpe?g)$/.test(name)) continue;
      const path = join(marketingDir, folder, name);
      const bytes = await readFile(path);
      const { mtime } = await stat(path);
      const { width, height } = imageSize(bytes);
      files.push({
        path: relative(marketingDir, path),
        width,
        height,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        made: mtime.toISOString().slice(0, 10),
        source: SOURCES[folder],
      });
    }
  }
  await writeFile(join(marketingDir, "manifest.json"), `${JSON.stringify({ files }, null, 2)}\n`);
  console.log(`Wrote manifest.json (${files.length} files)`);
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 640 },
    deviceScaleFactor: 1,
  });

  for (const variant of variants) {
    await page.goto(`${template}?v=${variant}`, { waitUntil: "networkidle" });
    await page.waitForSelector("body[data-ready='1']");
    const out = join(cardDir, `social-preview-${variant}.png`);
    await page.screenshot({ path: out });
    const { size } = await stat(out);
    console.log(`${out} ${(size / 1024).toFixed(0)} KiB`);
    if (size > 1024 * 1024) console.warn("  over GitHub's 1 MB limit for social previews");
  }

  await writeManifest();

  const reviewDir = process.env.REVIEW_DIR;
  if (reviewDir) {
    await mkdir(reviewDir, { recursive: true });
    for (const variant of variants) {
      const name = `social-preview-${variant}.png`;
      await copyFile(join(cardDir, name), join(reviewDir, name));
    }
    const tiles = [];
    for (const variant of variants) {
      const png = await readFile(join(cardDir, `social-preview-${variant}.png`));
      tiles.push(`<figure><img src="data:image/png;base64,${png.toString("base64")}">
        <figcaption>${variant.toUpperCase()}</figcaption></figure>`);
    }
    const sheet = await browser.newPage({
      viewport: { width: 1960, height: 420 },
      deviceScaleFactor: 1,
    });
    await sheet.setContent(`<style>
      body { margin: 0; padding: 24px; background: #e7e5e4; display: flex; gap: 20px; font: 600 28px system-ui, sans-serif; }
      figure { margin: 0; width: 624px; } img { width: 624px; display: block; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
      figcaption { margin-top: 12px; text-align: center; color: #1c1917; }
    </style>${tiles.join("")}`);
    await sheet.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
    await sheet.screenshot({
      path: join(reviewDir, "review-sheet.jpg"),
      type: "jpeg",
      quality: 88,
      fullPage: true,
    });
    console.log(`Review copies in ${reviewDir}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
