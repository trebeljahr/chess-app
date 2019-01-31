import { generateFigure } from "./generateFigure.js";

export function generateBoard() {
  let board = [];
  for (let row = 0; row < 8; row++) {
    board.push([]);
    for (let col = 0; col < 8; col++) {
      board[row].push({
        field: String.fromCharCode(col + 65) + (8 - row),
        color: (row + col + 1) % 2 ? "white-tile" : "black-tile",
        check: "",
        valid: "",
        figure: generateFigure(col, row)
      });
    }
  }
  return board;
}
