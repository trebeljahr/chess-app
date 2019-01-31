import { findKing } from "./findKing.js";

export function checkForCheck(board, color) {
  let { row, col } = findKing(board, color);
  if (board[row][col].check === "check") {
    return true;
  } else {
    return false;
  }
}
