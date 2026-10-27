"use client";

import { useEffect, useRef, useState } from "react";
import { person } from "@/content/profile";
import { files, filePath, type WorkspaceFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { BlocksIcon, BranchIcon, BracesIcon, DatabaseIcon, ExternalIcon, FileMark, GearIcon, SearchIcon, SparkIcon, TerminalIcon } from "./Icons";

type Action = {
  id: string;
  label: string;
  hint: string;
  file?: WorkspaceFile;
  icon?: React.ReactNode;
  run: () => void;
};

/** Subsequence match, so "crdl" finds "the-cradle.tsx". Lower score ranks first. */
function score(text: string, query: string) {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return t.indexOf(q);
  let at = -1;
  for (const ch of q) {
    at = t.indexOf(ch, at + 1);
    if (at < 0) return Infinity;
  }
  return 100 + at;
}

// Mounted only while open, so each visit starts with an empty query.
export function CommandPalette() {
  const { paletteOpen } = useIde();
  if (!paletteOpen) return null;
  return <Palette />;
}

function Palette() {
  const { setPaletteOpen, open, showPanel, toggleTerminal } = useIde();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const actions: Action[] = [
    ...files.map((f) => ({
      id: f.href,
      label: filePath(f),
      hint: f.blurb,
      file: f,
      run: () => open(f),
    })),
    { id: "p-search", label: "Search everything", hint: "Find any line on the site", icon: <SearchIcon className="mx-1 size-4" />, run: () => showPanel("search") },
    { id: "p-git", label: "Show experience as commits", hint: "Source control panel", icon: <BranchIcon className="mx-1 size-4" />, run: () => showPanel("git") },
    { id: "p-ext", label: "Show skills", hint: "Extensions panel", icon: <BlocksIcon className="mx-1 size-4" />, run: () => showPanel("extensions") },
    { id: "p-api", label: "Open API playground", hint: "Try a request", icon: <BracesIcon className="mx-1 size-4" />, run: () => showPanel("api") },
    { id: "p-db", label: "Open database explorer", hint: "Inspect sample tables", icon: <DatabaseIcon className="mx-1 size-4" />, run: () => showPanel("database") },
    { id: "p-settings", label: "Open settings panel", hint: "Quick switches; settings.json has them all", icon: <GearIcon className="mx-1 size-4" />, run: () => showPanel("settings") },
    { id: "p-ai", label: "Ask the AI assistant", hint: "About my work", icon: <SparkIcon className="mx-1 size-4" />, run: () => showPanel("assistant") },
    { id: "p-term", label: "Toggle terminal", hint: "Ctrl+`", icon: <TerminalIcon className="mx-1 size-4" />, run: toggleTerminal },
    {
      id: "p-copy",
      label: copied ? "Email address copied" : "Copy email address",
      hint: person.email,
      icon: <span className="mx-1 w-4 text-center text-[0.75rem] text-muted">@</span>,
      run: () => {
        navigator.clipboard?.writeText(person.email).then(
          () => setCopied(true),
          () => undefined,
        );
      },
    },
    { id: "p-gh", label: "Open GitHub", hint: "github.com", icon: <ExternalIcon className="mx-1 size-4" />, run: () => window.open(person.github, "_blank", "noopener,noreferrer") },
    { id: "p-li", label: "Open LinkedIn", hint: "linkedin.com", icon: <ExternalIcon className="mx-1 size-4" />, run: () => window.open(person.linkedin, "_blank", "noopener,noreferrer") },
  ];

  const q = query.trim();
  const shown = q
    ? actions
        .map((a) => ({ a, s: Math.min(score(a.label, q), score(a.hint, q) + 60) }))
        .filter((x) => x.s < Infinity)
        .sort((x, y) => x.s - y.s)
        .map((x) => x.a)
    : actions;
  const index = Math.min(active, Math.max(0, shown.length - 1));

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function choose(action?: Action) {
    if (!action) return;
    action.run();
    if (action.id !== "p-copy") setPaletteOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((index + 1) % Math.max(1, shown.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((index - 1 + shown.length) % Math.max(1, shown.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(shown[index]);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-rail/70 px-4 pt-[10vh]" onMouseDown={() => setPaletteOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Go to file or run a command"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-panel shadow-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Go to file or run a command"
          aria-label="Go to file or run a command"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={shown[index] ? `palette-${shown[index].id}` : undefined}
          autoComplete="off"
          className="h-12 w-full border-b border-line bg-transparent px-4 text-[0.9375rem] text-fg placeholder:text-faint focus:outline-none"
        />
        <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[55vh] overflow-y-auto py-1.5">
          {shown.length === 0 && (
            <li className="px-4 py-3 text-[0.8125rem] text-muted">Nothing matches “{q}”. Try a file name like projects.</li>
          )}
          {shown.map((action, i) => (
            <li
              key={action.id}
              id={`palette-${action.id}`}
              role="option"
              aria-selected={i === index}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(action)}
              className={`mx-1.5 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 ${i === index ? "bg-raise" : ""}`}
            >
              {action.file ? <FileMark lang={action.file.lang} /> : action.icon}
              <span className="shrink-0 text-[0.8125rem] text-fg">{action.label}</span>
              <span className="truncate text-[0.75rem] text-muted">{action.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
