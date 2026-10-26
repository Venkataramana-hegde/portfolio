import { certifications, education, experience, extensions, person, projects } from "./profile";
import { filePath, findFile, type WorkspaceFile } from "./workspace";

/* Every searchable line on the site, each pointing at the file that holds it.
   Built once at module load from the same data the pages render. */

export type Hit = { file: WorkspaceFile; path: string; text: string };

const file = (cmd: string) => findFile(cmd)!;

export const searchIndex: Hit[] = [
  { file: file("hello"), text: person.summary },
  ...experience.flatMap((role) => [
    { file: file("experience"), text: `${role.title} — ${role.company}, ${role.start} to ${role.end}` },
    ...role.added.map((text) => ({ file: file("experience"), text })),
  ]),
  ...projects.flatMap((p) => [
    { file: file(p.slug), text: `${p.name} — ${p.summary}` },
    ...p.points.map((text) => ({ file: file(p.slug), text })),
    { file: file(p.slug), text: p.stack.join(", ") },
  ]),
  ...extensions.map((e) => ({ file: file("about"), text: `${e.name} — ${e.blurb}` })),
  ...education.map((e) => ({ file: file("about"), text: `${e.degree}, ${e.school}, ${e.result}` })),
  ...certifications.map((c) => ({ file: file("about"), text: `${c.name}, ${c.issuer}, ${c.year}` })),
].map((hit) => ({ ...hit, path: filePath(hit.file) }));

export function search(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return searchIndex.filter((hit) => hit.text.toLowerCase().includes(q));
}
