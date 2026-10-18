import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { addPlayerToGame, createDefaultGameState, executeMove } from "../src/shared/chess.js";

const dir = mkdtempSync(join(tmpdir(), "chess-compact-"));
process.env.CHESS_DB_FILE = join(dir, "chess.db");
process.env.NODE_ENV = "test";
const { insertGame, insertUser } = await import("../src/server/data.js");
const { sqlite } = await import("../src/server/db.js");
const { compactGames } = await import("../src/server/compact-games.js");
after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

const row = (id: string) =>
  sqlite.prepare("SELECT state, version, updated_at FROM games WHERE id = ?").get(id) as {
    state: string;
    version: number;
    updated_at: number;
  };

test("rewrites legacy full boards as keys and leaves everything else alone", () => {
  insertUser({ id: "u1", username: "player", passwordHash: "unused", createdAt: 1 });
  let state = addPlayerToGame(createDefaultGameState(), {
    userId: "u1",
    name: "player",
    color: "white",
  });
  state = addPlayerToGame(state, { userId: "u2", name: "other", color: "black" });
  state = executeMove(state, "u1", "E2", "E4").state;

  // Stored the way releases before boardHistory wrote it.
  const legacy: Record<string, unknown> = {
    ...state,
    oldBoards: [createDefaultGameState().board, state.board],
  };
  delete legacy.boardHistory;
  for (const [id, gameState] of [
    ["old", legacy],
    ["new", state],
  ] as const) {
    insertGame({
      id,
      slug: id,
      name: id,
      createdById: "u1",
      state: gameState as typeof state,
      createdAt: 1,
      updatedAt: 2,
    });
  }
  sqlite.prepare("UPDATE games SET version = 3").run();
  const untouched = row("new").state;
  const original = row("old").state;

  const dryRun = compactGames(true);
  assert.equal(dryRun.games, 1);
  assert.ok(dryRun.bytesAfter < dryRun.bytesBefore);
  assert.equal(row("old").state, original);

  assert.deepEqual(compactGames(), dryRun);
  const compacted = row("old");
  assert.deepEqual(JSON.parse(compacted.state), JSON.parse(JSON.stringify(state)));
  assert.equal(compacted.version, 3);
  assert.equal(compacted.updated_at, 2);
  assert.equal(row("new").state, untouched);

  assert.equal(compactGames().games, 0);
});
