import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { createDefaultGameState } from "../src/shared/chess.js";

const dir = mkdtempSync(join(tmpdir(), "chess-version-"));
process.env.CHESS_DB_FILE = join(dir, "chess.db");
process.env.NODE_ENV = "test";
const { findGameBySlug, insertGame, insertUser, removeGame, updateGame } = await import(
  "../src/server/data.js"
);
const { sqlite } = await import("../src/server/db.js");
after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

test("stale game writes and deletes cannot overwrite a newer version", () => {
  const now = Date.now();
  insertUser({ id: "u1", username: "player", passwordHash: "unused", createdAt: now });
  insertGame({
    id: "g1",
    slug: "match",
    name: "Match",
    createdById: "u1",
    state: createDefaultGameState(),
    createdAt: now,
    updatedAt: now,
  });
  const initial = findGameBySlug("match");
  assert.ok(initial);
  assert.equal(initial.version, 0);
  assert.equal(
    updateGame(initial.id, initial.version, { state: initial.state, updatedAt: now + 1 }),
    true,
  );
  assert.equal(
    updateGame(initial.id, initial.version, { state: initial.state, updatedAt: now + 2 }),
    false,
  );
  assert.equal(removeGame(initial.id, initial.version), false);
  const current = findGameBySlug("match");
  assert.ok(current);
  assert.equal(current.version, 1);
  assert.equal(current.updatedAt, now + 1);
});
