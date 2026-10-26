"use client";

import { useState } from "react";
import { search } from "@/content/search";
import { useIde } from "./ide-state";
import { SearchIcon } from "./Icons";

/** Shows the match with the query highlighted, trimmed to keep it on one or two lines. */
function Excerpt({ text, query }: { text: string; query: string }) {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return <>{text}</>;
  const from = Math.max(0, at - 28);
  return (
    <>
      {from > 0 && "…"}
      {text.slice(from, at)}
      <mark className="rounded-sm bg-amber/25 text-fg">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

export function SearchPanel() {
  const { open } = useIde();
  const [query, setQuery] = useState("");
  const q = query.trim();
  const hits = search(q);

  // Group hits by the file they came from, the way editor search does.
  const byFile = hits.reduce<Record<string, typeof hits>>((acc, hit) => {
    (acc[hit.path] ||= []).push(hit);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="px-2">
        <label htmlFor="search-input" className="sr-only">
          Search the whole site
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. GraphQL"
            autoComplete="off"
            className="h-8 w-full rounded border border-line bg-bg pr-2 pl-7 text-[0.8125rem] text-fg placeholder:text-faint focus:border-amber focus:outline-none"
          />
        </div>
      </div>

      <p className="px-3 text-[0.6875rem] text-faint" aria-live="polite">
        {q.length < 2
          ? "Searches every file in the workspace."
          : `${hits.length} result${hits.length === 1 ? "" : "s"} in ${Object.keys(byFile).length} file${Object.keys(byFile).length === 1 ? "" : "s"}`}
      </p>

      <div className="flex flex-col gap-3">
        {Object.entries(byFile).map(([path, group]) => (
          <section key={path}>
            <h3 className="px-3 pb-1 text-[0.6875rem] text-purple">{path}</h3>
            <ul>
              {group.map((hit, i) => (
                <li key={`${path}-${i}`}>
                  <button
                    type="button"
                    onClick={() => open(hit.file)}
                    className="block w-full px-3 py-1.5 text-left text-[0.75rem] leading-snug text-muted hover:bg-raise/60 hover:text-fg"
                  >
                    <Excerpt text={hit.text} query={q} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
