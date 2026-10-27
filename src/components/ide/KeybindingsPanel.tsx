"use client";

import { useEffect, useState } from "react";
import {
  eventToChord,
  formatChord,
  keybindingGroups,
  keybindings,
  type CommandId,
} from "@/content/keybindings";
import { useKeybindings } from "./keybindings-state";

/* The shortcuts list, generated from the same table the keydown handler reads.
   Recording a new chord really rebinds it, and a clash is refused out loud
   rather than silently stealing the other command's keys. */

export function KeybindingsPanel() {
  const { chords, setChord, resetChord, resetAllChords, isModified } = useKeybindings();
  const [recording, setRecording] = useState<CommandId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // While recording, the window listener swallows the keystroke so the chord
  // being captured does not also fire the command it is bound to.
  useEffect(() => {
    if (!recording) return;
    // Captured locally so the narrowing survives into the listener closure.
    const command = recording;

    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecording(null);
        setMessage("Cancelled.");
        return;
      }
      // Ignore the modifier-only keystrokes on the way to a real chord.
      if (["Control", "Meta", "Shift", "Alt"].includes(e.key)) return;

      const chord = eventToChord(e);
      const result = setChord(command, chord);
      if (result.ok) {
        setMessage(`Bound to ${formatChord(chord)}.`);
        setRecording(null);
      } else {
        setMessage(`${formatChord(chord)} — ${result.reason}`);
      }
    }

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [recording, setChord]);

  return (
    <div className="flex flex-col gap-5 px-5 py-8 pb-16 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="note">keybindings.json — press a chord and it is yours</p>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Keyboard shortcuts</h1>
        <p className="max-w-[68ch] text-muted">
          Every shortcut on this site is listed here, because this table is what the keyboard handler actually reads.
          Bindings are saved in this browser only.
        </p>
      </header>

      <p aria-live="polite" className="min-h-5 text-[0.75rem] text-amber">
        {recording ? "Listening… press a chord, or Escape to cancel." : message}
      </p>

      <div className="max-w-3xl">
        {keybindingGroups.map((group) => (
          <section key={group} className="mb-5">
            <h2 className="mb-1 text-[0.6875rem] font-semibold tracking-wide text-faint uppercase">{group}</h2>
            <ul className="flex flex-col">
              {keybindings
                .filter((k) => k.group === group)
                .map((binding) => {
                  const chord = chords[binding.command];
                  const changed = chord !== binding.chord;
                  const isRecording = recording === binding.command;

                  return (
                    <li
                      key={binding.command}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.8125rem] text-fg">{binding.label}</p>
                        <code className="text-[0.625rem] text-faint">{binding.command}</code>
                      </div>

                      <kbd
                        className={`rounded border px-2 py-0.5 text-[0.6875rem] ${
                          isRecording ? "border-amber text-amber" : "border-line text-muted"
                        }`}
                      >
                        {isRecording ? "…" : formatChord(chord)}
                      </kbd>

                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          setRecording(isRecording ? null : binding.command);
                        }}
                        aria-pressed={isRecording}
                        className="rounded border border-line px-2 py-0.5 text-[0.6875rem] text-muted hover:border-amber hover:text-fg"
                      >
                        {isRecording ? "Stop" : "Rebind"}
                      </button>

                      {changed ? (
                        <button
                          type="button"
                          onClick={() => {
                            resetChord(binding.command);
                            setMessage(`Reset to ${formatChord(binding.chord)}.`);
                          }}
                          className="text-[0.625rem] text-faint hover:text-rose"
                        >
                          Reset
                        </button>
                      ) : (
                        <span className="w-9 shrink-0" aria-hidden="true" />
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}

        <button
          type="button"
          onClick={() => {
            resetAllChords();
            setMessage("All shortcuts reset.");
          }}
          disabled={!isModified}
          className="btn disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset all shortcuts
        </button>

        <div className="mt-4 flex flex-col gap-2 text-[0.6875rem] leading-snug text-faint">
          <p>
            A chord needs at least one modifier, so typing in the terminal never triggers a command. Browser keys like
            reload, and Escape, Tab and Enter, are left alone on purpose.
          </p>
          <p>
            The editor-group shortcuts use Alt rather than Ctrl because a web page cannot intercept Ctrl+W, Ctrl+Shift+T
            or Ctrl+PageDown — the browser claims those first.
          </p>
          <p>
            <span className="text-amber">Known conflict:</span> in Firefox, Ctrl+Shift+E opens the Network Monitor and
            cannot be overridden by a page. It is kept because it is the binding VS Code itself ships — rebind it above if you use
            Firefox.
          </p>
        </div>
      </div>
    </div>
  );
}
