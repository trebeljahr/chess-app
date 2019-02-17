import { checkForCheck } from "./checkForCheck.js";
import { invertColor } from "../helpers/invertColor.js";
import { checkForRemis } from "./checkForRemis.js";
export function checkForCheckMate(board, color) {
  if (checkForCheck(board, invertColor(color)) && checkForRemis(board, color)) {
    return true;
  } else {
    return false;
  }
}
