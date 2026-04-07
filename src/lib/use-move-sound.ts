import { useEffect, useRef, useSyncExternalStore } from "react";

const STORAGE_KEY = "chess:soundEnabled";

let listeners: Array<() => void> = [];

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== "false";
}

function subscribe(callback: () => void): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notify(): void {
  for (const l of listeners) l();
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

export function useToggleSound(): [boolean, () => void] {
  const enabled = useSoundEnabled();

  function toggle() {
    localStorage.setItem(STORAGE_KEY, enabled ? "false" : "true");
    notify();
  }

  return [enabled, toggle];
}

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio("/move.mp3");
  }
  return audio;
}

export function useMoveSound(moveCount: number): void {
  const prev = useRef(moveCount);
  const enabled = useSoundEnabled();

  useEffect(() => {
    if (moveCount > prev.current && enabled) {
      const el = getAudio();
      el.currentTime = 0;
      el.play().catch(() => {});
    }
    prev.current = moveCount;
  }, [moveCount, enabled]);
}
