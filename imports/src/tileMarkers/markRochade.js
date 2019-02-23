import {
  checkForMovedKing,
  checkForMovedLeftRook,
  checkForMovedRightRook
} from "../helpers/movedRochadeFigures.js";

export function markRochade(board, row, col, moveHistory, color) {
  if (isLongRochadePossible(board, row, col, moveHistory, color)) {
    console.log("RochadeIsPossible!");
    board[row][col - 2].valid = "valid";
  }
  if (isShortRochadePossible(board, row, col, moveHistory, color)) {
    console.log("RochadeIsPossible!");
    board[row][col + 2].valid = "valid";
  }
}

function isLongRochadePossible(board, row, col, moveHistory, color) {
  if (
    longRochadeUnblocked(board, row, col) &&
    moveHistory.forEach(move => checkForMovedKing(move, color)) &&
    moveHistory.forEach(move => checkForMovedLeftRook(move, color))
  ) {
    return true;
  }
}

function isShortRochadePossible(board, row, col, moveHistory, color) {
  if (
    shortRochadeUnblocked(board, row, col) &&
    moveHistory.forEach(move => checkForMovedKing(move, color)) &&
    moveHistory.forEach(move => checkForMovedRightRook(move, color))
  ) {
    return true;
  }
}

function longRochadeUnblocked(board, row, col) {
  let tile = board[row][col];
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
