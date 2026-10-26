"use client";

import { useState } from "react";
import { extensions, type Extension } from "@/content/profile";
import { CheckIcon, SearchIcon, StarIcon } from "./Icons";
import { ThemeMarketplace } from "./ThemeMarketplace";

/* Skills, shown the way an editor shows installed extensions. The numbers are
   real: `projects` counts the things on this site that use it, and `since` is
   when I started, rather than an invented download count. */

const categories = ["All", ...new Set(extensions.map((e) => e.category))] as const;

function Stars({ level }: { level: Extension["level"] }) {
  return (
    <span className="flex items-center gap-0.5 text-amber" aria-label={`Comfort level ${level} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className="size-3" filled={n <= level} />
      ))}
    </span>
  );
}

function Skills() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const list = extensions.filter(
    (e) =>
      (category === "All" || e.category === category) &&
      (!q || e.name.toLowerCase().includes(q) || e.blurb.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="px-2">
        <label htmlFor="ext-search" className="sr-only">
          Search skills
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            id="ext-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills"
            autoComplete="off"
            className="h-8 w-full rounded border border-line bg-bg pr-2 pl-7 text-[0.8125rem] text-fg placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded px-2 py-0.5 text-[0.6875rem] transition-colors ${
              category === c ? "bg-amber text-amber-ink" : "text-muted hover:bg-raise hover:text-fg"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="px-3 text-[0.6875rem] text-faint" aria-live="polite">
        {list.length} installed
      </p>

      <ul className="flex flex-col">
        {list.map((e) => {
          const isOpen = openId === e.id;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : e.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-raise/60"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded text-[0.625rem] font-bold"
                  style={{ background: `${e.color}1f`, color: e.color }}
                >
                  {e.mark}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[0.8125rem] font-medium text-fg">{e.name}</span>
                    <CheckIcon className="size-3 shrink-0 text-mint" />
                  </span>
                  <span className="truncate text-[0.6875rem] text-muted">{e.blurb}</span>
                  <span className="flex items-center gap-2">
                    <Stars level={e.level} />
                    <span className="text-[0.625rem] text-faint">
                      {e.projects} {e.projects === 1 ? "project" : "projects"}
                    </span>
                  </span>
                </span>
              </button>

              {isOpen && (
                <dl className="grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1 border-l-2 border-line px-3 pb-3 pl-5 text-[0.6875rem]">
                  <dt className="text-faint">Category</dt>
                  <dd className="text-muted">{e.category}</dd>
                  <dt className="text-faint">Using since</dt>
                  <dd className="text-muted">{e.since}</dd>
                  <dt className="text-faint">Used in</dt>
                  <dd className="text-muted">
                    {e.projects} {e.projects === 1 ? "project" : "projects"} on this site
                  </dd>
                </dl>
              )}
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="px-3 py-4 text-[0.75rem] text-muted">
            Nothing matches “{query.trim()}”.{" "}
            <button type="button" onClick={() => { setQuery(""); setCategory("All"); }} className="text-blue underline underline-offset-2">
              Clear
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

/* The Extensions panel holds both halves of a real marketplace: what is already
   installed (skills, which cannot be installed or removed because they are
   facts) and what you can install (themes, which genuinely install). */

const sections = ["Skills", "Themes"] as const;

export function Extensions() {
  const [section, setSection] = useState<(typeof sections)[number]>("Skills");

  return (
    <div className="flex flex-col">
      <div role="tablist" aria-label="Marketplace section" className="flex shrink-0 border-b border-line">
        {sections.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={`relative flex-1 py-2 text-[0.75rem] transition-colors ${
              section === s ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {s}
            {section === s && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-t bg-amber" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="pt-3">{section === "Skills" ? <Skills /> : <ThemeMarketplace />}</div>
    </div>
  );
}
