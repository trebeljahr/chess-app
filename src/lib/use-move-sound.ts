import { useEffect, useRef } from "react";

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio("/move.mp3");
  }
  return audio;
}

export function useMoveSound(moveCount: number): void {
  const prev = useRef(moveCount);

  useEffect(() => {
    if (moveCount > prev.current) {
      const el = getAudio();
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    prev.current = moveCount;
  }, [moveCount]);
}
