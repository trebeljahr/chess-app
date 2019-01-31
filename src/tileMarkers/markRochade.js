export function markRochade(board, row, col) {
  if (IsLongRochadePossible(board, row, col)) {
    board[row][col - 2].valid = "valid";
  }
  if (IsShortRochadePossible(board, row, col)) {
    board[row][col + 2].valid = "valid";
  }
}

function IsLongRochadePossible(board, row, col, figure) {
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
  return IsLongRochadePossible(board, row, col - 1);
}

function IsShortRochadePossible(board, row, col) {
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
  return IsShortRochadePossible(board, row, col + 1);
}
