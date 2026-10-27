"use client";

import { formatChord, keybindings, type CommandId } from "@/content/keybindings";
import { useIde } from "./ide-state";
import { useKeybindings } from "./keybindings-state";

/* The watermark VS Code shows when every editor is closed. The chords come from
   the live keybinding store, so if the visitor rebound something this list says
   what they actually bound, not what shipped. */

const shown: CommandId[] = ["palette.open", "panel.explorer", "terminal.toggle", "editor.reopen", "settings.open"];

export function EmptyGroup() {
  const { chords } = useKeybindings();
  const { reopenTab, canReopen } = useIde();

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <p className="mb-4 text-[0.75rem] text-faint">No editors open</p>

        <dl className="flex flex-col gap-1.5">
          {shown.map((command) => {
            const binding = keybindings.find((k) => k.command === command);
            if (!binding) return null;
            return (
              <div key={command} className="flex items-baseline justify-between gap-4">
                <dt className="text-[0.8125rem] text-muted">{binding.label}</dt>
                <dd>
                  <kbd className="rounded border border-line px-1.5 py-0.5 text-[0.6875rem] text-faint">
                    {formatChord(chords[command])}
                  </kbd>
                </dd>
              </div>
            );
          })}
        </dl>

        {canReopen && (
          <button type="button" onClick={reopenTab} className="btn mt-5">
            Reopen closed editor
          </button>
        )}

        <p className="mt-5 text-[0.6875rem] leading-snug text-faint">
          Nothing is lost — every file is still in the explorer, and pinning a tab stops it closing.
        </p>
      </div>
    </div>
  );
}
