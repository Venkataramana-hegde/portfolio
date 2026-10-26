import type { Metadata } from "next";
import { CodeBlock, type Tok } from "@/components/ide/Code";
import { OpenFileLink, QuickActions } from "@/components/ide/PageBits";
import { person, stats } from "@/content/profile";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

/* The snippet in the hero panel is the shape of the access-filter layer I
   built at Helpee: one place decides which rows a role may read. */
const snippet: Tok[][] = [
  [["com", "// every report and every scheduled email goes through here"]],
  [["key", "export async function "], ["fn", "runReport"], ["punc", "("]],
  [["txt", "  "], ["prop", "report"], ["punc", ": "], ["txt", "ReportConfig"], ["punc", ","]],
  [["txt", "  "], ["prop", "viewer"], ["punc", ": "], ["txt", "Viewer"], ["punc", ","]],
  [["punc", ") {"]],
  [["txt", "  "], ["key", "const "], ["txt", "scope "], ["punc", "= "], ["fn", "accessFilter"], ["punc", "("], ["prop", "viewer"], ["punc", "."], ["prop", "roles"], ["punc", ");"]],
  [],
  [["txt", "  "], ["com", "// rows the viewer may not see never leave the database"]],
  [["txt", "  "], ["key", "return "], ["prop", "db"], ["punc", "."], ["fn", "aggregate"], ["punc", "(["]],
  [["txt", "    { "], ["prop", "$match"], ["punc", ": { ..."], ["txt", "report"], ["punc", "."], ["prop", "filters"], ["punc", ", ..."], ["txt", "scope "], ["punc", "} },"]],
  [["txt", "    ..."], ["txt", "report"], ["punc", "."], ["prop", "pipeline"], ["punc", ","]],
  [["txt", "  "], ["punc", "]);"]],
  [["punc", "}"]],
];

export default function Hello() {
  return (
    <div className="relative px-5 py-10 md:px-10 md:py-14">
      <span className="glow top-0 -left-20 size-72 bg-blue/25" aria-hidden="true" />
      <span className="glow right-0 bottom-10 size-80 bg-mint/15" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col gap-5">
          <p className="rise text-[0.9375rem] text-muted">Hi all. I am</p>
          <h1 className="rise text-[clamp(2.5rem,7vw,4.25rem)] leading-[1.05] font-bold tracking-tight" style={{ "--d": "60ms" } as React.CSSProperties}>
            {person.name}
          </h1>
          <p className="rise text-[clamp(1.125rem,3vw,1.5rem)] text-blue" style={{ "--d": "120ms" } as React.CSSProperties}>
            <span className="text-muted">&gt; </span>
            {person.role}
            <span className="caret ml-1" aria-hidden="true" />
          </p>

          <div className="rise flex max-w-xl flex-col gap-1 pt-2 text-[0.8125rem]" style={{ "--d": "180ms" } as React.CSSProperties}>
            <p className="text-faint">{"// I build the reporting, billing and care-operations"}</p>
            <p className="text-faint">{`// software that runs ${person.currentCompany}.`}</p>
            <p className="text-faint">
              {"// open a file to read more: "}
              <OpenFileLink cmd="projects">projects</OpenFileLink>
              <span className="text-faint"> · </span>
              <OpenFileLink cmd="experience">experience</OpenFileLink>
            </p>
          </div>

          <div className="rise pt-2" style={{ "--d": "240ms" } as React.CSSProperties}>
            <QuickActions />
          </div>
        </div>

        {/* The panel the reference puts a game in; here it is the system I own. */}
        <figure className="rise relative" style={{ "--d": "300ms" } as React.CSSProperties}>
          <span className="glow -inset-6 bg-blue/20" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
            <figcaption className="flex items-center gap-2 border-b border-line px-3 py-2 text-[0.75rem] text-muted">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-rose/70" />
                <span className="size-2.5 rounded-full bg-amber/70" />
                <span className="size-2.5 rounded-full bg-mint/70" />
              </span>
              <span className="mx-auto">reporting/run-report.ts</span>
            </figcaption>
            <div className="px-2 py-3">
              <CodeBlock lines={snippet} label="Access filter snippet from the reporting platform" />
            </div>
          </div>
        </figure>
      </div>

      <dl className="relative mx-auto mt-12 grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-panel px-4 py-4">
            <dd className="text-2xl font-bold tracking-tight text-amber tabular-nums">{s.value}</dd>
            <dt className="text-[0.75rem] text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
