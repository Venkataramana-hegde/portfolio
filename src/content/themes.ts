/* Installable colour themes.

   This file is the single source of truth for every colour in the workspace.
   `globals.css` declares the default navy as literal `:root` values so the very
   first paint is correct with no JavaScript; after that, switching a theme
   writes these tokens onto `<html>` as inline custom properties. Nothing here is
   duplicated in CSS, so a theme cannot drift from its swatch.

   Token names are semantic even though two of them read as colours, because the
   whole codebase already styles with `text-amber` / `text-mint`:
     amber  = the active state and primary actions  (one accent, per design rules)
     mint   = live / positive signals               (strings, additions, "ready")
     purple / blue / rose = syntax only.

   Every theme is checked by `pnpm themes:check`, which fails the build if body
   text drops below 4.5:1 or a ground step becomes invisible. The Problems panel
   runs the same assertions in the browser against the active theme. */

export type Appearance = "dark" | "light";

export type ThemeTokens = {
  /** Editor ground. */
  bg: string;
  /** Side panels and the tab bar, behind the editor. */
  panel: string;
  /** Activity bar and title bar, the furthest back. */
  rail: string;
  /** Hover and selected rows. */
  raise: string;
  /** Every divider. */
  line: string;
  /** Body and heading text. */
  fg: string;
  /** Secondary text and comments. Must clear 4.5:1 on bg: it carries prose. */
  muted: string;
  /** Tertiary text and line numbers. Must clear 4.5:1 on bg: `.note` is real content. */
  faint: string;
  /** The one accent: active tab, primary action, caret. */
  amber: string;
  /** Text printed on top of `amber`. */
  amberInk: string;
  /** Live / positive. */
  mint: string;
  purple: string;
  blue: string;
  rose: string;
  /** Text selection background. */
  sel: string;
  /** The mobile drawer scrim. */
  scrim: string;
  /** Drop shadows, which cannot be black on a light ground. */
  shadow: string;
};

/* Syntax colours, separate from the UI tokens because real editor themes do not
   reuse their chrome colours for code. A theme that omits these inherits the UI
   colours, which is how every theme here behaved before the split. */
export type SyntaxTokens = {
  synKey: string;
  synStr: string;
  synFn: string;
  synNum: string;
  synProp: string;
  synCom: string;
  synType: string;
};

export type Theme = {
  id: string;
  name: string;
  /** Credited honestly: most of these are other people's palettes. */
  author: string;
  appearance: Appearance;
  blurb: string;
  tokens: ThemeTokens;
  /** Explicit syntax colours; anything omitted falls back to a UI token. */
  syntax?: Partial<SyntaxTokens>;
};

/* ------------------------------------------------------------------ dark */

