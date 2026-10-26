"use client";

import { createContext, use, useSyncExternalStore } from "react";
import {
  SETTINGS_STORAGE_KEY,
  coerceSettings,
  defaultSettings,
  settingDefs,
  type SettingKey,
  type Settings,
} from "@/content/settings";

/* Same external-store shape as the theme: the truth is in localStorage and on
   <html> before React boots, so copying it in with useEffect + setState would
   both flash and be rejected by the React Compiler. */

let state: Settings = defaultSettings;
let readFromStorage = false;
const listeners = new Set<() => void>();

function readStorage(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? coerceSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function persist(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Blocked site data still gets the setting for this session.
  }
}

function getSnapshot(): Settings {
  if (!readFromStorage) {
    readFromStorage = true;
    state = readStorage();
  }
  return state;
}

const getServerSnapshot = () => defaultSettings;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Writes settings onto <html>: numbers as custom properties, the rest as data attributes. */
export function applySettings(settings: Settings) {
  const root = document.documentElement;
  for (const def of settingDefs) {
    const value = settings[def.key];
    if (def.kind === "number") {
      root.style.setProperty(def.cssVar, `${value}${def.unit}`);
    } else if (def.kind === "boolean") {
      root.dataset[attrToDataset(def.attr)] = value ? "on" : "off";
    } else {
      root.dataset[attrToDataset(def.attr)] = String(value);
    }
  }
}

/** `line-numbers` -> `lineNumbers`, matching how the DOM exposes data-line-numbers. */
const attrToDataset = (attr: string) => attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function commit(next: Settings) {
  state = next;
  applySettings(next);
  persist(next);
  for (const listener of listeners) listener();
}

export function setSetting<K extends SettingKey>(key: K, value: Settings[K]) {
  commit(coerceSettings({ ...getSnapshot(), [key]: value }));
}

/** Replaces everything, used by the JSON editor. Invalid keys are dropped. */
export function replaceSettings(input: unknown) {
  commit(coerceSettings(input));
}

export function resetSettings() {
  commit(defaultSettings);
}

type SettingsApi = {
  settings: Settings;
  setSetting: typeof setSetting;
  replaceSettings: typeof replaceSettings;
  resetSettings: typeof resetSettings;
  /** True when any setting differs from the committed default. */
  isModified: boolean;
};

const SettingsContext = createContext<SettingsApi | null>(null);

export function useSettings() {
  const api = use(SettingsContext);
  if (!api) throw new Error("useSettings must be used inside <SettingsProvider>");
  return api;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const api: SettingsApi = {
    settings,
    setSetting,
    replaceSettings,
    resetSettings,
    isModified: settingDefs.some((d) => settings[d.key] !== d.default),
  };

  return <SettingsContext value={api}>{children}</SettingsContext>;
}
