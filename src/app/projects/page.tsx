import Image from "next/image";
import { FilePathNote, OpenFileLink } from "@/components/ide/PageBits";
import { ExternalIcon } from "@/components/ide/Icons";
import { projects } from "@/content/profile";
import { pageMetadata } from "@/lib/meta";

export const metadata = pageMetadata("projects", "Public sites and the internal systems I build at Helpee Elder Care.");

export default function Projects() {
  const live = projects.filter((p) => !p.internal);
  const internal = projects.filter((p) => p.internal);

  return (
    <article className="doc max-w-5xl">
      <FilePathNote cmd="projects" />
      <h1>Projects</h1>
      <p>
        Two public sites you can open, and four internal systems I build at Helpee Elder Care. Open any file to read
        what it does.
      </p>

      <h2>Live sites</h2>
      <ul className="grid gap-5 sm:grid-cols-2">
        {live.map((p) => (
          <li key={p.slug} className="group overflow-hidden rounded-lg border border-line bg-panel transition-colors hover:border-faint">
            {p.image && (
              <Image
                src={p.image}
                alt={`${p.name} home page`}
                width={1440}
                height={900}
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 45vw, 90vw"
                className="aspect-16/10 w-full border-b border-line object-cover object-top"
              />
            )}
            <div className="flex flex-col gap-2 p-4">
              <h3 className="text-[0.9375rem] text-fg">
                <OpenFileLink cmd={p.slug}>{p.name}</OpenFileLink>
              </h3>
              <p className="text-[0.8125rem] text-muted">{p.tagline}</p>
              <p className="flex flex-wrap gap-1.5 pt-1">
                {p.stack.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </p>
              {p.href && (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-1.5 pt-1 text-[0.75rem] text-mint hover:underline"
                >
                  {p.hrefLabel}
                  <ExternalIcon className="size-3" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2>Internal systems</h2>
      <p className="text-[0.8125rem]">
        Built at Helpee Elder Care. These run behind a login, so there is no public link — the write-ups explain what
        each one does.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {internal.map((p) => (
          <li key={p.slug} className="rounded-lg border border-line bg-panel p-4 transition-colors hover:border-faint">
            <h3 className="text-[0.9375rem] text-fg">
              <OpenFileLink cmd={p.slug}>{p.name}</OpenFileLink>
            </h3>
            <p className="pt-1 text-[0.8125rem] text-muted">{p.tagline}</p>
            <p className="flex flex-wrap gap-1.5 pt-3">
              {p.stack.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </article>
  );
}