export const themes: Theme[] = [
  {
    id: "vscode-dark-modern",
    name: "Dark Modern",
    author: "Microsoft · VS Code default",
    appearance: "dark",
    blurb: "VS Code as it ships. The committed default here too.",
    tokens: {
      bg: "#1f1f1f",
      // VS Code paints the side bar, activity bar, title bar and status bar the
      // same colour and separates them with borders rather than luminance.
      panel: "#181818",
      rail: "#181818",
      raise: "#2a2d2e",
      line: "#2b2b2b",
      fg: "#cccccc",
      muted: "#9d9d9d",
      // VS Code uses #6e7681 here, which is 3.59:1. Ours carries real prose in
      // .note, so it is lifted to #8c8c8c (4.9:1). The one deliberate deviation.
      faint: "#8c8c8c",
      // Chrome accent is #0078d4, which fails as text at 3.64:1. This is
      // textLink.foreground, the blue VS Code itself uses for readable accents.
      amber: "#3794ff",
      amberInk: "#04111f",
      mint: "#89d185",
      purple: "#c586c0",
      blue: "#569cd6",
      rose: "#9cdcfe",
      sel: "#04395e",
      scrim: "rgb(0 0 0 / 0.6)",
      shadow: "rgb(0 0 0 / 0.55)",
    },
    syntax: {
      synKey: "#569cd6",
      synStr: "#ce9178",
      synFn: "#dcdcaa",
      synNum: "#b5cea8",
      synProp: "#9cdcfe",
      synCom: "#6a9955",
      synType: "#4ec9b0",
    },
  },
  {
    id: "vscode-light-modern",
    name: "Light Modern",
    author: "Microsoft · VS Code default",
    appearance: "light",
    blurb: "The light theme VS Code ships with, same borders-not-luminance chrome.",
    tokens: {
      bg: "#ffffff",
      panel: "#f8f8f8",
      rail: "#f8f8f8",
      raise: "#e8e8e8",
      line: "#e5e5e5",
      fg: "#3b3b3b",
      muted: "#5f5f5f",
      faint: "#6b6b6b",
      amber: "#005fb8",
      amberInk: "#ffffff",
      mint: "#116d41",
      purple: "#af00db",
      blue: "#0f62d0",
      rose: "#a31515",
      sel: "#cfe3ff",
      scrim: "rgb(0 0 0 / 0.32)",
      shadow: "rgb(0 0 0 / 0.16)",
    },
    syntax: {
      synKey: "#0000ff",
      synStr: "#a31515",
      synFn: "#795e26",
      synNum: "#098658",
      synProp: "#001080",
      synCom: "#008000",
      synType: "#267f99",
    },
  },
  {
    id: "navy",
    name: "Workspace Navy",
    author: "This site",
    appearance: "dark",
    blurb: "The committed default. Deep navy ground, amber active state, mint for live signals.",
    tokens: {
      bg: "#0a2036",
      panel: "#07192a",
      rail: "#050f1a",
      raise: "#15375a",
      line: "#1e3e5c",
      fg: "#e8eef5",
      muted: "#8ba6c1",
      faint: "#6e8da8",
      amber: "#f6a862",
      amberInk: "#180f04",
      mint: "#56d6ae",
      purple: "#cf9ae2",
      blue: "#5fa8ea",
      rose: "#ed9a90",
      sel: "#1d4a70",
      scrim: "rgb(2 10 18 / 0.66)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },
  {
    id: "night-owl",
    name: "Night Owl",
    author: "Sarah Drasner",
    appearance: "dark",
    blurb: "The palette this workspace grew out of. Inky blue, warm sand accent.",
    tokens: {
      bg: "#011627",
      panel: "#010e1a",
      rail: "#01080f",
      raise: "#0e3250",
      line: "#1d3b53",
      fg: "#d6deeb",
      muted: "#93b4c8",
      faint: "#7a98a8",
      amber: "#ecc48d",
      amberInk: "#1a1206",
      mint: "#addb67",
      purple: "#c792ea",
      blue: "#82aaff",
      rose: "#f78c6c",
      sel: "#1d3b53",
      scrim: "rgb(1 6 14 / 0.66)",
      shadow: "rgb(0 0 0 / 0.55)",
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    author: "Enkia",
    appearance: "dark",
    blurb: "Cool violet-slate with neon signage accents.",
    tokens: {
      bg: "#1a1b26",
      panel: "#16161e",
      rail: "#101016",
      raise: "#2c3148",
      line: "#333a57",
      fg: "#c8d3f5",
      muted: "#a1abd4",
      faint: "#8389ad",
      amber: "#ff9e64",
      amberInk: "#1a0f06",
      mint: "#9ece6a",
      purple: "#bb9af7",
      blue: "#7aa2f7",
      rose: "#f7768e",
      sel: "#2d3f76",
      scrim: "rgb(10 10 16 / 0.68)",
      shadow: "rgb(0 0 0 / 0.55)",
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    author: "Zeno Rocha",
    appearance: "dark",
    blurb: "The classic. Warm charcoal with pink and violet.",
    tokens: {
      bg: "#282a36",
      panel: "#21222c",
      rail: "#191a21",
      raise: "#3b3e51",
      line: "#484b5e",
      fg: "#f8f8f2",
      muted: "#b9bcd0",
      faint: "#9199c4",
      amber: "#ffb86c",
      amberInk: "#1c1205",
      mint: "#50fa7b",
      purple: "#bd93f9",
      blue: "#8be9fd",
      rose: "#ff79c6",
      sel: "#44475a",
      scrim: "rgb(16 17 22 / 0.66)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },
  {
    id: "one-dark",
    name: "One Dark",
    author: "Atom",
    appearance: "dark",
    blurb: "Even, desaturated slate. The least shouty dark theme here.",
    tokens: {
      bg: "#282c34",
      panel: "#21252b",
      rail: "#1b1f23",
      raise: "#333a45",
      line: "#434a57",
      fg: "#dce0e6",
      muted: "#a9b2c3",
      faint: "#949cab",
      amber: "#e0a070",
      amberInk: "#1a1005",
      mint: "#98c379",
      purple: "#c678dd",
      blue: "#61afef",
      rose: "#e87c84",
      sel: "#3e4451",
      scrim: "rgb(18 20 24 / 0.66)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    author: "Pavel Pertsev",
    appearance: "dark",
    blurb: "Retro warm earth tones. Paper-ish foreground, no blue ground at all.",
    tokens: {
      bg: "#282828",
      panel: "#1f1f1f",
      rail: "#181818",
      raise: "#3c3836",
      line: "#504945",
      fg: "#ebdbb2",
      muted: "#c2b193",
      faint: "#a89984",
      amber: "#fe8019",
      amberInk: "#1d1200",
      mint: "#b8bb26",
      purple: "#d3869b",
      blue: "#83a598",
      rose: "#fd6450",
      sel: "#504945",
      scrim: "rgb(16 16 16 / 0.68)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    author: "Wimer Hazenberg",
    appearance: "dark",
    blurb: "Olive-charcoal ground, acid green and magenta. Peak 2008, still good.",
    tokens: {
      bg: "#272822",
      panel: "#1f201b",
      rail: "#171812",
      raise: "#3e3d32",
      line: "#4d4c41",
      fg: "#f8f8f2",
      muted: "#c3c0ab",
      faint: "#a6a292",
      amber: "#fd971f",
      amberInk: "#1c1200",
      mint: "#a6e22e",
      purple: "#ae81ff",
      blue: "#66d9ef",
      rose: "#ff5c94",
      sel: "#49483e",
      scrim: "rgb(14 15 11 / 0.68)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    author: "Ethan Schoonover",
    appearance: "dark",
    blurb: "Teal-ink ground on a measured sixteen-colour system.",
    tokens: {
      bg: "#002b36",
      panel: "#01222b",
      rail: "#011a21",
      raise: "#0a4452",
      line: "#13505f",
      fg: "#dbe3e3",
      muted: "#a3b1b1",
      faint: "#8b9c9c",
      amber: "#cb9a1a",
      amberInk: "#14100a",
      mint: "#9aa900",
      purple: "#e76aa1",
      blue: "#4ba3e0",
      rose: "#e06c3b",
      sel: "#073642",
      scrim: "rgb(0 16 21 / 0.68)",
      shadow: "rgb(0 0 0 / 0.5)",
    },
  },

  /* --------------------------------------------------------------- light */

  {
    id: "github-light",
    name: "GitHub Light",
    author: "GitHub",
    appearance: "light",
    blurb: "Clean white ground. The one most people read code on all day.",
    tokens: {
      bg: "#ffffff",
      panel: "#f6f8fa",
      rail: "#eef1f4",
      raise: "#dfe5eb",
      line: "#cfd7de",
      fg: "#1f2328",
      muted: "#59636e",
      faint: "#68717b",
      amber: "#9a6700",
      amberInk: "#fffaf0",
      mint: "#116d41",
      purple: "#8250df",
      blue: "#0969da",
      rose: "#cf222e",
      sel: "#cfe3ff",
      scrim: "rgb(31 35 40 / 0.4)",
      shadow: "rgb(31 35 40 / 0.18)",
    },
  },
  {
    id: "one-light",
    name: "One Light",
    author: "Atom",
    appearance: "light",
    blurb: "Soft grey paper, the mirror of One Dark.",
    tokens: {
      bg: "#fafafa",
      panel: "#f0f0f0",
      rail: "#e6e6e7",
      raise: "#dcdcdd",
      line: "#cbcbcd",
      fg: "#2f3138",
      muted: "#56595f",
      faint: "#676b73",
      amber: "#a04f00",
      amberInk: "#fff8f2",
      mint: "#2f7a3e",
      purple: "#9c27a0",
      blue: "#2f68d8",
      rose: "#c0143c",
      sel: "#d4e2f7",
      scrim: "rgb(47 49 56 / 0.4)",
      shadow: "rgb(47 49 56 / 0.18)",
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    author: "Ethan Schoonover",
    appearance: "light",
    blurb: "Warm cream ground. Easiest of the light themes on a bright screen.",
    tokens: {
      bg: "#fdf6e3",
      panel: "#f4ecd8",
      rail: "#ebe3cf",
      raise: "#e2dac4",
      line: "#d2cab4",
      fg: "#073642",
      muted: "#4e6a70",
      faint: "#4e666b",
      amber: "#8a6400",
      amberInk: "#fffaef",
      mint: "#5c6b00",
      purple: "#b0237a",
      blue: "#1f6fa8",
      rose: "#b34211",
      sel: "#dbe6d8",
      scrim: "rgb(7 54 66 / 0.38)",
      shadow: "rgb(7 54 66 / 0.16)",
    },
  },
];

export const defaultThemeId = "vscode-dark-modern";

export const themeIds = themes.map((t) => t.id);

export const themeById = (id: string | null | undefined): Theme =>
  themes.find((t) => t.id === id) ?? themes.find((t) => t.id === defaultThemeId)!;

/** Token key -> CSS custom property, e.g. `amberInk` -> `--amber-ink`. */
export const cssVarName = (key: string) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

export const resolveSyntax = (theme: Theme): SyntaxTokens => {
  const t = theme.tokens;
  const s = theme.syntax ?? {};
  return {
    synKey: s.synKey ?? t.purple,
    synStr: s.synStr ?? t.mint,
    synFn: s.synFn ?? t.blue,
    synNum: s.synNum ?? t.amber,
    synProp: s.synProp ?? t.rose,
    synCom: s.synCom ?? t.faint,
    synType: s.synType ?? t.mint,
  };
};

/** Every custom property a theme sets: UI tokens plus resolved syntax. */
export const resolvedTokens = (theme: Theme) => ({ ...theme.tokens, ...resolveSyntax(theme) });

/** The tokens of one theme as a CSS declaration list, used by the bootstrap. */
export const themeCssText = (theme: Theme) =>
  Object.entries(resolvedTokens(theme))
    .map(([k, v]) => `${cssVarName(k)}:${v}`)
    .join(";");

/** What `localStorage` key the choice lives under. */
export const THEME_STORAGE_KEY = "ide:theme";
/** Themes the visitor has "installed", so the marketplace can be honest about it. */
export const INSTALLED_STORAGE_KEY = "ide:themes:installed";

/** Installed out of the box; everything else has to be installed to be used. */
export const preinstalledIds = [defaultThemeId, "vscode-light-modern", "navy"];
