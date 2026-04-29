import { cn } from "../lib/utils";
import type { Piece } from "../shared/chess";

interface PieceArtProps {
  piece: Piece;
  className?: string;
  title?: string;
}

export function PieceArt({ piece, className, title }: PieceArtProps) {
  const suffix = piece.color === "white" ? "w" : "b";
  return (
    // biome-ignore lint/performance/noImgElement: not on Next.js, or Image migration deferred
    <img
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={cn("size-full", className)}
      draggable={false}
      src={`/pieces-basic-svg/${piece.type}-${suffix}.svg`}
    />
  );
}
