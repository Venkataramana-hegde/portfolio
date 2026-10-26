"use client";

import { createContext, use, useSyncExternalStore } from "react";
import {
  INSTALLED_STORAGE_KEY,
  THEME_STORAGE_KEY,
  cssVarName,
  defaultThemeId,
  preinstalledIds,
  themeById,
  themes,
  type Theme,
} from "@/content/themes";

/* The theme lives outside React in a tiny external store, for the same reason
   the desktop media query does: the truth is in `localStorage` and on <html>
   before React boots, and `useEffect` + `setState` to copy it in is both a
   hydration mismatch and something the React Compiler rejects.
   `getServerSnapshot` returns the committed default, which is exactly what the
   prerendered HTML and `globals.css` already contain. */

type ThemeState = {
  themeId: string;
  /** Theme ids the visitor has installed. Only these can be activated. */
  installed: string[];
};

const INITIAL: ThemeState = { themeId: defaultThemeId, installed: preinstalledIds };

let state = INITIAL;
let readFromStorage = false;
const listeners = new Set<() => void>();

function parseInstalled(raw: string | null): string[] {
  if (!raw) return preinstalledIds;
  try {
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return preinstalledIds;
    const valid = list.filter((id): id is string => typeof id === "string" && themes.some((t) => t.id === id));
    // The default is never uninstallable, so there is always a theme to fall back to.
    return [...new Set([...preinstalledIds, ...valid])];
  } catch {
    return preinstalledIds;
  }
}

/** Private-mode browsers throw on access, so every read is guarded. */
function readStorage(): ThemeState {
  try {
    const installed = parseInstalled(localStorage.getItem(INSTALLED_STORAGE_KEY));
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const themeId = stored && installed.includes(stored) ? stored : defaultThemeId;
    return { themeId, installed };
  } catch {
    return INITIAL;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A visitor with site data blocked still gets the theme for this session.
  }
}

function getSnapshot(): ThemeState {
  if (!readFromStorage) {
    readFromStorage = true;
    state = readStorage();
  }
  return state;
}

const getServerSnapshot = () => INITIAL;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: ThemeState) {
  state = next;
  for (const listener of listeners) listener();
}

/** Writes a theme's tokens onto <html> as inline custom properties. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(cssVarName(key), value);
  }
  // Native form controls, scrollbars and the caret follow this, not the tokens.
  root.style.colorScheme = theme.appearance;
  root.dataset.theme = theme.id;
  root.dataset.appearance = theme.appearance;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.tokens.bg);
}

export function setTheme(id: string) {
  const snapshot = getSnapshot();
  if (!snapshot.installed.includes(id)) return;
  applyTheme(themeById(id));
  write(THEME_STORAGE_KEY, id);
  commit({ ...snapshot, themeId: id });
}

export function installTheme(id: string) {
  const snapshot = getSnapshot();
  if (!themes.some((t) => t.id === id) || snapshot.installed.includes(id)) return;
  const installed = [...snapshot.installed, id];
  write(INSTALLED_STORAGE_KEY, JSON.stringify(installed));
  commit({ ...snapshot, installed });
}

export function uninstallTheme(id: string) {
  const snapshot = getSnapshot();
  if (preinstalledIds.includes(id)) return;
  const installed = snapshot.installed.filter((t) => t !== id);
  write(INSTALLED_STORAGE_KEY, JSON.stringify(installed));
  // Uninstalling the theme you are wearing drops you back to the default.
  if (snapshot.themeId === id) {
    applyTheme(themeById(defaultThemeId));
    write(THEME_STORAGE_KEY, defaultThemeId);
    commit({ themeId: defaultThemeId, installed });
    return;
  }
  commit({ ...snapshot, installed });
}

type ThemeApi = {
  theme: Theme;
  themeId: string;
  installed: string[];
  isInstalled: (id: string) => boolean;
  setTheme: (id: string) => void;
  installTheme: (id: string) => void;
  uninstallTheme: (id: string) => void;
};

const ThemeContext = createContext<ThemeApi | null>(null);

export function useTheme() {
  const api = use(ThemeContext);
  if (!api) throw new Error("useTheme must be used inside <ThemeProvider>");
  return api;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId, installed } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const api: ThemeApi = {
    theme: themeById(themeId),
    themeId,
    installed,
    isInstalled: (id) => installed.includes(id),
    setTheme,
    installTheme,
    uninstallTheme,
  };

  return <ThemeContext value={api}>{children}</ThemeContext>;
}
