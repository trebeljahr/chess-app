import { checkForCheck } from "../gameFunctions/checkForCheck.js";
import { updateBoard } from "../gameFunctions/updateBoard.js";
import { enPassenMove } from "./enPassenMove.js";

export function determinePawnMarkers(
  board,
  row,
  col,
  color,
  mark,
  moveHistory
) {
  let pawnRowTransformation = getPawnRowTransformations(row, color);
  if (mark === "valid") {
    board = straightPawnSteps(board, row, col, pawnRowTransformation);
  }
  board = diagonalPawnCaptures(board, row, col, color, mark);
  if (moveHistory) {
    board = enPassenMove(board, row, col, moveHistory, color);
  }
  return board;
}

function getPawnRowTransformations(row, color) {
  if (color === "white") {
    return row === 6 ? [-2, -1] : [-1];
  }
  if (color === "black") {
    return row === 1 ? [2, 1] : [1];
  }
}

function diagonalPawnCaptures(board, row, col, color, mark) {
  let rowChange = color === "white" ? -1 : 1;
  [-1, 1].forEach(y => {
    if (
      0 <= col + y &&
      col + y <= 7 &&
      row + rowChange <= 7 &&
      0 <= row + rowChange
    ) {
      let tile = board[row + rowChange][col + y];
      if (tile.figure !== "noFigure" && tile.figure.color !== color) {
        if (mark === "valid") {
          let boardCopy = JSON.parse(JSON.stringify(board));
          let move = {
            oldPos: { row: row, col: col },
            newPos: { row: row + rowChange, col: col + y },
            figure: board[row][col].figure
          };
          boardCopy = updateBoard(boardCopy, move, true);
          if (checkForCheck(boardCopy, board[row][col].figure.color)) {
          } else {
            tile[mark] = mark;
          }
        } else {
          tile[mark] = mark;
        }
      }
    }
  });
  return board;
}

function straightPawnSteps(board, row, col, stepSize) {
  stepSize.forEach(x => {
    let tile = board[row + x][col];
    if (tile.figure === "noFigure") {
      let boardCopy = JSON.parse(JSON.stringify(board));
      let move = {
        oldPos: { row: row, col: col },
        newPos: { row: row + x, col: col },
        figure: board[row][col].figure
      };
      boardCopy = updateBoard(boardCopy, move, true);
      if (checkForCheck(boardCopy, board[row][col].figure.color)) {
      } else {
        tile.valid = "valid";
      }
    }
  });
  return board;
}
