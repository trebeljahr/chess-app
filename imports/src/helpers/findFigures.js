export function findFigures(board, color) {
  let figuresPositions = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let tile = board[row][col];
      if (tile.figure !== "noFigure" && tile.figure.color === color) {
        figuresPositions.push({ row: row, col: col });
      }
    }
  }
  return figuresPositions;
}
