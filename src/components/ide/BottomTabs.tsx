"use client";

import { useIde, type BottomTab } from "./ide-state";
import { PawIcon, TerminalIcon } from "./Icons";

const TABS: { id: BottomTab; label: string; Icon: typeof TerminalIcon }[] = [
  { id: "terminal", label: "Terminal", Icon: TerminalIcon },
  { id: "pets", label: "Pets", Icon: PawIcon },
];

/** The tab strip that sits in the bottom panel's header, in place of a lone "Terminal" title. */
export function BottomTabs() {
  const { bottomTab, setBottomTab } = useIde();
  return (
    <div role="tablist" aria-label="Panel" className="flex shrink-0 items-center gap-1">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={bottomTab === id}
          onClick={() => setBottomTab(id)}
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-[0.75rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-amber ${bottomTab === id ? "bg-raise text-fg" : "text-muted hover:text-fg"}`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
