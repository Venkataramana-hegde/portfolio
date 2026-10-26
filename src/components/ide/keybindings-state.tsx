"use client";

import { useSyncExternalStore } from "react";
import {
  KEYBINDINGS_STORAGE_KEY,
  coerceChords,
  defaultChords,
  isBindable,
  keybindings,
  type CommandId,
} from "@/content/keybindings";

/* A module store rather than a context: the keydown handler in ide-state needs
   to resolve a chord synchronously inside an event, not through a render, and
   only the shortcuts panel needs to re-render when a binding changes. */

type Chords = Record<CommandId, string>;

let state: Chords = defaultChords;
let readFromStorage = false;
const listeners = new Set<() => void>();

function readStorage(): Chords {
  try {
    const raw = localStorage.getItem(KEYBINDINGS_STORAGE_KEY);
    return raw ? { ...defaultChords, ...coerceChords(JSON.parse(raw)) } : defaultChords;
  } catch {
    return defaultChords;
  }
}

function persist(chords: Chords) {
  // Only the differences are stored, so changing a default later still lands.
  const overrides = Object.fromEntries(
    keybindings.filter((k) => chords[k.command] !== k.chord).map((k) => [k.command, chords[k.command]]),
  );
  try {
    localStorage.setItem(KEYBINDINGS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Session-only is an acceptable fallback.
  }
}

function getSnapshot(): Chords {
  if (!readFromStorage) {
    readFromStorage = true;
    state = readStorage();
  }
  return state;
}

const getServerSnapshot = () => defaultChords;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: Chords) {
  state = next;
  persist(next);
  for (const listener of listeners) listener();
}

/** The command a chord currently triggers, or null. Called from the keydown handler. */
export function commandForChord(chord: string): CommandId | null {
  const chords = getSnapshot();
  for (const { command } of keybindings) {
    if (chords[command] === chord) return command;
  }
  return null;
}

export type RebindResult = { ok: true } | { ok: false; reason: string };

export function setChord(command: CommandId, chord: string): RebindResult {
  if (!isBindable(chord)) {
    return { ok: false, reason: "Needs a modifier, and cannot be a browser or escape key." };
  }
  const chords = getSnapshot();
  const clash = keybindings.find((k) => k.command !== command && chords[k.command] === chord);
  if (clash) {
    // Silently stealing a binding is how a keymap becomes a mystery.
    return { ok: false, reason: `Already bound to “${clash.label}”.` };
  }
  commit({ ...chords, [command]: chord });
  return { ok: true };
}

export function resetChord(command: CommandId) {
  commit({ ...getSnapshot(), [command]: defaultChords[command] });
}

export function resetAllChords() {
  commit(defaultChords);
}

export function useKeybindings() {
  const chords = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    chords,
    setChord,
    resetChord,
    resetAllChords,
    isModified: keybindings.some((k) => chords[k.command] !== k.chord),
  };
}
