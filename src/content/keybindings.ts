/* Keyboard shortcuts, as a rebindable table rather than a switch buried in a
   keydown handler. Every command here is wired to something that works; the
   panel that lists them is generated from this file, so the documented
   shortcuts and the real ones cannot disagree.

   Chords are stored with a platform-neutral "Mod", which means Ctrl on Windows
   and Linux and Command on Apple hardware — the same way an editor ships one
   keymap for both. */

export type CommandId =
  | "palette.open"
  | "terminal.toggle"
  | "sideBar.toggle"
  | "panel.explorer"
  | "panel.search"
  | "panel.scm"
  | "panel.extensions"
  | "settings.open"
  | "editor.close"
  | "editor.reopen"
  | "editor.next"
  | "editor.prev"
  | "editor.moveLeft"
  | "editor.moveRight";

export type Keybinding = {
  command: CommandId;
  /** What the command palette and the shortcuts list call it. */
  label: string;
  /** The default chord, e.g. "Mod+Shift+E". */
  chord: string;
  group: "Navigation" | "Panels" | "View" | "Editor group";
};

export const keybindings: readonly Keybinding[] = [
  { command: "palette.open", label: "Go to file / command palette", chord: "Mod+K", group: "Navigation" },
  { command: "settings.open", label: "Open settings.json", chord: "Mod+,", group: "Navigation" },
  { command: "terminal.toggle", label: "Toggle terminal", chord: "Mod+`", group: "View" },
  { command: "sideBar.toggle", label: "Toggle side bar", chord: "Mod+B", group: "View" },
  { command: "panel.explorer", label: "Show explorer", chord: "Mod+Shift+E", group: "Panels" },
  { command: "panel.search", label: "Show search", chord: "Mod+Shift+F", group: "Panels" },
  { command: "panel.scm", label: "Show source control", chord: "Mod+Shift+G", group: "Panels" },
  { command: "panel.extensions", label: "Show extensions", chord: "Mod+Shift+X", group: "Panels" },
  { command: "editor.close", label: "Close editor", chord: "Alt+W", group: "Editor group" },
  { command: "editor.reopen", label: "Reopen closed editor", chord: "Alt+Shift+T", group: "Editor group" },
  { command: "editor.next", label: "Next editor", chord: "Alt+PageDown", group: "Editor group" },
  { command: "editor.prev", label: "Previous editor", chord: "Alt+PageUp", group: "Editor group" },
  { command: "editor.moveLeft", label: "Move editor left", chord: "Alt+Shift+ArrowLeft", group: "Editor group" },
  { command: "editor.moveRight", label: "Move editor right", chord: "Alt+Shift+ArrowRight", group: "Editor group" },
];

export const keybindingGroups = ["Navigation", "Editor group", "Panels", "View"] as const;

export const defaultChords = Object.fromEntries(keybindings.map((k) => [k.command, k.chord])) as Record<
  CommandId,
  string
>;

export const commandLabels = Object.fromEntries(keybindings.map((k) => [k.command, k.label])) as Record<
  CommandId,
  string
>;

export const KEYBINDINGS_STORAGE_KEY = "ide:keybindings";

/** Keys that cannot be bound on their own: they would trap the visitor. */
const RESERVED = new Set(["Escape", "Tab", "Enter", "Mod+R", "Mod+W", "Mod+T", "Mod+Shift+R"]);

/** Builds the stored chord form from a real keyboard event. */
export function eventToChord(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Mod");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join("+");
}

/** A chord is usable if it has a modifier, is not reserved, and is not a bare modifier. */
export function isBindable(chord: string): boolean {
  if (RESERVED.has(chord)) return false;
  const parts = chord.split("+");
  const last = parts.at(-1)!;
  if (["Mod", "Alt", "Shift", "Control", "Meta"].includes(last)) return false;
  // Without a modifier a shortcut would fire while someone types in the terminal.
  return parts.length > 1;
}

const isApple = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** Chord as a human reads it: "Mod+Shift+E" -> "Ctrl Shift E" or "⌘ ⇧ E". */
export function formatChord(chord: string): string {
  const apple = isApple();
  return chord
    .split("+")
    .map((part) => {
      if (part === "Mod") return apple ? "⌘" : "Ctrl";
      if (part === "Shift") return apple ? "⇧" : "Shift";
      if (part === "Alt") return apple ? "⌥" : "Alt";
      if (part === "ArrowUp") return "↑";
      if (part === "ArrowDown") return "↓";
      if (part === "ArrowLeft") return "←";
      if (part === "ArrowRight") return "→";
      if (part === "PageUp") return "PgUp";
      if (part === "PageDown") return "PgDn";
      return part;
    })
    .join(apple ? " " : "+");
}

export function coerceChords(input: unknown): Partial<Record<CommandId, string>> {
  const out: Partial<Record<CommandId, string>> = {};
  if (!input || typeof input !== "object") return out;
  for (const [command, chord] of Object.entries(input as Record<string, unknown>)) {
    if (!(command in defaultChords)) continue;
    if (typeof chord !== "string" || !isBindable(chord)) continue;
    out[command as CommandId] = chord;
  }
  return out;
}
