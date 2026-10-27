/* Workspace settings, in the shape of a real editor's settings.json.

   Every setting here changes something you can see. There is no "minimap" or
   "format on save" toggle until the thing it controls exists — a switch that
   flips nothing is the same lie as an invented download count.

   Numbers are applied as CSS custom properties; booleans and enums as data
   attributes on <html>, which `globals.css` keys off. That keeps the whole
   mechanism declarative and lets the bootstrap apply it before the first paint. */

export type Settings = {
  "editor.fontFamily": "vscode" | "fira";
  "editor.fontSize": number;
  "editor.lineHeight": number;
  "editor.lineNumbers": boolean;
  "editor.fontLigatures": boolean;
  "editor.wordWrap": boolean;
  "terminal.fontSize": number;
  "workbench.density": "comfortable" | "compact";
  "workbench.sideBarLocation": "left" | "right";
  "workbench.statusBar": boolean;
  "workbench.reduceMotion": boolean;
};

export type SettingKey = keyof Settings;

type Common = {
  key: SettingKey;
  label: string;
  /** Says what it actually does, because the panel claims it does it. */
  description: string;
  group: "Editor" | "Terminal" | "Workbench";
};

export type SettingDef = Common &
  (
    | {
        kind: "number";
        default: number;
        min: number;
        max: number;
        step: number;
        /** Custom property it writes, plus the unit to write with it. */
        cssVar: string;
        unit: "rem" | "";
      }
    | {
        kind: "boolean";
        default: boolean;
        /** data-<attr> on <html>, set to "on" or "off". */
        attr: string;
      }
    | {
        kind: "enum";
        default: string;
        options: readonly string[];
        attr: string;
      }
  );

export const settingDefs: readonly SettingDef[] = [
  {
    key: "editor.fontFamily",
    label: "Font family",
    description:
      "vscode uses the fonts VS Code ships with — a system UI font for the chrome, Consolas or Menlo for file contents. fira uses Fira Code throughout.",
    group: "Editor",
    kind: "enum",
    default: "vscode",
    options: ["vscode", "fira"],
    attr: "font",
  },
  {
    key: "editor.fontSize",
    label: "Font size",
    description: "Base type size for page text, in rem. Everything else scales from it.",
    group: "Editor",
    kind: "number",
    default: 0.9375,
    min: 0.8125,
    max: 1.125,
    step: 0.0625,
    cssVar: "--ui-font-size",
    unit: "rem",
  },
  {
    key: "editor.lineHeight",
    label: "Line height",
    description: "Leading for prose. Lower is denser, higher is easier on long paragraphs.",
    group: "Editor",
    kind: "number",
    default: 1.65,
    min: 1.35,
    max: 2,
    step: 0.05,
    cssVar: "--ui-line-height",
    unit: "",
  },
  {
    key: "editor.lineNumbers",
    label: "Line numbers",
    description: "The gutter numbers down the left of every code block.",
    group: "Editor",
    kind: "boolean",
    default: true,
    attr: "line-numbers",
  },
  {
    key: "editor.fontLigatures",
    label: "Font ligatures",
    description: "Fira Code's joined glyphs for =>, !==, >= and friends.",
    group: "Editor",
    kind: "boolean",
    default: true,
    attr: "ligatures",
  },
  {
    key: "editor.wordWrap",
    label: "Word wrap",
    description: "Wrap long code lines instead of scrolling them sideways.",
    group: "Editor",
    kind: "boolean",
    default: true,
    attr: "word-wrap",
  },
  {
    key: "terminal.fontSize",
    label: "Terminal font size",
    description: "Type size inside the terminal pane only, in rem.",
    group: "Terminal",
    kind: "number",
    default: 0.8125,
    min: 0.6875,
    max: 1,
    step: 0.0625,
    cssVar: "--term-font-size",
    unit: "rem",
  },
  {
    key: "workbench.density",
    label: "Density",
    description: "Compact tightens page padding and panel rows, fitting more on screen.",
    group: "Workbench",
    kind: "enum",
    default: "comfortable",
    options: ["comfortable", "compact"],
    attr: "density",
  },
  {
    key: "workbench.sideBarLocation",
    label: "Side bar location",
    description: "Which side the explorer and other panels dock to.",
    group: "Workbench",
    kind: "enum",
    default: "left",
    options: ["left", "right"],
    attr: "sidebar",
  },
  {
    key: "workbench.statusBar",
    label: "Status bar",
    description: "The bottom strip with the branch, language mode and clock.",
    group: "Workbench",
    kind: "boolean",
    default: true,
    attr: "status-bar",
  },
  {
    key: "workbench.reduceMotion",
    label: "Reduce motion",
    description: "Stops the load animation and the blinking caret. Forced on if your OS asks for it.",
    group: "Workbench",
    kind: "boolean",
    default: false,
    attr: "reduce-motion",
  },
];

export const defaultSettings = Object.fromEntries(
  settingDefs.map((d) => [d.key, d.default]),
) as Settings;

export const settingByKey = new Map(settingDefs.map((d) => [d.key, d]));

export const settingGroups = ["Editor", "Terminal", "Workbench"] as const;

export const SETTINGS_STORAGE_KEY = "ide:settings";

/** Drops unknown keys and out-of-range values, so a hand-edited blob is safe. */
export function coerceSettings(input: unknown): Settings {
  const out = { ...defaultSettings };
  if (!input || typeof input !== "object") return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const def = settingByKey.get(key as SettingKey);
    if (!def) continue;
    if (def.kind === "number" && typeof value === "number" && Number.isFinite(value)) {
      out[def.key] = Math.min(def.max, Math.max(def.min, value)) as never;
    } else if (def.kind === "boolean" && typeof value === "boolean") {
      out[def.key] = value as never;
    } else if (def.kind === "enum" && typeof value === "string" && def.options.includes(value)) {
      out[def.key] = value as never;
    }
  }
  return out;
}

/** The settings.json text shown in the editor, with the theme folded in. */
export function settingsJson(settings: Settings, colorTheme: string) {
  const body = { "workbench.colorTheme": colorTheme, ...settings };
  return JSON.stringify(body, null, 2);
}
