"use client";

import { useEffect, useRef } from "react";
import { ActivityBar, Hint, StatusBar, Tabs, TitleBar } from "./Chrome";
import { CommandPalette } from "./CommandPalette";
import { Explorer } from "./Explorer";
import { Extensions } from "./Extensions";
import { IdeProvider, useIde } from "./ide-state";
import { CloseIcon } from "./Icons";
import { SearchPanel } from "./SearchPanel";
import { SourceControl } from "./SourceControl";
import { TerminalPane } from "./TerminalPane";

const panelTitles = {
  explorer: "Explorer",
  search: "Search",
  git: "Source control",
  extensions: "Extensions",
} as const;

function SidePanel() {
  const { panel, sideOpen, closeDrawer } = useIde();
  if (!sideOpen) return null;
  return (
    <aside className="side flex flex-col border-r border-line bg-panel" aria-label={panelTitles[panel]}>
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
        <h2 className="text-[0.6875rem] font-semibold tracking-wide text-muted">{panelTitles[panel].toUpperCase()}</h2>
        <button
          type="button"
          onClick={closeDrawer}
          aria-label="Close panel"
          className="grid size-6 place-items-center rounded text-muted hover:bg-raise hover:text-fg md:hidden"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panel === "explorer" && <Explorer />}
        {panel === "search" && <SearchPanel />}
        {panel === "git" && <SourceControl />}
        {panel === "extensions" && <Extensions />}
      </div>
    </aside>
  );
}

function Workbench({ children }: { children: React.ReactNode }) {
  const { drawerOpen, closeDrawer, terminalOpen, pathname } = useIde();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Opening a file scrolls it to the top, unless the link targets a heading.
  useEffect(() => {
    if (!window.location.hash) scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="ide" data-drawer={drawerOpen ? "open" : "closed"}>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded focus:bg-amber focus:px-3 focus:py-2 focus:text-amber-ink"
      >
        Skip to content
      </a>

      <TitleBar />

      <div className="ide-body">
        <ActivityBar />
        <SidePanel />
        {drawerOpen && <div className="scrim md:hidden" onClick={closeDrawer} aria-hidden="true" />}

        <div className="editor">
          <Tabs />
          <div id="content" ref={scrollRef} className="editor-scroll" tabIndex={-1}>
            {children}
          </div>
          {terminalOpen && <TerminalPane />}
        </div>
      </div>

      <StatusBar />
      <Hint />
      <CommandPalette />
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <IdeProvider>
      <Workbench>{children}</Workbench>
    </IdeProvider>
  );
}
