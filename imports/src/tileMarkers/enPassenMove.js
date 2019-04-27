import { updateBoard } from "../gameFunctions/updateBoard.js";
import { checkForCheck } from "../gameFunctions/checkForCheck.js";
import { invertColor } from "../helpers/invertColor.js";

export function enPassenMove(board, row, col, moveHistory, color) {
  if (moveHistory.length > 0) {
    let move = moveHistory[moveHistory.length - 1];
    let eProw = (move.oldPos.row + move.newPos.row) / 2;
    let ePcol = move.oldPos.col;
    let boardCopy = JSON.parse(JSON.stringify(board));
    let enPassen = {
      oldPos: { row: row, col: col },
      newPos: { row: eProw, col: ePcol },
      figure: boardCopy[row][col].figure
    };
    boardCopy = updateBoard(boardCopy, enPassen, true);
    if (
      move.figure.color != color &&
      move.figure.type === "pawn" &&
      Math.abs(move.oldPos.row - move.newPos.row) === 2 &&
      Math.abs(col - move.newPos.col) === 1 &&
      row === move.newPos.row &&
      !checkForCheck(boardCopy, color)
    ) {
      board[eProw][ePcol].valid = "valid";
      board[eProw][ePcol].enpassen = "enpassen";
      return board;
    }
  }
}
