"use client";

import { person } from "@/content/profile";
import { langLabel, navFiles } from "@/content/workspace";
import { useIde, type PanelId } from "./ide-state";
import {
  BlocksIcon,
  BranchIcon,
  CloseIcon,
  ErrorIcon,
  FileMark,
  FilesIcon,
  MenuIcon,
  SearchIcon,
  TerminalIcon,
  WarnIcon,
} from "./Icons";
import { Clock } from "./Clock";

/* ------------------------------------------------------------- title bar */

export function TitleBar() {
  const { openDrawer, setPaletteOpen } = useIde();
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-rail px-2 sm:px-3">
      <button
        type="button"
        onClick={() => openDrawer("explorer")}
        aria-label="Open the file explorer"
        className="grid size-8 place-items-center rounded text-muted hover:bg-raise hover:text-fg md:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      <span className="hidden items-center gap-2 md:flex" aria-hidden="true">
        <span className="size-3 rounded-full bg-rose/80" />
        <span className="size-3 rounded-full bg-amber/80" />
        <span className="size-3 rounded-full bg-mint/80" />
      </span>

      <p className="min-w-0 flex-1 truncate text-center text-[0.75rem] text-muted">
        <span className="text-fg">{person.handle}</span>
        <span className="hidden sm:inline"> — {person.role}</span>
      </p>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex h-7 items-center gap-2 rounded border border-line px-2 text-[0.75rem] text-muted transition-colors hover:border-faint hover:text-fg"
      >
        <SearchIcon className="size-3.5" />
        <span className="hidden sm:inline">Go to file</span>
        <kbd className="hidden rounded bg-raise px-1 text-[0.625rem] md:inline">Ctrl K</kbd>
      </button>
    </header>
  );
}

/* ---------------------------------------------------------- activity bar */

const panels: { id: PanelId; label: string; hint: string; Icon: typeof FilesIcon }[] = [
  { id: "explorer", label: "Explorer", hint: "Files", Icon: FilesIcon },
  { id: "search", label: "Search", hint: "Search everything", Icon: SearchIcon },
  { id: "git", label: "Source control", hint: "Experience as commits", Icon: BranchIcon },
  { id: "extensions", label: "Extensions", hint: "Skills", Icon: BlocksIcon },
];

export function ActivityBar() {
  const { panel, setPanel, sideOpen, toggleSide, terminalOpen, toggleTerminal } = useIde();
  return (
    <nav aria-label="Workspace panels" className="rail flex flex-col items-center border-r border-line bg-rail py-1">
      {panels.map(({ id, label, hint, Icon }) => {
        const active = sideOpen && panel === id;
        return (
          <button
            key={id}
            type="button"
            title={`${label} — ${hint}`}
            aria-label={`${label}: ${hint}`}
            aria-pressed={active}
            onClick={() => (active ? toggleSide() : setPanel(id))}
            className={`relative grid h-12 w-full place-items-center transition-colors ${
              active ? "text-fg" : "text-faint hover:text-muted"
            }`}
          >
            <Icon className="size-[1.375rem]" />
            {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-amber" aria-hidden="true" />}
          </button>
        );
      })}

      <button
        type="button"
        onClick={toggleTerminal}
        title="Terminal (Ctrl+`)"
        aria-label="Toggle the terminal"
        aria-pressed={terminalOpen}
        className={`mt-auto grid h-12 w-full place-items-center transition-colors ${terminalOpen ? "text-fg" : "text-faint hover:text-muted"}`}
      >
        <TerminalIcon className="size-[1.375rem]" />
      </button>
    </nav>
  );
}

/* ---------------------------------------------------------------- tabs */

export function Tabs() {
  const { tabs, open, closeTab, pathname } = useIde();
  const pinnedCount = navFiles.length;

  return (
    <div role="tablist" aria-label="Open files" className="flex shrink-0 overflow-x-auto border-b border-line bg-panel [scrollbar-width:none]">
      {tabs.map((file, i) => {
        const active = file.href === pathname;
        const canClose = i >= pinnedCount;
        return (
          <div
            key={file.href}
            className={`group relative flex h-10 shrink-0 items-center border-r border-line transition-colors ${
              active ? "bg-bg text-fg" : "text-muted hover:bg-raise/50"
            }`}
          >
            {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-amber" aria-hidden="true" />}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => open(file)}
              className="flex h-full items-center gap-1 pr-2 pl-2.5 text-[0.8125rem] whitespace-nowrap"
            >
              <FileMark lang={file.lang} className="!w-5" />
              {file.name}
            </button>
            {canClose && (
              <button
                type="button"
                onClick={() => closeTab(file.href)}
                aria-label={`Close ${file.name}`}
                className={`mr-1.5 grid size-5 place-items-center rounded hover:bg-raise ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                }`}
              >
                <CloseIcon className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- status bar */

export function StatusBar() {
  const { current, toggleTerminal, setPanel, terminalOpen } = useIde();
  return (
    <footer className="flex h-7 shrink-0 items-center gap-0.5 overflow-x-auto border-t border-line bg-rail px-1 text-[0.6875rem] text-muted [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => setPanel("git")}
        title="Show my experience as commits"
        className="flex h-full shrink-0 items-center gap-1.5 rounded px-2 hover:bg-raise hover:text-fg"
      >
        <BranchIcon className="size-3.5" />
        main
      </button>
      <span className="flex h-full shrink-0 items-center gap-2 px-2">
        <span className="flex items-center gap-1">
          <ErrorIcon className="size-3.5" />0
        </span>
        <span className="flex items-center gap-1">
          <WarnIcon className="size-3.5" />0
        </span>
      </span>
      <span className="hidden shrink-0 px-2 sm:inline">{person.currentCompany}</span>

      <span className="ml-auto flex h-full shrink-0 items-center">
        <button
          type="button"
          onClick={toggleTerminal}
          aria-pressed={terminalOpen}
          className="flex h-full items-center gap-1.5 rounded px-2 hover:bg-raise hover:text-fg"
        >
          <TerminalIcon className="size-3.5" />
          Terminal
        </button>
        <span className="hidden px-2 sm:inline">{person.city} <Clock /></span>
        {current && <span className="hidden px-2 md:inline">{langLabel[current.lang]}</span>}
        <span className="hidden px-2 lg:inline">UTF-8</span>
      </span>
    </footer>
  );
}

/* ------------------------------------------------- first-visit nudge ---- */

export function Hint() {
  const { terminalOpen, setTerminalOpen } = useIde();
  if (terminalOpen) return null;
  return (
    <button
      type="button"
      onClick={() => setTerminalOpen(true)}
      className="fixed right-4 bottom-10 z-30 flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-2 text-[0.75rem] text-muted shadow-lg transition-colors hover:border-amber hover:text-fg"
    >
      <TerminalIcon className="size-4 text-amber" />
      Open the terminal
    </button>
  );
}
