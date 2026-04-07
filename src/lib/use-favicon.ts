import { useEffect } from "react";
import type { PieceColor } from "../shared/chess";

const WHITE_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="16" height="16" fill="#f2d4ac"/><rect x="16" width="16" height="16" fill="#8b5e3c"/><rect y="16" width="16" height="16" fill="#8b5e3c"/><rect x="16" y="16" width="16" height="16" fill="#f2d4ac"/><text x="16" y="23" text-anchor="middle" font-size="20" fill="#fff" font-family="serif">♔</text></svg>')}`;

const BLACK_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="16" height="16" fill="#f2d4ac"/><rect x="16" width="16" height="16" fill="#8b5e3c"/><rect y="16" width="16" height="16" fill="#8b5e3c"/><rect x="16" y="16" width="16" height="16" fill="#f2d4ac"/><text x="16" y="23" text-anchor="middle" font-size="20" fill="#1e293b" font-family="serif">♚</text></svg>')}`;

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
