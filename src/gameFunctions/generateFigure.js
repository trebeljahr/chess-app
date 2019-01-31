export function generateFigure(col, row) {
  let color = "";
  let type = "";
  switch (row) {
    case 1:
      type = "pawn";
      color = "black";
      break;
    case 0:
      color = "black";
      break;
    case 6:
      type = "pawn";
      color = "white";
      break;
    case 7:
      color = "white";
      break;
    default:
      break;
  }
  if (row === 7 || row === 0) {
    switch (col) {
      case 0:
      case 7:
        type = "rook";
        break;
      case 1:
      case 6:
        type = "knight";
        break;
      case 2:
      case 5:
        type = "bishop";
        break;
      case 3:
        type = "queen";
        break;
      case 4:
        type = "king";
        break;
      default:
        break;
    }
  }
  if (color) {
    return { color: color, type: type };
  }
  return "noFigure";
}
