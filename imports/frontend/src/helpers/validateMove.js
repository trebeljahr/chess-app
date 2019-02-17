export function validateMove(board, row, col) {
  return board[row][col].valid === "valid" ? true : false;
}
