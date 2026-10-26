"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { fileForPath, files, navFiles, type WorkspaceFile } from "@/content/workspace";

export type PanelId = "explorer" | "search" | "git" | "extensions";

type IdeApi = {
  panel: PanelId;
  setPanel: (p: PanelId) => void;
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
  /** Files with an open tab: the four pinned ones, then anything else opened. */
  tabs: WorkspaceFile[];
  closeTab: (href: string) => void;
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

// The four main files are always open, so the tab row doubles as the site nav.
const PINNED = navFiles.map((f) => f.href);

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

  // Files opened beyond the pinned four. Seeded from the first URL, so landing
  // straight on a project shows its tab.
  const [extra, setExtra] = useState<string[]>(() =>
    current && !PINNED.includes(current.href) ? [current.href] : [],
  );

  const open = useCallback(
    (file: WorkspaceFile) => {
      if (file.external) {
        window.open(file.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (!PINNED.includes(file.href)) {
        setExtra((list) => (list.includes(file.href) ? list : [...list, file.href]));
      }
      router.push(file.href);
      setDrawerOpen(false);
    },
    [router],
  );

  const closeTab = useCallback(
    (href: string) => {
      if (PINNED.includes(href)) return;
      setExtra((list) => list.filter((h) => h !== href));
      if (href === pathname) router.push("/projects");
    },
    [pathname, router],
  );

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

  const tabs = useMemo(() => {
    const list = [...navFiles, ...extra.map((h) => files.find((f) => f.href === h)).filter((f): f is WorkspaceFile => Boolean(f))];
    // Arriving by browser history on a closed file still shows its tab.
    if (current && !list.some((f) => f.href === current.href)) list.push(current);
    return list;
  }, [extra, current]);

  useKeydown((e) => {
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (mod && key === "k") {
      e.preventDefault();
      setPaletteOpen(true);
    } else if (mod && e.key === "`") {
      e.preventDefault();
      toggleTerminal();
    } else if (mod && e.shiftKey && key === "e") {
      e.preventDefault();
      setPanel("explorer");
      if (!isDesktopNow()) setDrawerOpen(true);
    } else if (mod && key === "b") {
      e.preventDefault();
      toggleSide();
    } else if (e.key === "Escape") {
      setDrawerOpen(false);
    }
  });

  const api: IdeApi = {
    panel,
    setPanel,
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
    closeTab,
    open,
    pathname,
    current,
  };

  return <IdeContext value={api}>{children}</IdeContext>;
}
