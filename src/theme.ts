// Colours needed outside CSS: the browser's theme-color and the next/og images,
// where custom properties are unavailable. Derived from the committed default in
// the theme registry rather than copied, so the two can never disagree.
//
// These are build-time values. OG images and favicons are generated once and
// cannot follow a visitor's installed theme, so they always show the default.

import { defaultThemeId, themeById } from "@/content/themes";

const { tokens } = themeById(defaultThemeId);

export const palette = {
  bg: tokens.bg,
  panel: tokens.panel,
  rail: tokens.rail,
  line: tokens.line,
  fg: tokens.fg,
  muted: tokens.muted,
  faint: tokens.faint,
  amber: tokens.amber,
  amberInk: tokens.amberInk,
  mint: tokens.mint,
  purple: tokens.purple,
  blue: tokens.blue,
} as const;
