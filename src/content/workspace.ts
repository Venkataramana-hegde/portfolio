import { projects } from "./profile";

/* The site as a workspace. Every route is a file; the explorer, the tabs, the
   terminal and the command palette all read this one list. */

export type Lang = "tsx" | "md" | "log" | "ts" | "json" | "pdf";

export type WorkspaceFile = {
  /** File name as shown in the explorer and tabs. */
  name: string;
  /** Folder it sits in, or undefined for the workspace root. */
  dir?: string;
  href: string;
  lang: Lang;
  /** Short name the terminal accepts, e.g. `open about`. */
  cmd: string;
  /** Page title and one-line description, used in metadata and the palette. */
  title: string;
  blurb: string;
  /** Opens in a new tab instead of routing. */
  external?: boolean;
};

export const workspaceName = "venkataramana-hegde";

export const files: WorkspaceFile[] = [
  { name: "_hello.tsx", dir: "src", href: "/", lang: "tsx", cmd: "hello", title: "Hello", blurb: "Who I am and what I build" },
  { name: "_about-me.md", dir: "src", href: "/about", lang: "md", cmd: "about", title: "About me", blurb: "Background, education and certifications" },
  { name: "_experience.log", dir: "src", href: "/experience", lang: "log", cmd: "experience", title: "Experience", blurb: "Every role as a commit, newest first" },
  { name: "_contact-me.ts", dir: "src", href: "/contact", lang: "ts", cmd: "contact", title: "Contact me", blurb: "Email, LinkedIn and GitHub" },
  { name: "_projects.json", dir: "src/projects", href: "/projects", lang: "json", cmd: "projects", title: "Projects", blurb: "Everything I have shipped" },
  ...projects.map(
    (p): WorkspaceFile => ({
      name: `${p.slug}.tsx`,
      dir: "src/projects",
      href: `/projects/${p.slug}`,
      lang: "tsx",
      cmd: p.slug,
      title: p.name,
      blurb: p.tagline,
    }),
  ),
  { name: "settings.json", dir: ".vscode", href: "/settings", lang: "json", cmd: "settings", title: "Settings", blurb: "Workspace settings that really apply" },
  { name: "resume.pdf", href: "/venkataramana-hegde-resume.pdf", lang: "pdf", cmd: "resume", title: "Résumé", blurb: "One-page PDF", external: true },
];

/** The always-open tabs, in the order they appear across the top. */
const NAV_ORDER = ["hello", "about", "experience", "projects", "contact"];

export const navFiles = NAV_ORDER.map((cmd) => files.find((f) => f.cmd === cmd)!);

export const pageFiles = files.filter((f) => !f.external);

export const filePath = (f: WorkspaceFile) => (f.dir ? `${f.dir}/${f.name}` : f.name);

export const fileForPath = (pathname: string) => pageFiles.find((f) => f.href === pathname);

export const findFile = (query: string) => {
  const q = query.toLowerCase().replace(/^\.?\//, "");
  return (
    files.find((f) => f.cmd === q) ??
    files.find((f) => f.name.toLowerCase() === q || filePath(f).toLowerCase() === q) ??
    files.find((f) => filePath(f).toLowerCase().includes(q))
  );
};

/** Folders in explorer order, each with the files inside it. */
export const tree = [
  { dir: "src", items: files.filter((f) => f.dir === "src") },
  { dir: "src/projects", items: files.filter((f) => f.dir === "src/projects") },
  { dir: ".vscode", items: files.filter((f) => f.dir === ".vscode") },
];

export const rootFiles = files.filter((f) => !f.dir);

export const langLabel: Record<Lang, string> = {
  tsx: "TypeScript JSX",
  ts: "TypeScript",
  md: "Markdown",
  log: "Log",
  json: "JSON",
  pdf: "PDF",
};

/** File-type marks, coloured the way an editor badges files. */
export const langMark: Record<Lang, { text: string; color: string }> = {
  tsx: { text: "TS", color: "var(--blue)" },
  ts: { text: "TS", color: "var(--blue)" },
  md: { text: "MD", color: "var(--mint)" },
  log: { text: "LOG", color: "var(--purple)" },
  json: { text: "{ }", color: "var(--amber)" },
  pdf: { text: "PDF", color: "var(--rose)" },
};
