export const checkForMovedKing = (moveHistory, color) => {
  return moveHistory.filter(move => {
    if (move === "Start") {
      return false;
    }
    if (move.figure.color === color && move.figure.type === "king") {
      return true;
    }
  }).length > 0
    ? true
    : false;
};

export const checkForMovedLeftRook = (moveHistory, color) => {
  return moveHistory.filter(move => {
    if (move === "Start") {
      return false;
    }
    if (
      move.figure.color === color &&
      move.figure.type === "rook" &&
      move.oldPos === 7
    ) {
      return true;
    }
  }).length > 0
    ? true
    : false;
};

export const checkForMovedRightRook = (moveHistory, color) => {
  return moveHistory.filter(move => {
    if (move === "Start") {
      return false;
    }
    if (
      move.figure.color === color &&
      move.figure.type === "rook" &&
      move.oldPos === 0
    ) {
      return true;
    }
  }).length > 0
    ? true
    : false;
};
