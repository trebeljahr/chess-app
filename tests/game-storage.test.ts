import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { addPlayerToGame, createDefaultGameState, executeMove } from "../src/shared/chess.js";

const dir = mkdtempSync(join(tmpdir(), "chess-storage-"));
process.env.CHESS_DB_FILE = join(dir, "chess.db");
process.env.NODE_ENV = "test";
const { findGameBySlug, insertGame, insertUser, listGameSummaries } = await import(
  "../src/server/data.js"
);
const { sqlite } = await import("../src/server/db.js");
after(() => {
  sqlite.close();
  rmSync(dir, { recursive: true, force: true });
});

test("lobby summaries and legacy rows", () => {
  const now = Date.now();
  insertUser({ id: "u1", username: "player", passwordHash: "unused", createdAt: now });
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
  insertGame({
    id: "g1",
    slug: "old",
    name: "Old",
    createdById: "u1",
    state: legacy as typeof state,
    createdAt: now,
    updatedAt: now,
  });
  insertGame({
    id: "g2",
    slug: "new",
    name: "New",
    createdById: "u1",
    state: { ...createDefaultGameState(), archived: true },
    createdAt: now,
    updatedAt: now + 1,
  });

  assert.deepEqual(listGameSummaries(), [
    {
      id: "g2",
      slug: "new",
      name: "New",
      createdAt: now,
      updatedAt: now + 1,
      archived: true,
      users: [],
      moveCount: 0,
    },
    {
      id: "g1",
      slug: "old",
      name: "Old",
      createdAt: now,
      updatedAt: now,
      archived: false,
      users: state.users,
      moveCount: 1,
    },
  ]);

  const old = findGameBySlug("old");
  assert.ok(old);
  assert.deepEqual(old.state.oldBoards, []);
  assert.deepEqual(old.state.boardHistory, state.boardHistory);
});
