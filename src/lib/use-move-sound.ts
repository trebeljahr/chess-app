import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MoveHistoryEntry } from "../shared/chess";

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

let moveAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;

function getMoveAudio(): HTMLAudioElement {
  if (!moveAudio) {
    moveAudio = new Audio("/move.mp3");
  }
  return moveAudio;
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playBeep(frequency: number, duration: number, volume = 0.15): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context not available
  }
}

function playMoveSound(): void {
  const el = getMoveAudio();
  el.currentTime = 0;
  el.play().catch(() => {});
}

function playCaptureSound(): void {
  playMoveSound();
  setTimeout(() => playBeep(220, 0.12, 0.1), 50);
}

function playCheckSound(): void {
  playBeep(880, 0.15, 0.2);
  setTimeout(() => playBeep(660, 0.15, 0.15), 100);
}

function playCastleSound(): void {
  playMoveSound();
  setTimeout(() => playMoveSound(), 120);
}

export function useMoveSound(
  moveHistory: MoveHistoryEntry[],
  isCheck: boolean
): void {
  const prevCount = useRef(moveHistory.length);
  const enabled = useSoundEnabled();

  useEffect(() => {
    if (moveHistory.length <= prevCount.current || !enabled) {
      prevCount.current = moveHistory.length;
      return;
    }
    prevCount.current = moveHistory.length;

    const lastEntry = moveHistory[moveHistory.length - 1];

    if ("kind" in lastEntry) {
      // forfeit, draw, start — no sound
      return;
    }

    if (isCheck) {
      playCheckSound();
    } else if (lastEntry.rochadeRook) {
      playCastleSound();
    } else if (lastEntry.secondFigure !== "noFigure" || lastEntry.enPassen) {
      playCaptureSound();
    } else {
      playMoveSound();
    }
  }, [moveHistory.length, enabled, isCheck, moveHistory]);
}
