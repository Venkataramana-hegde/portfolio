"use client";

import { useSyncExternalStore } from "react";
import { navFiles, pageFiles, type WorkspaceFile } from "@/content/workspace";

/* The editor group: which files are open, in what order, and which are pinned.

   This used to be a hardcoded list of five tabs that could not be closed,
   because the tab row doubled as the site navigation. VS Code does not work
   that way — nothing is pinned by default, closing the last editor leaves an
   empty group with a watermark, and the way back is the explorer or the command
   palette. All three of those exist here, so the tab row behaves like a real
   editor group and navigation survives.

   Same external-store shape as the theme, settings and keybinding stores: the
   order is restored from localStorage before React boots, so copying it in with
   useEffect + setState would both flash and be rejected by the React Compiler. */

export type Tab = { href: string; pinned: boolean };

const TABS_STORAGE_KEY = "ide:tabs";

/** First visit opens the five main files, so the site still reads as navigable. */
const DEFAULT_TABS: Tab[] = navFiles.map((f) => ({ href: f.href, pinned: false }));

const isRoutable = (href: string) => pageFiles.some((f) => f.href === href);

type TabsState = {
  tabs: Tab[];
  /** Most recently closed first, for reopen-closed-editor. */
  closed: string[];
};

const INITIAL: TabsState = { tabs: DEFAULT_TABS, closed: [] };

let state = INITIAL;
let readFromStorage = false;
const listeners = new Set<() => void>();

function readStorage(): TabsState {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL;
    const seen = new Set<string>();
    const tabs = parsed.flatMap((entry): Tab[] => {
      if (!entry || typeof entry !== "object") return [];
      const { href, pinned } = entry as { href?: unknown; pinned?: unknown };
      // A file removed from workspace.ts since the visitor's last session.
      if (typeof href !== "string" || !isRoutable(href) || seen.has(href)) return [];
      seen.add(href);
      return [{ href, pinned: pinned === true }];
    });
    // An empty saved group is legitimate: they closed everything on purpose.
    return { tabs, closed: [] };
  } catch {
    return INITIAL;
  }
}

function persist(tabs: Tab[]) {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    // Session-only is an acceptable fallback.
  }
}

function getSnapshot(): TabsState {
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

function commit(next: TabsState) {
  state = next;
  persist(next.tabs);
  for (const listener of listeners) listener();
}

/* ----------------------------------------------------------------- actions */

/** Pinned tabs sort ahead of unpinned ones, as they do in VS Code. */
function sortPinned(tabs: Tab[]): Tab[] {
  return [...tabs.filter((t) => t.pinned), ...tabs.filter((t) => !t.pinned)];
}

export function openTab(href: string) {
  if (!isRoutable(href)) return;
  const { tabs, closed } = getSnapshot();
  if (tabs.some((t) => t.href === href)) return;
  commit({ tabs: sortPinned([...tabs, { href, pinned: false }]), closed: closed.filter((h) => h !== href) });
}

/**
 * Closes a tab and reports where to go next, the way an editor does: the tab to
 * the right, else the one to the left, else null for an empty group.
 */
export function closeTab(href: string, active: string): string | null {
  const { tabs, closed } = getSnapshot();
  const index = tabs.findIndex((t) => t.href === href);
  if (index < 0) return active;
  // A pinned tab is not closed by the usual close affordances.
  if (tabs[index].pinned) return active;

  const next = tabs.filter((t) => t.href !== href);
  commit({ tabs: next, closed: [href, ...closed.filter((h) => h !== href)].slice(0, 10) });

  if (href !== active) return active;
  if (next.length === 0) return null;
  return (next[index] ?? next[index - 1] ?? next[0]).href;
}

export function closeOthers(href: string): string {
  const { tabs, closed } = getSnapshot();
  const removed = tabs.filter((t) => t.href !== href && !t.pinned).map((t) => t.href);
  commit({
    tabs: tabs.filter((t) => t.href === href || t.pinned),
    closed: [...removed.reverse(), ...closed].slice(0, 10),
  });
  return href;
}

export function closeToTheRight(href: string, active: string): string {
  const { tabs, closed } = getSnapshot();
  const index = tabs.findIndex((t) => t.href === href);
  if (index < 0) return active;
  const kept = tabs.filter((t, i) => i <= index || t.pinned);
  const removed = tabs.filter((t, i) => i > index && !t.pinned).map((t) => t.href);
  commit({ tabs: kept, closed: [...removed.reverse(), ...closed].slice(0, 10) });
  return kept.some((t) => t.href === active) ? active : href;
}

export function closeAll(): string | null {
  const { tabs, closed } = getSnapshot();
  const removed = tabs.filter((t) => !t.pinned).map((t) => t.href);
  const kept = tabs.filter((t) => t.pinned);
  commit({ tabs: kept, closed: [...removed.reverse(), ...closed].slice(0, 10) });
  return kept[0]?.href ?? null;
}

export function togglePin(href: string) {
  const { tabs, closed } = getSnapshot();
  commit({
    tabs: sortPinned(tabs.map((t) => (t.href === href ? { ...t, pinned: !t.pinned } : t))),
    closed,
  });
}

/** Moves a tab to an index. Pinned and unpinned tabs stay in their own blocks. */
export function moveTab(href: string, toIndex: number) {
  const { tabs, closed } = getSnapshot();
  const from = tabs.findIndex((t) => t.href === href);
  if (from < 0) return;
  const moving = tabs[from];
  const rest = tabs.filter((_, i) => i !== from);
  const clamped = Math.max(0, Math.min(rest.length, toIndex));
  rest.splice(clamped, 0, moving);
  commit({ tabs: sortPinned(rest), closed });
}

/** Nudges a tab one place left or right, for keyboard reordering. */
export function nudgeTab(href: string, direction: -1 | 1) {
  const { tabs } = getSnapshot();
  const from = tabs.findIndex((t) => t.href === href);
  if (from < 0) return;
  moveTab(href, from + direction);
}

export function reopenClosed(): string | null {
  const { tabs, closed } = getSnapshot();
  const [href, ...rest] = closed;
  if (!href || !isRoutable(href)) {
    if (closed.length) commit({ tabs, closed: rest });
    return null;
  }
  commit({ tabs: sortPinned([...tabs, { href, pinned: false }]), closed: rest });
  return href;
}

/** The tab after or before the active one, wrapping around. */
export function cycleTab(active: string, direction: -1 | 1): string | null {
  const { tabs } = getSnapshot();
  if (tabs.length === 0) return null;
  const index = tabs.findIndex((t) => t.href === active);
  if (index < 0) return tabs[0].href;
  return tabs[(index + direction + tabs.length) % tabs.length].href;
}

export function useTabs(): TabsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const fileFor = (href: string): WorkspaceFile | undefined => pageFiles.find((f) => f.href === href);
