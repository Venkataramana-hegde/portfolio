"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { eventToChord } from "@/content/keybindings";
import { fileForPath, findFile, type WorkspaceFile } from "@/content/workspace";
import { commandForChord } from "./keybindings-state";
import {
  closeAll,
  closeOthers,
  closeTab as closeTabInStore,
  closeToTheRight,
  cycleTab,
  fileFor,
  moveTab,
  nudgeTab,
  openTab,
  reopenClosed,
  togglePin,
  useTabs,
} from "./tabs-state";

export type PanelId = "explorer" | "search" | "git" | "extensions" | "api" | "database" | "settings" | "assistant";

type IdeApi = {
  panel: PanelId;
  setPanel: (p: PanelId) => void;
  /** Selects a panel and makes sure it is actually on screen. */
  showPanel: (p: PanelId) => void;
  sideOpen: boolean;
  toggleSide: () => void;
  drawerOpen: boolean;
  openDrawer: (p?: PanelId) => void;
  closeDrawer: () => void;
  terminalOpen: boolean;
  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** The open editor group, in tab order. Empty is a valid state. */
  tabs: WorkspaceFile[];
  /** Which tabs the visitor has pinned, so they resist closing. */
  pinned: Set<string>;
  /** True when every editor is closed and the watermark should show. */
  groupEmpty: boolean;
  closeTab: (href: string) => void;
  closeOtherTabs: (href: string) => void;
  closeTabsToRight: (href: string) => void;
  closeAllTabs: () => void;
  togglePinned: (href: string) => void;
  /** Drops a dragged tab at an index. */
  dropTab: (href: string, index: number) => void;
  /** Reopens the most recently closed editor. */
  reopenTab: () => void;
  /** Whether there is anything to reopen, so menus can disable the item. */
  canReopen: boolean;
  /** Opens a file: routes to it, or opens a new browser tab for externals. */
  open: (file: WorkspaceFile) => void;
  pathname: string;
  current?: WorkspaceFile;
};

const IdeContext = createContext<IdeApi | null>(null);

export function useIde() {
  const api = use(IdeContext);
  if (!api) throw new Error("useIde must be used inside <IdeProvider>");
  return api;
}

const DESKTOP = "(min-width: 768px)";
const isDesktopNow = () => window.matchMedia(DESKTOP).matches;

function subscribeDesktop(onChange: () => void) {
  const media = window.matchMedia(DESKTOP);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True at desktop widths; false while rendering on the server. */
function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, isDesktopNow, () => false);
}

function useKeydown(handler: (e: KeyboardEvent) => void) {
  const ref = useRef(handler);
  // Keep the latest handler without re-binding the listener on every render.
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function IdeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = fileForPath(pathname);
  const isDesktop = useIsDesktop();

  const [panel, setPanel] = useState<PanelId>("explorer");
  const [sideOpen, setSideOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // null means "not chosen yet", so the terminal follows the viewport: open on
  // desktop where there is room, closed on phones.
  const [terminalChoice, setTerminalChoice] = useState<boolean | null>(null);
  const terminalOpen = terminalChoice ?? isDesktop;

  const { tabs: openTabs, closed } = useTabs();

  // Navigating to a file opens it, including by link, history or a typed URL.
  // Deliberately keyed on the pathname alone: closing the last editor does not
  // navigate, so the group stays empty instead of instantly reopening the file.
  useEffect(() => {
    openTab(pathname);
  }, [pathname]);

  const open = useCallback(
    (file: WorkspaceFile) => {
      if (file.external) {
        window.open(file.href, "_blank", "noopener,noreferrer");
        return;
      }
      openTab(file.href);
      router.push(file.href);
      setDrawerOpen(false);
    },
    [router],
  );

  /** Routes to wherever the store says focus lands, or stays put if nowhere. */
  const goTo = useCallback(
    (href: string | null) => {
      if (href && href !== pathname) router.push(href);
    },
    [pathname, router],
  );

  const closeTab = useCallback((href: string) => goTo(closeTabInStore(href, pathname)), [goTo, pathname]);
  const closeOtherTabs = useCallback((href: string) => goTo(closeOthers(href)), [goTo]);
  const closeTabsToRight = useCallback((href: string) => goTo(closeToTheRight(href, pathname)), [goTo, pathname]);
  const closeAllTabs = useCallback(() => goTo(closeAll()), [goTo]);
  const togglePinned = useCallback((href: string) => togglePin(href), []);
  const dropTab = useCallback((href: string, index: number) => moveTab(href, index), []);
  const reopenTab = useCallback(() => goTo(reopenClosed()), [goTo]);

  const toggleTerminal = useCallback(() => setTerminalChoice((v) => !(v ?? isDesktopNow())), []);
  const setTerminalOpen = useCallback((next: boolean) => setTerminalChoice(next), []);

  const toggleSide = useCallback(() => {
    if (isDesktopNow()) setSideOpen((v) => !v);
    else setDrawerOpen((v) => !v);
  }, []);

  const openDrawer = useCallback((p?: PanelId) => {
    if (p) setPanel(p);
    setDrawerOpen(true);
  }, []);

  const tabs = useMemo(
    () => openTabs.map((t) => fileFor(t.href)).filter((f): f is WorkspaceFile => Boolean(f)),
    [openTabs],
  );

  const pinned = useMemo(() => new Set(openTabs.filter((t) => t.pinned).map((t) => t.href)), [openTabs]);

  const showPanel = useCallback((p: PanelId) => {
    setPanel(p);
    if (isDesktopNow()) setSideOpen(true);
    else setDrawerOpen(true);
  }, []);

  // Every shortcut resolves through the rebindable table in content/keybindings,
  // so the shortcuts panel and the real behaviour cannot drift apart.
  useKeydown((e) => {
    if (e.key === "Escape") {
      setDrawerOpen(false);
      return;
    }
    const command = commandForChord(eventToChord(e));
    if (!command) return;
    e.preventDefault();
    switch (command) {
      case "palette.open":
        setPaletteOpen(true);
        break;
      case "terminal.toggle":
        toggleTerminal();
        break;
      case "sideBar.toggle":
        toggleSide();
        break;
      case "settings.open": {
        const file = findFile("settings");
        if (file) open(file);
        break;
      }
      case "panel.explorer":
        showPanel("explorer");
        break;
      case "panel.search":
        showPanel("search");
        break;
      case "panel.scm":
        showPanel("git");
        break;
      case "panel.extensions":
        showPanel("extensions");
        break;
      case "editor.close":
        closeTab(pathname);
        break;
      case "editor.reopen":
        reopenTab();
        break;
      case "editor.next":
        goTo(cycleTab(pathname, 1));
        break;
      case "editor.prev":
        goTo(cycleTab(pathname, -1));
        break;
      case "editor.moveLeft":
        nudgeTab(pathname, -1);
        break;
      case "editor.moveRight":
        nudgeTab(pathname, 1);
        break;
    }
  });

  const api: IdeApi = {
    panel,
    setPanel,
    showPanel,
    sideOpen,
    toggleSide,
    drawerOpen,
    openDrawer,
    closeDrawer: () => setDrawerOpen(false),
    terminalOpen,
    toggleTerminal,
    setTerminalOpen,
    paletteOpen,
    setPaletteOpen,
    tabs,
    pinned,
    groupEmpty: openTabs.length === 0,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    togglePinned,
    dropTab,
    reopenTab,
    canReopen: closed.length > 0,
    open,
    pathname,
    current,
  };

  return <IdeContext value={api}>{children}</IdeContext>;
}
