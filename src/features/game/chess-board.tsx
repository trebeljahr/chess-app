import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PieceArt } from "../../components/piece-art";
import {
  convertPos,
  cloneBoard,
  handleFirstClick,
  handleSecondClick,
  cloneState,
  isPiece,
  positionToField,
  type Board,
  type GameState,
  type MoveHistoryEntry,
  type Piece,
  type ViewerColor
} from "../../shared/chess";
import { cn } from "../../lib/utils";

interface ChessBoardProps {
  gameState: GameState;
  viewerColor: ViewerColor;
  userId: string;
  archived: boolean;
  lastMove: MoveHistoryEntry | null;
  onMove: (field: string) => void;
}

interface LocalSelection {
  field: string;
  validFields: Set<string>;
  rochadeFields: Set<string>;
  enpassenFields: Set<string>;
}

function computeSelection(
  state: GameState,
  userId: string,
  field: string
): LocalSelection | null {
  const tempState = cloneState(state);
  tempState.movePart = 0;
  const result = handleFirstClick(tempState, userId, field);

  if (result === tempState) return null;

  const validFields = new Set<string>();
  const rochadeFields = new Set<string>();
  const enpassenFields = new Set<string>();

  for (const row of result.board) {
    for (const tile of row) {
      if (tile.valid === "valid") validFields.add(tile.field);
      if (tile.rochade === "rochade") rochadeFields.add(tile.field);
      if (tile.enpassen === "enpassen") enpassenFields.add(tile.field);
    }
  }

  return { field, validFields, rochadeFields, enpassenFields };
}

export function ChessBoard({
  gameState,
  viewerColor,
  userId,
  archived,
  lastMove,
  onMove
}: ChessBoardProps) {
  const board = gameState.board;
  const turn = gameState.turn;
  const isMyTurn = turn === viewerColor && !archived;

  const orientedBoard = useMemo(
    () =>
      viewerColor === "black"
        ? [...board].reverse().map((row) => [...row].reverse())
        : board,
    [board, viewerColor]
  );

  const lastMoveFields = useMemo(
    () =>
      lastMove && !("kind" in lastMove)
        ? new Set([
            positionToField(lastMove.oldPos),
            positionToField(lastMove.newPos)
          ])
        : new Set<string>(),
    [lastMove]
  );

  const [selection, setSelection] = useState<LocalSelection | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragImageRef = useRef<HTMLElement | null>(null);

  // Clear selection when turn changes or board updates
  useEffect(() => {
    setSelection(null);
  }, [turn, gameState.timestamp]);

  const handleTileClick = useCallback(
    (field: string) => {
      if (archived) return;

      // If a piece is selected and clicked field is a valid move target
      if (selection) {
        if (selection.validFields.has(field)) {
          // First send the selection click, then the move click
          onMove(selection.field);
          // Small delay to let server process first click
          setTimeout(() => onMove(field), 50);
          setSelection(null);
          return;
        }

        // Clicking the same piece deselects
        if (selection.field === field) {
          setSelection(null);
          return;
        }
      }

      // Try to select a piece
      if (isMyTurn) {
        const pos = convertPos(field);
        const tile = board[pos.row][pos.col];
        if (isPiece(tile.figure) && tile.figure.color === viewerColor) {
          const sel = computeSelection(gameState, userId, field);
          setSelection(sel);
          return;
        }
      }

      setSelection(null);
    },
    [archived, board, gameState, isMyTurn, onMove, selection, userId, viewerColor]
  );

  const handleDragStart = useCallback(
    (field: string, piece: Piece, e: React.DragEvent) => {
      if (!isMyTurn || piece.color !== viewerColor) {
        e.preventDefault();
        return;
      }

      // Create custom drag image from the piece
      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const img = el.cloneNode(true) as HTMLElement;
      img.style.width = `${rect.width}px`;
      img.style.height = `${rect.height}px`;
      img.style.position = "fixed";
      img.style.top = "-9999px";
      img.style.pointerEvents = "none";
      document.body.appendChild(img);
      dragImageRef.current = img;
      e.dataTransfer.setDragImage(img, rect.width / 2, rect.height / 2);
      e.dataTransfer.effectAllowed = "move";

      setDragging(field);
      const sel = computeSelection(gameState, userId, field);
      setSelection(sel);
    },
    [isMyTurn, viewerColor, gameState, userId]
  );

  const handleDrop = useCallback(
    (field: string, e: React.DragEvent) => {
      e.preventDefault();
      if (selection && selection.validFields.has(field)) {
        onMove(selection.field);
        setTimeout(() => onMove(field), 50);
      }
      setSelection(null);
      setDragging(null);
    },
    [selection, onMove]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-stone-200 bg-white/60 p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)]">
      <div className="grid grid-cols-8 overflow-hidden rounded-[22px] border border-stone-300">
        {orientedBoard.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const isLastMove = lastMoveFields.has(tile.field);
            const showFile = rowIndex === orientedBoard.length - 1;
            const showRank = colIndex === 7;
            const piece = isPiece(tile.figure) ? tile.figure : null;
            const isSelected = selection?.field === tile.field;
            const isValid = selection?.validFields.has(tile.field) ?? false;
            const isRochade = selection?.rochadeFields.has(tile.field) ?? false;
            const isEnpassen = selection?.enpassenFields.has(tile.field) ?? false;
            const isDraggingThis = dragging === tile.field;
            const isKingInCheck =
              tile.check === "check" &&
              piece?.type === "king" &&
              piece?.color === turn;
            const canDrag =
              !archived && isMyTurn && piece !== null && piece.color === viewerColor;

            return (
              <button
                key={tile.field}
                className={cn(
                  "relative aspect-square border-none p-0 text-left transition hover:brightness-105",
                  tile.color === "white-tile"
                    ? "bg-[var(--board-light)]"
                    : "bg-[var(--board-dark)]",
                  isKingInCheck && "bg-rose-400/85",
                  isSelected && "ring-4 ring-inset ring-teal-500/70",
                  isDraggingThis && "opacity-40"
                )}
                disabled={archived}
                onClick={() => handleTileClick(tile.field)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(tile.field, e)}
                type="button"
              >
                {isLastMove ? (
                  <span className="absolute inset-1 rounded-[18px] border-2 border-slate-950/45" />
                ) : null}
                {piece ? (
                  <span
                    className={cn(
                      "absolute inset-1.5",
                      canDrag && "cursor-grab active:cursor-grabbing"
                    )}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(tile.field, piece, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <PieceArt
                      piece={piece}
                      title={`${piece.color} ${piece.type}`}
                    />
                  </span>
                ) : null}
                {isValid ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      piece
                        ? "size-[85%] border-[5px] bg-transparent"
                        : "size-4",
                      isRochade
                        ? "border-sky-600/70 bg-sky-600/70"
                        : isEnpassen
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
