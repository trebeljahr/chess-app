import { useEffect } from "react";
import type { PieceColor } from "../shared/chess";

const WHITE_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text x="16" y="26" text-anchor="middle" font-size="28" font-family="serif">♔</text></svg>')}`;

const BLACK_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text x="16" y="26" text-anchor="middle" font-size="28" font-family="serif">♚</text></svg>')}`;

export function useFavicon(turn: PieceColor | null): void {
  useEffect(() => {
    if (!turn) return;

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = turn === "white" ? WHITE_ICON : BLACK_ICON;
  }, [turn]);
}
