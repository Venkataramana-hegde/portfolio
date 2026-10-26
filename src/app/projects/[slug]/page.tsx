import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalIcon } from "@/components/ide/Icons";
import { FilePathNote, OpenFileLink } from "@/components/ide/PageBits";
import { projects } from "@/content/profile";
import { pageMetadata } from "@/lib/meta";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

async function load(params: PageProps<"/projects/[slug]">["params"]) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  return project;
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = await load(params);
  return pageMetadata(project.slug, project.summary);
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = await load(params);

  return (
    <article className="doc max-w-4xl">
      <FilePathNote cmd={project.slug} />

      <header className="flex flex-col gap-3">
        <h1>{project.name}</h1>
        <p className="text-[0.9375rem] text-muted">{project.tagline}</p>
        <p className="flex flex-wrap items-center gap-2">
          <span className="chip">{project.year}</span>
          {project.internal ? (
            <span className="chip">internal</span>
          ) : (
            <a href={project.href} target="_blank" rel="noopener noreferrer" className="btn btn-amber">
              Visit {project.hrefLabel}
              <ExternalIcon className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </p>
      </header>

      {project.image && (
        <figure className="overflow-hidden rounded-lg border border-line bg-panel">
          <figcaption className="flex items-center gap-2 border-b border-line px-3 py-2 text-[0.75rem] text-muted">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-rose/70" />
              <span className="size-2.5 rounded-full bg-amber/70" />
              <span className="size-2.5 rounded-full bg-mint/70" />
            </span>
            <span className="mx-auto">{project.hrefLabel}</span>
          </figcaption>
          <Image
            src={project.image}
            alt={`${project.name} home page`}
            width={1440}
            height={900}
            priority
            sizes="(min-width: 1024px) 56rem, 95vw"
            className="w-full"
          />
        </figure>
      )}

      <p>{project.summary}</p>

      <h2>What it does</h2>
      <ul className="flex flex-col gap-2">
        {project.points.map((point) => (
          <li key={point} className="flex gap-2 text-[0.875rem] text-muted">
            <span className="shrink-0 text-mint" aria-hidden="true">
              →
            </span>
            {point}
          </li>
        ))}
      </ul>

      {project.lighthouse && (
        <>
          <h2>Lighthouse</h2>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {project.lighthouse.map((l) => (
              <div key={l.label} className="flex flex-col gap-1 bg-panel px-4 py-3">
                <dd className="text-xl font-bold text-amber tabular-nums">{l.score}</dd>
                <dt className="text-[0.75rem] text-muted">{l.label}</dt>
              </div>
            ))}
          </dl>
        </>
      )}

      <h2>Built with</h2>
      <p className="flex flex-wrap gap-1.5">
        {project.stack.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </p>

      <p className="pt-4 text-[0.8125rem]">
        <OpenFileLink cmd="projects">← back to all projects</OpenFileLink>
      </p>
    </article>
  );
}
