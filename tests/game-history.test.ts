import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addPlayerToGame,
  type Board,
  createDefaultGameState,
  executeMove,
  forfeitGame,
  type GameState,
  getHistoryBoard,
  handleUndo,
  normalizeGameState,
  proposeUndo,
} from "../src/shared/chess.js";

// Italian game with castling (E1-G1) and a capture (F6xE4).
const MOVES = [
  ["E2", "E4"],
  ["E7", "E5"],
  ["G1", "F3"],
  ["B8", "C6"],
  ["F1", "C4"],
  ["G8", "F6"],
  ["E1", "G1"],
  ["F6", "E4"],
] as const;

// White's h-pawn takes on g5 and h7, then takes the g8 knight and waits for a piece.
const PROMOTION = [
  ["H2", "H4"],
  ["G7", "G5"],
  ["H4", "G5"],
  ["A7", "A6"],
  ["G5", "G6"],
  ["A6", "A5"],
  ["G6", "H7"],
  ["A5", "A4"],
  ["H7", "G8"],
] as const;

type Line = ReadonlyArray<readonly [string, string]>;

function newGame() {
  const state = addPlayerToGame(createDefaultGameState(), {
    userId: "w",
    name: "W",
    color: "white",
  });
  return addPlayerToGame(state, { userId: "b", name: "B", color: "black" });
}

function playLine(start: GameState, line: Line) {
  let state = start;
  for (const [from, to] of line) {
    state = executeMove(state, state.turn === "white" ? "w" : "b", from, to).state;
  }
  return state;
}

function play(count: number) {
  let state = newGame();
  // The board stored after each history entry, as releases before boardHistory kept it.
  const boards: Board[] = [structuredClone(state.board)];
  for (const [from, to] of MOVES.slice(0, count)) {
    state = executeMove(state, state.turn === "white" ? "w" : "b", from, to).state;
    boards.push(structuredClone(state.board));
  }
  return { state, boards };
}

function pieces(board: Board) {
  return board.map((row) => row.map((tile) => tile.figure));
}

test("each history entry stores a short key that rebuilds its board", () => {
  const { state, boards } = play(MOVES.length);
  assert.equal(state.boardHistory.length, state.moveHistory.length);
  assert.deepEqual(state.oldBoards, []);
  assert.equal(state.boardHistory[0], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w");
  assert.equal(
    state.boardHistory.at(-1),
    "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w",
  );
  assert.deepEqual(pieces(getHistoryBoard(state, 0)!), pieces(boards[0]));
  // Later boards match exactly, including the threat markers the client reads.
  for (let index = 1; index < boards.length; index += 1) {
    assert.deepEqual(getHistoryBoard(state, index), boards[index], `entry ${index}`);
  }
});

test("undo restores the previous board from its key", () => {
  const { state, boards } = play(7);
  const undone = handleUndo(proposeUndo(state, "w"), "b");
  assert.deepEqual(undone.board, boards[6]);
  assert.equal(undone.turn, "white");
  assert.equal(undone.boardHistory.length, 7);
  assert.equal(undone.moveHistory.length, 7);
});

test("undo leaves repetition and fifty-move state as if the move was never played", () => {
  const lines: Record<string, Line> = {
    // A stale hash of the undone position made replaying this move a repetition.
    "quiet move": [
      ["G1", "F3"],
      ["G8", "F6"],
      ["F3", "G1"],
    ],
    // The capture had reset the fifty-move counter from 5 to 0.
    capture: MOVES,
    // The promoting move has no key or position hash yet.
    "pending promotion": PROMOTION,
  };
  const comparable = (state: GameState) => ({ ...state, timestamp: 0 });

  for (const [name, line] of Object.entries(lines)) {
    const start = newGame();
    const played = playLine(start, line);
    const neverPlayed = playLine(start, line.slice(0, -1));
    const undone = handleUndo(proposeUndo(played, "w"), "b");

    assert.equal(undone.halfMoveClock, neverPlayed.halfMoveClock, `${name}: halfMoveClock`);
    assert.deepEqual(undone.positionHistory, neverPlayed.positionHistory, `${name}: positions`);
    assert.deepEqual(comparable(undone), comparable(neverPlayed), `${name}: undone state`);

    // Playing the move again is not a repetition of itself.
    const replayed = playLine(undone, line.slice(-1));
    assert.equal(replayed.remis, false, `${name}: replay is no draw`);
    assert.deepEqual(comparable(replayed), comparable(played), `${name}: replayed state`);
  }
});

test("legacy full boards fold into keys", () => {
  const { state, boards } = play(MOVES.length);
  const finished = forfeitGame(state, "w");
  const allBoards = [...boards, structuredClone(finished.board)];
  const legacy = { ...finished, oldBoards: allBoards } as Partial<GameState>;
  delete legacy.boardHistory;

  // A row written before boardHistory existed.
  assert.deepEqual(normalizeGameState(legacy as GameState), finished);

  // A new-format row an older replica appended full boards to.
  const mixed = {
    ...finished,
    boardHistory: finished.boardHistory.slice(0, 4),
    oldBoards: allBoards.slice(4),
  };
  assert.deepEqual(normalizeGameState(mixed), finished);
  assert.deepEqual(getHistoryBoard(mixed, 6), allBoards[6]);
});
