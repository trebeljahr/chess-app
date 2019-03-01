import { generateBoard } from "../gameFunctions/generateBoard.js";
export function getDefaultState() {
  return {
    board: generateBoard(),
    turn: "white",
    movePart: 0,
    moveHistory: [],
    check: false,
    checkmate: false,
    remis: false,
    messages: [{ text: "Please stay friendly in the chat!", user: "Chess-App" }]
  };
}
