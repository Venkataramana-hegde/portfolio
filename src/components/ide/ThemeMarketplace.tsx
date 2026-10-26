"use client";

import { useState } from "react";
import { cssVarName, themes, preinstalledIds, type Theme } from "@/content/themes";
import { CheckIcon, SearchIcon } from "./Icons";
import { useTheme } from "./theme-state";

/* Themes, shown the way an editor shows a marketplace — and the buttons do the
   thing they say. Install writes to localStorage and the whole site repaints.
   There is deliberately no fake progress spinner: applying a theme is seventeen
   custom properties and a repaint, so it is instant, and pretending otherwise
   would be the kind of theatre the rest of this chrome avoids. Credit is real:
   most of these palettes are other people's work. */

const filters = ["All", "Dark", "Light"] as const;

/** A real preview: a miniature workbench painted with that theme's own tokens. */
function Preview({ theme }: { theme: Theme }) {
  const t = theme.tokens;
  const style = Object.fromEntries(
    Object.entries(t).map(([k, v]) => [cssVarName(k), v]),
  ) as React.CSSProperties;

  return (
    <div
      aria-hidden="true"
      style={style}
      className="flex h-[4.5rem] overflow-hidden rounded border"
      // Borders and grounds come from the previewed theme, not the active one.
    >
      <div className="w-2.5 shrink-0" style={{ background: t.rail }} />
      <div className="w-6 shrink-0 border-r" style={{ background: t.panel, borderColor: t.line }}>
        <div className="mt-1.5 ml-1 h-1 w-3.5 rounded-full" style={{ background: t.faint }} />
        <div className="mt-1 ml-1 h-1 w-2.5 rounded-full" style={{ background: t.faint }} />
        <div className="mt-1 ml-1 h-1 w-3 rounded-full" style={{ background: t.muted }} />
      </div>
      <div className="min-w-0 flex-1" style={{ background: t.bg }}>
        <div className="flex h-3.5 items-end border-b" style={{ background: t.panel, borderColor: t.line }}>
          <span className="h-full w-10 border-r" style={{ background: t.bg, borderColor: t.line, boxShadow: `inset 0 2px 0 ${t.amber}` }} />
        </div>
        <pre className="px-1.5 pt-1 text-[0.4375rem] leading-[1.45]" style={{ color: t.muted }}>
          <span style={{ color: t.purple }}>const</span> <span style={{ color: t.blue }}>role</span> ={" "}
          <span style={{ color: t.mint }}>&quot;engineer&quot;</span>
          {"\n"}
          <span style={{ color: t.faint }}>{"// honest numbers only"}</span>
          {"\n"}
          <span style={{ color: t.rose }}>years</span>: <span style={{ color: t.amber }}>4</span>
          <span style={{ color: t.amber }} className="caret ml-0.5 !h-[0.55em] !w-[0.3em]" />
        </pre>
      </div>
    </div>
  );
}

export function ThemeMarketplace() {
  const { themeId, isInstalled, setTheme, installTheme, uninstallTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const q = query.trim().toLowerCase();
  const list = themes.filter(
    (t) =>
      (filter === "All" || t.appearance === filter.toLowerCase()) &&
      (!q || t.name.toLowerCase().includes(q) || t.author.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q)),
  );

  const installedCount = themes.filter((t) => isInstalled(t.id)).length;

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="px-2">
        <label htmlFor="theme-search" className="sr-only">
          Search themes
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            id="theme-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search themes"
            autoComplete="off"
            className="h-8 w-full rounded border border-line bg-bg pr-2 pl-7 text-[0.8125rem] text-fg placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded px-2 py-0.5 text-[0.6875rem] transition-colors ${
              filter === f ? "bg-amber text-amber-ink" : "text-muted hover:bg-raise hover:text-fg"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="px-3 text-[0.6875rem] text-faint" aria-live="polite">
        {installedCount} of {themes.length} installed
      </p>

      <ul className="flex flex-col gap-2 px-2">
        {list.map((theme) => {
          const installed = isInstalled(theme.id);
          const active = themeId === theme.id;
          const locked = preinstalledIds.includes(theme.id);

          return (
            <li
              key={theme.id}
              className={`rounded border p-2 transition-colors ${active ? "border-amber bg-raise/40" : "border-line hover:border-faint"}`}
            >
              <Preview theme={theme} />

              <div className="mt-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-fg">
                    <span className="truncate">{theme.name}</span>
                    {installed && <CheckIcon className="size-3 shrink-0 text-mint" />}
                  </p>
                  <p className="truncate text-[0.625rem] text-faint">
                    {theme.author} · {theme.appearance}
                  </p>
                </div>
              </div>

              <p className="mt-1 text-[0.6875rem] leading-snug text-muted">{theme.blurb}</p>

              <div className="mt-2 flex flex-wrap items-center gap-1">
                {!installed && (
                  <button
                    type="button"
                    onClick={() => {
                      installTheme(theme.id);
                      setTheme(theme.id);
                    }}
                    className="rounded border border-transparent bg-amber px-2 py-1 text-[0.6875rem] font-semibold text-amber-ink hover:brightness-110"
                  >
                    Install
                  </button>
                )}

                {installed && !active && (
                  <button
                    type="button"
                    onClick={() => setTheme(theme.id)}
                    className="rounded border border-line bg-bg px-2 py-1 text-[0.6875rem] text-muted hover:border-amber hover:text-fg"
                  >
                    Set as theme
                  </button>
                )}

                {active && (
                  <span className="rounded border border-mint/50 px-2 py-1 text-[0.6875rem] text-mint">Active theme</span>
                )}

                {installed && !locked && (
                  <button
                    type="button"
                    onClick={() => uninstallTheme(theme.id)}
                    className="rounded px-2 py-1 text-[0.6875rem] text-faint hover:text-rose"
                  >
                    Uninstall
                  </button>
                )}

                {locked && installed && (
                  <span className="px-1 text-[0.625rem] text-faint">built in</span>
                )}
              </div>
            </li>
          );
        })}

        {list.length === 0 && (
          <li className="px-1 py-4 text-[0.75rem] text-muted">
            No theme matches “{query.trim()}”.{" "}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
              className="text-blue underline underline-offset-2"
            >
              Clear
            </button>
          </li>
        )}
      </ul>

      <p className="px-3 text-[0.625rem] leading-snug text-faint">
        Your choice is saved in this browser only. Every theme here passes the same contrast gate the Problems panel
        runs, so body text never drops below 4.5:1.
      </p>
    </div>
  );
}
