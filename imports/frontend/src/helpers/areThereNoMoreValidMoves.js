export function areThereNoMoreValidMoves(board) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      let tile = board[row][col];
      if (tile.valid === "valid") {
        return false;
      }
    }
  }
  return true;
}
