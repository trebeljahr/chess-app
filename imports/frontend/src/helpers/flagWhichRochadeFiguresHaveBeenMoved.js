export function flagWhichRochadeFiguresHaveBeenMoved(
  moveHistory,
  player,
  color
) {
  moveHistory.forEach(move => {
    if (move.figure.color === color) {
      if (move.figure.type === "king") {
        player.hasMovedKing = true;
      }
      if (move.figure.type === "rook") {
        if (move.oldPos === 0) {
          player.hasMovedleftRook = true;
        }
        if (move.oldPos === 7) {
          player.hasMovedRightRook = true;
        }
      }
    }
  });
  console.log(player, color);
  return player;
}
