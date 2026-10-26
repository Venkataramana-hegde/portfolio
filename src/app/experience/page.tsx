import { FilePathNote, PanelLink } from "@/components/ide/PageBits";
import { experience } from "@/content/profile";
import { pageMetadata } from "@/lib/meta";

export const metadata = pageMetadata(
  "experience",
  "Three engineering roles since February 2025: Helpee Elder Care and Healthletic Lifestyle.",
);

/* Experience rendered as a git log with diffs. Each role is a commit, each
   achievement an added line. */

export default function Experience() {
  return (
    <article className="doc max-w-5xl">
      <FilePathNote cmd="experience" />
      <h1>Experience</h1>
      <p>
        Every role as a commit, newest first. The same log is in the{" "}
        <PanelLink panel="git">source control panel</PanelLink>.
      </p>

      <ol className="flex flex-col gap-8">
        {experience.map((role) => {
          const total = role.files.reduce((sum, f) => sum + f.added, 0);
          return (
            <li key={role.id} id={role.id} className="scroll-mt-6 overflow-hidden rounded-lg border border-line bg-panel">
              <header className="flex flex-col gap-1 border-b border-line px-4 py-3">
                <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem]">
                  <span className="text-amber">commit {role.hash}</span>
                  {role.current && (
                    <span className="rounded bg-mint/15 px-1.5 text-[0.625rem] font-semibold text-mint">HEAD → main</span>
                  )}
                </p>
                <p className="text-[0.75rem] text-muted">
                  Date: {role.start} → {role.end}
                </p>
                <h2 className="pt-1 text-base">{role.title}</h2>
                <p className="text-[0.8125rem] text-muted">
                  {role.company} · {role.place}
                </p>
              </header>

              <div className="border-b border-line px-4 py-3">
                <p className="pb-2 text-[0.75rem] text-faint">
                  {role.files.length} files changed, <span className="text-mint">{total} insertions(+)</span>
                </p>
                <ul className="flex flex-col gap-1">
                  {role.files.map((f) => (
                    <li key={f.path} className="flex items-center gap-3 text-[0.75rem]">
                      <span className="w-56 shrink-0 truncate text-muted">{f.path}</span>
                      <span className="shrink-0 text-faint tabular-nums">{f.added}</span>
                      <span className="truncate text-mint" aria-hidden="true">
                        {"+".repeat(Math.min(f.added, 40))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-4 py-3">
                <p className="pb-2 text-[0.8125rem] text-muted">{role.summary}</p>
                <ul className="flex flex-col gap-1.5">
                  {role.added.map((line) => (
                    <li key={line} className="flex gap-2 rounded bg-mint/[0.06] px-2 py-1 text-[0.8125rem] leading-snug">
                      <span className="shrink-0 text-mint" aria-hidden="true">
                        +
                      </span>
                      <span className="text-muted">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
