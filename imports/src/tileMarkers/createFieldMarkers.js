import { markTiles } from "./markTiles.js";
import { determinePawnMarkers } from "./pawnMovement.js";
import { getMoveInstructions } from "../helpers/getMoveInstructions.js";
import { removeMarkers } from "../gameFunctions/updateBoard.js";
//import { markRochade } from "./markRochade.js";
export function createFieldMarkers(board, row, col, mark, virtual) {
  let figure = board[row][col].figure;
  if (mark === "valid" && !virtual) {
    removeMarkers(board, ["valid", "selected"]);
    board[row][col].selected = "selected";
  }
  switch (figure.type) {
    case "pawn":
      determinePawnMarkers(board, row, col, figure.color, mark);
      break;
    case "king":
      /*if (mark === "valid") {
        markRochade(board, row, col);
      }*/
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
