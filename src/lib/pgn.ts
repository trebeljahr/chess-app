import {
  formatMove,
  type GameState,
  type MoveHistoryEntry
} from "../shared/chess";

export function generatePgn(
  game: GameState,
  gameName: string,
  whitePlayer?: string,
  blackPlayer?: string
): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  let result = "*";
  if (game.checkmate) {
    result = game.turn === "white" ? "0-1" : "1-0";
  } else if (game.remis) {
    result = "1/2-1/2";
  }

  const headers = [
    `[Event "${gameName}"]`,
    `[Site "Online Chess"]`,
    `[Date "${date}"]`,
    `[White "${whitePlayer ?? "?"}"]`,
    `[Black "${blackPlayer ?? "?"}"]`,
    `[Result "${result}"]`
  ];

  const moves: string[] = [];
  let moveNumber = 1;

  for (const entry of game.moveHistory) {
    if ("kind" in entry) continue;
    const notation = formatMove(entry as MoveHistoryEntry);
    if (entry.figure.color === "white") {
      moves.push(`${moveNumber}. ${notation}`);
    } else {
      moves.push(notation);
      moveNumber += 1;
    }
  }

  moves.push(result);

  return headers.join("\n") + "\n\n" + moves.join(" ") + "\n";
}

export function downloadPgn(pgn: string, filename: string): void {
  const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
