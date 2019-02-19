export function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (
        board[row][col].figure.type === "king" &&
        board[row][col].figure.color === color
      ) {
        return { row: row, col: col };
      }
    }
  }
}
