/* Contrast gate for the theme registry. Run with `pnpm themes:check`.
   The browser Problems panel runs the same assertions against the active theme,
   so a theme that ships cannot quietly fail its own accessibility claims. */

import { themes } from "../src/content/themes.ts";

const srgb = (c) => {
  const n = c / 255;
  return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * srgb((n >> 16) & 255) + 0.7152 * srgb((n >> 8) & 255) + 0.0722 * srgb(n & 255);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* Each rule is [label, foreground token, background token, minimum]. */
const textRules = [
  ["body + headings", "fg", "bg", 7],
  ["prose (--muted)", "muted", "bg", 4.5],
  ["notes (--faint)", "faint", "bg", 4.5],
  ["accent as text", "amber", "bg", 4.5],
  ["positive", "mint", "bg", 4.5],
  ["syntax purple", "purple", "bg", 4.5],
  ["syntax blue", "blue", "bg", 4.5],
  ["syntax rose", "rose", "bg", 4.5],
  ["panel text", "muted", "panel", 4.5],
  ["rail/terminal text", "muted", "rail", 4.5],
  ["faint on panel", "faint", "panel", 4.5],
  ["text on hovered row", "fg", "raise", 4.5],
  ["ink on accent", "amberInk", "amber", 4.5],
];

/* Grounds must actually read as separate surfaces. 1.0 means invisible. */
const groundRules = [
  ["panel behind editor", "panel", "bg", 1.04],
  ["rail behind panel", "rail", "panel", 1.03],
  ["hover row", "raise", "bg", 1.14],
  ["dividers", "line", "bg", 1.25],
];

let failures = 0;
let checks = 0;

for (const theme of themes) {
  const t = theme.tokens;
  const problems = [];

  for (const [label, fg, bg, min] of textRules) {
    checks++;
    const ratio = contrast(t[fg], t[bg]);
    if (ratio < min) problems.push(`${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  }
  for (const [label, a, b, min] of groundRules) {
    checks++;
    const ratio = contrast(t[a], t[b]);
    if (ratio < min) problems.push(`${label}: ${a} vs ${b} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  }

  // A light theme whose ground is dark (or the reverse) would break color-scheme.
  checks++;
  const bgIsLight = luminance(t.bg) > 0.4;
  if (bgIsLight !== (theme.appearance === "light")) {
    problems.push(`appearance is "${theme.appearance}" but --bg luminance is ${luminance(t.bg).toFixed(3)}`);
  }

  if (problems.length === 0) {
    console.log(`PASS  ${theme.id.padEnd(16)} ${theme.appearance}`);
  } else {
    failures += problems.length;
    console.log(`FAIL  ${theme.id.padEnd(16)} ${theme.appearance}`);
    for (const p of problems) console.log(`        ${p}`);
  }
}

console.log(`\n${checks} assertions across ${themes.length} themes, ${failures} failing.`);
process.exit(failures ? 1 : 0);
