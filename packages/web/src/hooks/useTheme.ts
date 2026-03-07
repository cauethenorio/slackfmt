import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return saved ?? getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Tiny external store so all consumers stay in sync
let listeners: Array<() => void> = [];
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}
function notify() {
  for (const cb of listeners) cb();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getEffectiveTheme, () => "dark" as Theme);

  // Listen for system theme changes (only matters when no saved preference)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(getSystemTheme());
        notify();
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    notify();
  }, []);

  return { theme, toggle } as const;
}
