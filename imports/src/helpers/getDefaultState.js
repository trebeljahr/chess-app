import { generateBoard } from "../gameFunctions/generateBoard.js";
export function getDefaultState() {
  return {
    board: generateBoard(),
    turn: "white",
    movePart: 0,
    moveHistory: ["Start"],
    check: false,
    checkmate: false,
    remis: false,
    offerTakeback: false,
    baseLinePawn: false,
    users: [],
    archived: false,
    oldBoards: [generateBoard()],
    timestamp: Date.now(),
    messages: [{ text: "Please stay friendly in the chat!", user: "Chess-App" }]
  };
}
