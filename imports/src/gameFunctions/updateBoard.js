import { createTilesUnderThreat } from "../tileMarkers/createTilesUnderThreat";

export function updateBoard(board, move, virtual, undo) {
  removeMarkers(board, ["valid", "selected", "check", "rochade", "enpassen"]);
  if (!undo) {
    removePiece(board, move.oldPos);
    if (move.enPassen) {
      removePiece(board, move.enPassen.pos);
    }
  } else {
    if (move.enPassen) {
      generatePiece(board, move.enPassen.pos, move.enPassen.figure, false);
    }
    generatePiece(board, move.oldPos, move.secondFigure, virtual);
  }
  if (move.rochadeRook) {
    updateBoard(board, move.rochadeRook, true);
  }

  generatePiece(board, move.newPos, move.figure, virtual);
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
  return board;
}

function removePiece(board, pos) {
  let { row, col } = pos;
  board[row][col].figure = "noFigure";
  return board;
}

function generatePiece(board, pos, figure, virtual) {
  let { row, col } = pos;
  board[row][col].figure = figure;
  board = removeMarkers(board, ["check"]);

  board = virtual
    ? createTilesUnderThreat(
        board,
        figure.color === "white" ? "black" : "white"
      )
    : createTilesUnderThreat(board, figure.color);
  return board;
}
