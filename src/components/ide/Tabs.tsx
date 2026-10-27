"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkspaceFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { CloseIcon, FileMark } from "./Icons";

/* The editor group's tab row, with the behaviour a real one has: drag to
   reorder, middle-click to close, right-click for the group menu, and pinning.

   Pinned tabs sort first and refuse to close, which is how a visitor rebuilds
   the old "these five are always open" behaviour if they want it — the
   difference being that it is now their choice rather than hardcoded. */

function PinIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 17v5" />
      <path d="M9 10.76V5h6v5.76a2 2 0 0 0 .55 1.37L17 13.5V17H7v-3.5l1.45-1.37A2 2 0 0 0 9 10.76Z" />
    </svg>
  );
}

type MenuState = { href: string; x: number; y: number } | null;

function ContextMenu({ state, onClose }: { state: NonNullable<MenuState>; onClose: () => void }) {
  const { closeTab, closeOtherTabs, closeTabsToRight, closeAllTabs, togglePinned, reopenTab, canReopen, pinned, tabs } =
    useIde();
  const ref = useRef<HTMLDivElement>(null);
  const isPinned = pinned.has(state.href);
  const isLast = tabs.at(-1)?.href === state.href;

  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [onClose]);

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const items: { label: string; onClick: () => void; disabled?: boolean }[] = [
    { label: "Close", onClick: run(() => closeTab(state.href)), disabled: isPinned },
    { label: "Close others", onClick: run(() => closeOtherTabs(state.href)), disabled: tabs.length < 2 },
    { label: "Close to the right", onClick: run(() => closeTabsToRight(state.href)), disabled: isLast },
    { label: "Close all", onClick: run(closeAllTabs), disabled: tabs.length === 0 },
    { label: isPinned ? "Unpin" : "Pin", onClick: run(() => togglePinned(state.href)) },
    { label: "Reopen closed editor", onClick: run(reopenTab), disabled: !canReopen },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Editor tab actions"
      // Clamped so a tab near the right edge does not push the menu off screen.
      style={{ left: Math.min(state.x, window.innerWidth - 190), top: state.y }}
      className="fixed z-[60] min-w-[11rem] rounded border border-line bg-panel py-1 shadow-lg"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={item.onClick}
          className="block w-full px-3 py-1 text-left text-[0.75rem] text-muted hover:bg-raise hover:text-fg disabled:cursor-not-allowed disabled:text-faint/50 disabled:hover:bg-transparent"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs() {
  const { tabs, open, closeTab, pathname, pinned, dropTab } = useIde();
  const [menu, setMenu] = useState<MenuState>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function onDrop(index: number) {
    if (dragging) dropTab(dragging, index);
    setDragging(null);
    setDropIndex(null);
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Open editors"
        className="flex shrink-0 overflow-x-auto border-b border-line bg-panel [scrollbar-width:none]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(tabs.length)}
      >
        {tabs.map((file: WorkspaceFile, i) => {
          const active = file.href === pathname;
          const isPinned = pinned.has(file.href);

          return (
            <div
              key={file.href}
              draggable
              onDragStart={(e) => {
                setDragging(file.href);
                e.dataTransfer.effectAllowed = "move";
                // Firefox refuses to start a drag without payload.
                e.dataTransfer.setData("text/plain", file.href);
              }}
              onDragEnd={() => {
                setDragging(null);
                setDropIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragging || dragging === file.href) return;
                // Drop before or after, depending on which half is hovered.
                const box = e.currentTarget.getBoundingClientRect();
                setDropIndex(e.clientX < box.left + box.width / 2 ? i : i + 1);
              }}
              onDrop={(e) => {
                e.stopPropagation();
                onDrop(dropIndex ?? i);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ href: file.href, x: e.clientX, y: e.clientY });
              }}
              onAuxClick={(e) => {
                // Middle-click closes, as it does in every editor and browser.
                if (e.button === 1 && !isPinned) {
                  e.preventDefault();
                  closeTab(file.href);
                }
              }}
              className={`group relative flex h-10 shrink-0 items-center border-r border-line transition-colors ${
                active ? "bg-bg text-fg" : "text-muted hover:bg-raise/50"
              } ${dragging === file.href ? "opacity-40" : ""}`}
            >
              {active && <span className="absolute inset-x-0 top-0 h-0.5 bg-amber" aria-hidden="true" />}
              {dropIndex === i && (
                <span className="absolute inset-y-0 left-0 w-0.5 bg-amber" aria-hidden="true" />
              )}
              {dropIndex === i + 1 && (
                <span className="absolute inset-y-0 right-0 w-0.5 bg-amber" aria-hidden="true" />
              )}

              <button
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                onClick={() => open(file)}
                className={`flex h-full items-center gap-1 pr-2 pl-2.5 text-[0.8125rem] whitespace-nowrap ${
                  isPinned ? "italic" : ""
                }`}
              >
                <FileMark lang={file.lang} className="!w-5" />
                {file.name}
              </button>

              {isPinned ? (
                <span className="mr-1.5 grid size-5 place-items-center text-amber" title={`${file.name} is pinned`}>
                  <PinIcon />
                  <span className="sr-only">Pinned</span>
                </span>
              ) : (
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

      {menu && <ContextMenu state={menu} onClose={() => setMenu(null)} />}
    </>
  );
}
