import { PieceArt } from "../../components/piece-art";
import {
  isPiece,
  positionToField,
  type Board,
  type MoveHistoryEntry,
  type ViewerColor
} from "../../shared/chess";
import { cn } from "../../lib/utils";

interface ChessBoardProps {
  board: Board;
  viewerColor: ViewerColor;
  archived: boolean;
  turn: "white" | "black";
  lastMove: MoveHistoryEntry | null;
  onTileClick: (field: string) => void;
}

export function ChessBoard({
  board,
  viewerColor,
  archived,
  turn,
  lastMove,
  onTileClick
}: ChessBoardProps) {
  const orientedBoard =
    viewerColor === "black"
      ? [...board].reverse().map((row) => [...row].reverse())
      : board;

  const lastMoveFields =
    lastMove && !("kind" in lastMove)
      ? new Set([
          positionToField(lastMove.oldPos),
          positionToField(lastMove.newPos)
        ])
      : new Set<string>();

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white/60 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
      <div className="grid grid-cols-8 overflow-hidden rounded-[22px] border border-stone-300">
        {orientedBoard.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isLastMove = lastMoveFields.has(tile.field);
            const showFile = rowIndex === orientedBoard.length - 1;
            const showRank = colIndex === 7;
            const isActionable = !archived;
            const piece = isPiece(tile.figure) ? tile.figure : null;

            return (
              <button
                key={tile.field}
                className={cn(
                  "relative aspect-square border-none p-0 text-left transition hover:brightness-105",
                  tile.color === "white-tile"
                    ? "bg-[var(--board-light)]"
                    : "bg-[var(--board-dark)]",
                  tile.check === "check" && "bg-rose-400/85",
                  tile.selected === "selected" &&
                    turn === viewerColor &&
                    "ring-4 ring-inset ring-teal-500/70"
                )}
                disabled={!isActionable}
                onClick={() => onTileClick(tile.field)}
                type="button"
              >
                {isLastMove ? (
                  <span className="absolute inset-1 rounded-[18px] border-2 border-slate-950/45" />
                ) : null}
                {tile.valid === "valid" ? (
                  <span
                    className={cn(
                      "absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      tile.rochade === "rochade"
                        ? "bg-sky-600/70"
                        : tile.enpassen === "enpassen"
                          ? "bg-fuchsia-600/70"
                          : "bg-emerald-600/70"
                    )}
                  />
                ) : null}
                {piece ? (
                  <span className="absolute inset-1.5">
                    <PieceArt piece={piece} title={`${piece.color} ${piece.type}`} />
                  </span>
                ) : null}
                {showFile ? (
                  <span className="absolute bottom-0.5 left-1 z-10 text-[9px] font-bold uppercase text-slate-900/80">
                    {tile.field[0]}
                  </span>
                ) : null}
                {showRank ? (
                  <span className="absolute right-1 top-0.5 z-10 text-[9px] font-bold text-slate-900/80">
                    {tile.field[1]}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
