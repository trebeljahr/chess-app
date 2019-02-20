import { createTilesUnderThreat } from "../tileMarkers/createTilesUnderThreat";

export function updateBoard(board, move, virtual, undo) {
  removeMarkers(board, ["valid", "selected", "check"]);
  removePiece(board, move.oldPos);
  generatePiece(board, move.newPos, move.figure, virtual);
  if (move.secondFigure && move.secondFigure !== "noFigure" && undo) {
    return generatePiece(board, move.oldPos, move.secondFigure, false);
  }
  return board;
}

export function removeMarkers(board, marks) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      marks.forEach(mark => {
        board[row][col][mark] = "";
      });
    }
  }
}

function removePiece(board, pos) {
  let { row, col } = pos;
  board[row][col].figure = "noFigure";
  return board;
}

function generatePiece(board, pos, figure, virtual) {
  let { row, col } = pos;
  board[row][col].figure = figure;
  virtual
    ? createTilesUnderThreat(
        board,
        figure.color === "white" ? "black" : "white"
      )
    : createTilesUnderThreat(board, figure.color);
  return board;
}
