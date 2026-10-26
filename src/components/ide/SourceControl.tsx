"use client";

import { useState } from "react";
import { experience } from "@/content/profile";
import { findFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { BranchIcon, ChevronIcon } from "./Icons";

/* Experience as a commit log. Each role is a commit; expanding one shows the
   files it touched and its achievements as added lines. */

export function SourceControl() {
  const { open } = useIde();
  const [expanded, setExpanded] = useState<string | null>(experience[0].id);

  return (
    <div className="flex flex-col gap-1 pb-4">
      <p className="flex items-center gap-2 px-3 pb-1 text-[0.75rem] text-muted">
        <BranchIcon className="size-3.5 text-mint" />
        main
        <span className="text-faint">· {experience.length} commits</span>
      </p>

      <ol className="flex flex-col">
        {experience.map((role) => {
          const isOpen = expanded === role.id;
          const total = role.files.reduce((sum, f) => sum + f.added, 0);
          return (
            <li key={role.id} className="border-b border-line/70 last:border-b-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : role.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-2 px-2 py-2.5 text-left hover:bg-raise/60"
              >
                <ChevronIcon className={`mt-1 size-3.5 shrink-0 text-faint transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="text-[0.75rem] text-amber">{role.hash}</span>
                    {role.current && (
                      <span className="rounded bg-mint/15 px-1.5 text-[0.625rem] font-semibold text-mint">HEAD</span>
                    )}
                  </span>
                  <span className="text-[0.8125rem] leading-snug text-fg">{role.title}</span>
                  <span className="text-[0.75rem] text-muted">{role.company}</span>
                  <span className="text-[0.6875rem] text-faint">
                    {role.start} → {role.end} · +{total}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-2 px-3 pb-3">
                  <ul className="flex flex-col gap-0.5">
                    {role.files.map((f) => (
                      <li key={f.path} className="flex items-baseline gap-2 text-[0.6875rem]">
                        <span className="truncate text-muted">{f.path}</span>
                        <span className="ml-auto shrink-0 text-mint">+{f.added}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="flex flex-col gap-1 border-l-2 border-mint/40 pl-2">
                    {role.added.slice(0, 3).map((line) => (
                      <li key={line} className="text-[0.6875rem] leading-snug text-muted">
                        <span className="text-mint">+ </span>
                        {line.length > 92 ? `${line.slice(0, 92)}…` : line}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => open(findFile("experience")!)}
                    className="w-fit text-[0.75rem] text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
                  >
                    show full diff
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
