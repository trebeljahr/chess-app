#!/usr/bin/env node
// Finish `vite build` output for the Cloudflare Worker (wrangler.jsonc):
// write /version.json (the commit, read by the deploy job) and /404.html
// (the app shell, so an unknown path still reaches the router's "send home").
//
//   COMMIT_SHA=<sha> node scripts/prepare-worker-assets.mjs [dist/client]
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const out = resolve(process.argv[2] ?? "dist/client");
const index = join(out, "index.html");
if (!existsSync(index)) throw new Error(`${index} is missing; run pnpm run build:client first`);

const html = readFileSync(index, "utf8");
// A relative base ("./assets/…") breaks every nested route such as /games/:slug.
if (html.includes('"./assets/') || !html.includes('"/assets/'))
  throw new Error("index.html must load its bundle from /assets/ (Vite base '/')");
for (const file of ["_headers", "_redirects"]) {
  if (!existsSync(join(out, file))) throw new Error(`${file} did not reach ${out}`);
}

const commit =
  process.env.COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error(`Not a commit: ${commit}`);

copyFileSync(index, join(out, "404.html"));
writeFileSync(join(out, "version.json"), `${JSON.stringify({ commit })}\n`);
console.log(`Prepared ${out} for the Worker at ${commit}`);
