import { markTiles } from "./markTiles.js";
import { determinePawnMarkers } from "./pawnMovement.js";
import { getMoveInstructions } from "../helpers/getMoveInstructions.js";
import { removeMarkers } from "../gameFunctions/updateBoard.js";
import { markRochade } from "./markRochade.js";
export function createFieldMarkers(
  board,
  row,
  col,
  mark,
  virtual,
  moveHistory
) {
  let figure = board[row][col].figure;
  if (mark === "valid" && !virtual) {
    removeMarkers(board, ["valid", "selected", "rochade"]);
    board[row][col].selected = "selected";
  }
  switch (figure.type) {
    case "pawn":
      determinePawnMarkers(board, row, col, figure.color, mark, moveHistory);
      break;
    case "king":
      if (mark === "valid" && moveHistory) {
        markRochade(board, row, col, moveHistory, figure.color);
      }
      break;
    default:
      break;
  }
  if (figure.type !== "pawn") {
    let { allowedDirections, maxDistance } = getMoveInstructions(figure.type);
    for (let key in allowedDirections) {
      let direction = allowedDirections[key];
      board = markTiles(
        board,
        row,
        direction[0],
        col,
        direction[1],
        figure,
        maxDistance,
        0,
        mark,
        row,
        col,
        figure
      );
    }
  }
  return board;
}
