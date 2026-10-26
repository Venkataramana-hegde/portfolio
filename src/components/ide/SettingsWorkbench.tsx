"use client";

import { useState } from "react";
import { KeybindingsPanel } from "./KeybindingsPanel";
import { SettingsEditor } from "./SettingsEditor";

/* /settings holds the two files a real editor keeps side by side: settings.json
   and keybindings.json. They are tabs here for the same reason they are tabs
   there — they are the same job from two angles. */

const views = [
  { id: "settings", label: "settings.json" },
  { id: "keybindings", label: "keybindings.json" },
] as const;

export function SettingsWorkbench() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("settings");

  return (
    <div className="flex min-h-full flex-col">
      <div role="tablist" aria-label="Settings files" className="flex shrink-0 gap-1 border-b border-line px-5 lg:px-8">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={`relative px-3 py-2 text-[0.75rem] transition-colors ${
              view === v.id ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {v.label}
            {view === v.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-amber" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {view === "settings" ? <SettingsEditor /> : <KeybindingsPanel />}
    </div>
  );
}
