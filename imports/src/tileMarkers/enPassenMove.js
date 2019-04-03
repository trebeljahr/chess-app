export function enPassenMove(board, row, col, moveHistory, color) {
  if (moveHistory.length > 0) {
    let move = moveHistory[moveHistory.length - 1];
    if (
      move.figure.color != color &&
      move.figure.type === "pawn" &&
      Math.abs(move.oldPos.row - move.newPos.row) === 2 &&
      Math.abs(col - move.newPos.col) === 1 &&
      row === move.newPos.row
    ) {
      let eProw = (move.oldPos.row + move.newPos.row) / 2;
      let ePcol = move.oldPos.col;
      board[eProw][ePcol].valid = "valid";
      board[eProw][ePcol].enpassen = "enpassen";
      return board;
    }
  }
}
