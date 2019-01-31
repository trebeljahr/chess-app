import { updateBoard } from "../gameFunctions/updateBoard.js";
import { checkForCheck } from "../gameFunctions/checkForCheck.js";
export function markTiles(
  board,
  row,
  rowMovement,
  col,
  colMovement,
  figure,
  iterationMax,
  iterationCount,
  mark,
  oldRow,
  oldCol,
  oldFigure
) {
  let newRow = row + rowMovement;
  let newCol = col + colMovement;
  if (
    newCol > 7 ||
    newRow > 7 ||
    newCol < 0 ||
    newRow < 0 ||
    iterationCount >= iterationMax
  ) {
    return board;
  }
  iterationCount++;
  if (board[newRow][newCol].figure !== "noFigure") {
    if (board[newRow][newCol].figure.color !== figure.color) {
      if (mark === "valid") {
        let move = {
          oldPos: { row: oldRow, col: oldCol },
          newPos: { row: newRow, col: newCol },
          figure: oldFigure
        };
        let boardCopy = JSON.parse(JSON.stringify(board));
        boardCopy = updateBoard(boardCopy, move, true);
        if (checkForCheck(boardCopy, oldFigure.color)) {
        } else {
          board[newRow][newCol][mark] = mark;
        }
      } else {
        board[newRow][newCol][mark] = mark;
      }
    }
    return board;
  }
  if (mark === "valid") {
    let move = {
      oldPos: { row: oldRow, col: oldCol },
      newPos: { row: newRow, col: newCol },
      figure: oldFigure
    };
    let boardCopy = JSON.parse(JSON.stringify(board));
    boardCopy = updateBoard(boardCopy, move, true);
    if (checkForCheck(boardCopy, oldFigure.color)) {
    } else {
      board[newRow][newCol][mark] = mark;
    }
  } else {
    board[newRow][newCol][mark] = mark;
  }
  return markTiles(
    board,
    newRow,
    rowMovement,
    newCol,
    colMovement,
    figure,
    iterationMax,
    iterationCount,
    mark,
    oldRow,
    oldCol,
    oldFigure
  );
}
