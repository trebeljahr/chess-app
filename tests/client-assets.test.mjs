import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { retainAssets, retainedAssetPath } from "../client/assets.mjs";

test("both client releases retain immutable assets and refuse collisions", () => {
  const directory = mkdtempSync(join(tmpdir(), "chess-assets-"));
  try {
    const store = join(directory, "retained");
    for (const release of ["a", "b"]) {
      mkdirSync(join(directory, release, "assets"), { recursive: true });
      writeFileSync(join(directory, release, "assets", `entry-${release}.js`), release);
      retainAssets(join(directory, release), store);
    }
    for (const release of ["a", "b"])
      assert.equal(
        readFileSync(retainedAssetPath(store, `/assets/entry-${release}.js`), "utf8"),
        release,
      );
    retainAssets(join(directory, "a"), store);
    writeFileSync(join(directory, "a", "assets", "entry-a.js"), "changed");
    assert.throws(() => retainAssets(join(directory, "a"), store), /collision/);
    assert.equal(readFileSync(join(store, "entry-a.js"), "utf8"), "a");
    assert.equal(retainedAssetPath(store, "/assets/%2e%2e/private"), null);
    assert.equal(retainedAssetPath(store, "/index.html"), null);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
