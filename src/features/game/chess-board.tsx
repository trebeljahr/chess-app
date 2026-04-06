import { useCallback, useRef, useState } from "react";
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

  const [dragging, setDragging] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (field: string, e: React.DragEvent) => {
      if (archived) return;
      setDragging(field);
      onTileClick(field);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", field);
    },
    [archived, onTileClick]
  );

  const handleDrop = useCallback(
    (field: string, e: React.DragEvent) => {
      e.preventDefault();
      if (dragging && dragging !== field) {
        onTileClick(field);
      }
      setDragging(null);
    },
    [dragging, onTileClick]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white/60 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
      <div
        ref={boardRef}
        className="grid grid-cols-8 overflow-hidden rounded-[22px] border border-stone-300"
      >
        {orientedBoard.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isLastMove = lastMoveFields.has(tile.field);
            const showFile = rowIndex === orientedBoard.length - 1;
            const showRank = colIndex === 7;
            const isActionable = !archived;
            const piece = isPiece(tile.figure) ? tile.figure : null;
            const isSelected =
              tile.selected === "selected" && turn === viewerColor;
            const isDraggingThis = dragging === tile.field;

            return (
              <button
                key={tile.field}
                className={cn(
                  "relative aspect-square border-none p-0 text-left transition hover:brightness-105",
                  tile.color === "white-tile"
                    ? "bg-[var(--board-light)]"
                    : "bg-[var(--board-dark)]",
                  tile.check === "check" && "bg-rose-400/85",
                  isSelected && "ring-4 ring-inset ring-teal-500/70",
                  isDraggingThis && "opacity-40"
                )}
                disabled={!isActionable}
                onClick={() => onTileClick(tile.field)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(tile.field, e)}
                type="button"
              >
                {isLastMove ? (
                  <span className="absolute inset-1 rounded-[18px] border-2 border-slate-950/45" />
                ) : null}
                {piece ? (
                  <span
                    className="absolute inset-1.5 cursor-grab active:cursor-grabbing"
                    draggable={isActionable}
                    onDragStart={(e) => handleDragStart(tile.field, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <PieceArt
                      piece={piece}
                      title={`${piece.color} ${piece.type}`}
                    />
                  </span>
                ) : null}
                {tile.valid === "valid" && turn === viewerColor ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      piece ? "size-[85%] border-[5px] bg-transparent" : "size-4",
                      tile.rochade === "rochade"
                        ? "border-sky-600/70 bg-sky-600/70"
                        : tile.enpassen === "enpassen"
                          ? "border-fuchsia-600/70 bg-fuchsia-600/70"
                          : "border-emerald-600/70 bg-emerald-600/70"
                    )}
                  />
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
