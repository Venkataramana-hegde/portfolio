"use client";

import { useRef, useState } from "react";
import { Terminal } from "./Terminal";

const MIN = 120;
const MAX_FRACTION = 0.7;

/** The terminal, with a drag handle on its top edge to resize it. */
export function TerminalPane() {
  const [height, setHeight] = useState(200);
  const dragging = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const next = window.innerHeight - e.clientY;
    setHeight(Math.max(MIN, Math.min(next, window.innerHeight * MAX_FRACTION)));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const step = e.key === "ArrowUp" ? 32 : -32;
      setHeight((h) => Math.max(MIN, Math.min(h + step, window.innerHeight * MAX_FRACTION)));
    }
  }

  return (
    <div className="shrink-0" style={{ height }}>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize the terminal"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        className="h-1 cursor-row-resize border-t border-line bg-line/40 transition-colors hover:bg-amber/60"
      />
      <div className="h-[calc(100%-0.25rem)]">
        <Terminal />
      </div>
    </div>
  );
}
