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

// Both knights out and back: four plies that return to the position they started from.
const KNIGHT_SHUFFLE: Line = [
  ["G1", "F3"],
  ["G8", "F6"],
  ["F3", "G1"],
  ["F6", "G8"],
];

// The same with the queen's knights.
const QUEEN_KNIGHT_SHUFFLE: Line = [
  ["B1", "C3"],
  ["B8", "C6"],
  ["C3", "B1"],
  ["C6", "B8"],
];

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

/** The 1-based ply of the line that ended the game, with its draw reason; null if none did. */
function gameEnd(start: GameState, line: Line) {
  let state = start;
  for (const [index, move] of line.entries()) {
    state = playLine(state, [move]);
    if (state.archived) return { ply: index + 1, drawReason: state.drawReason };
  }
  return null;
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

test("a repeated position draws on its third occurrence, not its second", () => {
  // Ply 5 repeats the position after ply 1 for the first time.
  assert.equal(gameEnd(newGame(), [...KNIGHT_SHUFFLE, KNIGHT_SHUFFLE[0]]), null);

  // After 1.e4 the knights shuffle, so the position after e4 recurs at plies 5 and 9.
  const afterE4: Line = [
    ["E2", "E4"],
    ["G8", "F6"],
    ["G1", "F3"],
    ["F6", "G8"],
    ["F3", "G1"],
    ["G8", "F6"],
    ["G1", "F3"],
    ["F6", "G8"],
    ["F3", "G1"],
  ];
  assert.deepEqual(gameEnd(newGame(), afterE4), { ply: 9, drawReason: "threefold-repetition" });
});

test("the start position counts as its first occurrence", () => {
  // The start position recurs at plies 4 and 8; the position after ply 1 would need ply 9.
  const line = [...KNIGHT_SHUFFLE, ...KNIGHT_SHUFFLE, KNIGHT_SHUFFLE[0]];
  assert.deepEqual(gameEnd(newGame(), line), { ply: 8, drawReason: "threefold-repetition" });

  // Taking back ply 4, the first return to the start, removes that occurrence again.
  const undone = handleUndo(proposeUndo(playLine(newGame(), line.slice(0, 4)), "w"), "b");
  assert.equal(undone.positionHistory.length, 3);
  assert.deepEqual(gameEnd(undone, line.slice(3)), { ply: 5, drawReason: "threefold-repetition" });
});

test("a position with castling rights differs from the same pieces without them", () => {
  // 1.e4 e5 2.Ke2 Nc6 3.Ke1 Nb8: the pieces after ply 2 return at ply 6, but white can no longer castle.
  const kingWalk: Line = [
    ["E2", "E4"],
    ["E7", "E5"],
    ["E1", "E2"],
    ["B8", "C6"],
    ["E2", "E1"],
    ["C6", "B8"],
  ];
  // The pieces recur at plies 10 and 14; only plies 6, 10 and 14 are the same position.
  const king = [...kingWalk, ...KNIGHT_SHUFFLE, ...KNIGHT_SHUFFLE];
  assert.equal(gameEnd(newGame(), king.slice(0, 10)), null);
  assert.deepEqual(gameEnd(newGame(), king), { ply: 14, drawReason: "threefold-repetition" });

  // Both h-rooks out and back restore the start pieces at ply 8, without kingside castling.
  const rookWalk: Line = [
    ["G1", "F3"],
    ["G8", "F6"],
    ["H1", "G1"],
    ["H8", "G8"],
    ["G1", "H1"],
    ["G8", "H8"],
    ["F3", "G1"],
    ["F6", "G8"],
  ];
  const rook = [...rookWalk, ...QUEEN_KNIGHT_SHUFFLE, ...QUEEN_KNIGHT_SHUFFLE];
  assert.equal(gameEnd(newGame(), rook.slice(0, 12)), null);
  assert.deepEqual(gameEnd(newGame(), rook), { ply: 16, drawReason: "threefold-repetition" });
});

test("a position with an en-passant capture differs from the same pieces without it", () => {
  // 1.e4 a6 2.e5 d5: white may take on d6 only now, so the pieces after ply 4 repeat at 8, 12 and 16.
  const line: Line = [
    ["E2", "E4"],
    ["A7", "A6"],
    ["E4", "E5"],
    ["D7", "D5"],
  ];
  // Three different shuffles, so no position in between occurs three times.
  const rimShuffle: Line = [
    ["G1", "H3"],
    ["G8", "H6"],
    ["H3", "G1"],
    ["H6", "G8"],
  ];
  const full = [...line, ...QUEEN_KNIGHT_SHUFFLE, ...KNIGHT_SHUFFLE, ...rimShuffle];
  assert.equal(gameEnd(newGame(), full.slice(0, 12)), null);
  assert.deepEqual(gameEnd(newGame(), full), { ply: 16, drawReason: "threefold-repetition" });
});

test("position hashes an older release kept after undo do not count", () => {
  // The previous release undid a move without dropping its hash from positionHistory.
  const played = playLine(newGame(), KNIGHT_SHUFFLE.slice(0, 3));
  const undone = handleUndo(proposeUndo(played, "w"), "b");
  const olderUndo = { ...undone, positionHistory: played.positionHistory };

  // Ply 7 repeats the position after ply 3 for the first time; the stale hash would make it the third.
  const line = [...KNIGHT_SHUFFLE.slice(2), ...KNIGHT_SHUFFLE.slice(0, 3)];
  assert.equal(gameEnd(olderUndo, line), null);
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
