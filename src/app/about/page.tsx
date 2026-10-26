import { FilePathNote, PanelLink } from "@/components/ide/PageBits";
import { certifications, education, interests, person } from "@/content/profile";
import { pageMetadata } from "@/lib/meta";

export const metadata = pageMetadata("about", `${person.summary} Background, education and certifications.`);

export default function About() {
  return (
    <article className="doc">
      <FilePathNote cmd="about" />
      <h1>About me</h1>

      <p>
        I&apos;m <strong>{person.name}</strong>, a full-stack engineer in {person.city}. I work at{" "}
        <strong>{person.currentCompany}</strong>, where the software I build is used by the people running elder care
        every day: the reports they read in the morning, the invoices they send, the attendance they approve and the
        calls they answer.
      </p>
      <p>
        I started there as an intern in June 2025 and now own the reporting platform end to end. Most of what I build is
        internal, which means my users sit a few desks away and tell me straight away when a screen is slow or a number
        looks wrong. That has shaped how I work more than anything else.
      </p>

      <h2>What I care about</h2>
      <ul className="flex flex-col gap-2">
        {interests.map((item) => (
          <li key={item} className="flex gap-2 text-muted">
            <span className="text-mint" aria-hidden="true">
              →
            </span>
            {item}
          </li>
        ))}
      </ul>

      <h2>Stack</h2>
      <p>
        TypeScript, React, Next.js, Node.js, GraphQL and MongoDB are what I reach for. The{" "}
        <PanelLink panel="extensions">extensions panel</PanelLink> has the full list with how long I&apos;ve used each
        one.
      </p>

      <h2>Education</h2>
      <ul className="flex flex-col gap-3">
        {education.map((e) => (
          <li key={e.school} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line pb-3">
            <span>
              <span className="block text-fg">{e.school}</span>
              <span className="block text-[0.8125rem] text-muted">
                {e.degree} · {e.result} · {e.place}
              </span>
            </span>
            <span className="text-[0.8125rem] text-faint tabular-nums">{e.years}</span>
          </li>
        ))}
      </ul>

      <h2>Certifications</h2>
      <ul className="flex flex-col gap-2">
        {certifications.map((c) => (
          <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-x-4 text-[0.875rem]">
            <span className="text-muted">
              <span className="text-fg">{c.name}</span> — {c.issuer}
            </span>
            <span className="text-faint tabular-nums">{c.year}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
