import { useEffect, useSyncExternalStore } from "react";

export interface BoardTheme {
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { name: "Classic", light: "#f2d4ac", dark: "#8b5e3c" },
  { name: "Green", light: "#eeeed2", dark: "#769656" },
  { name: "Blue", light: "#dee3e6", dark: "#8ca2ad" },
  { name: "Purple", light: "#e8dff0", dark: "#7b61a0" },
  { name: "Coral", light: "#f5e6e0", dark: "#b5736c" }
];

const STORAGE_KEY = "chess:boardTheme";
let listeners: Array<() => void> = [];

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "Classic";
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

export function useBoardTheme(): [BoardTheme, (name: string) => void] {
  const themeName = useSyncExternalStore(subscribe, getSnapshot, () => "Classic");
  const theme = BOARD_THEMES.find((t) => t.name === themeName) ?? BOARD_THEMES[0];

  useEffect(() => {
    document.documentElement.style.setProperty("--board-light", theme.light);
    document.documentElement.style.setProperty("--board-dark", theme.dark);
  }, [theme]);

  function setTheme(name: string) {
    localStorage.setItem(STORAGE_KEY, name);
    notify();
  }

  return [theme, setTheme];
}
