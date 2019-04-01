import { createFieldMarkers } from "./createFieldMarkers.js";
export function createTilesUnderThreat(board, turn) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (
        board[row][col].figure !== "noFigure" &&
        board[row][col].figure.color === turn
      ) {
        createFieldMarkers(board, row, col, "check");
      }
    }
  }
  return board;
}
