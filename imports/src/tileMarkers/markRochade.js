import {
  checkForMovedKing,
  checkForMovedLeftRook,
  checkForMovedRightRook
} from "../helpers/movedRochadeFigures.js";

export function markRochade(board, row, col, moveHistory, color) {
  if (isLongRochadePossible(board, row, col, moveHistory, color)) {
    board[row][col - 2].valid = "valid";
    board[row][col - 2].rochade = "rochade";
  }
  if (isShortRochadePossible(board, row, col, moveHistory, color)) {
    board[row][col + 2].valid = "valid";
    board[row][col + 2].rochade = "rochade";
  }
}

function isLongRochadePossible(board, row, col, moveHistory, color) {
  return (
    !checkForMovedKing(moveHistory, color) &&
    !checkForMovedLeftRook(moveHistory, color) &&
    longRochadeUnblocked(board, row, col)
  );
}

function isShortRochadePossible(board, row, col, moveHistory, color) {
  return (
    !checkForMovedKing(moveHistory, color) &&
    !checkForMovedRightRook(moveHistory, color) &&
    shortRochadeUnblocked(board, row, col)
  );
}

function longRochadeUnblocked(board, row, col) {
  if (col <= -1) {
    return;
  }
  let tile = board[row][col];
  console.log(tile.figure);
  if (col === 0 && tile.figure.type === "rook") {
    return true;
  }
  if (
    (tile.check === "check" && col >= 2) ||
    (tile.figure !== "noFigure" && col !== 4)
  ) {
    return false;
  }
  return longRochadeUnblocked(board, row, col - 1);
}

function shortRochadeUnblocked(board, row, col) {
  if (col >= 8) {
    return;
  }
  let tile = board[row][col];
  if (col === 7 && tile.figure.type === "rook") {
    return true;
  }
  if (
    (tile.check === "check" && col <= 6) ||
    (tile.figure !== "noFigure" && col !== 4)
  ) {
    return false;
  }
  return shortRochadeUnblocked(board, row, col + 1);
}
