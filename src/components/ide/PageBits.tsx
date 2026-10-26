"use client";

import { person, site } from "@/content/profile";
import { filePath, findFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { DownloadIcon, GitHubIcon, LinkedInIcon, MailIcon, TerminalIcon } from "./Icons";

/** Opens a workspace file by its short command name, from inside page content. */
export function OpenFileLink({ cmd, children }: { cmd: string; children: React.ReactNode }) {
  const { open } = useIde();
  const file = findFile(cmd);
  if (!file) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={() => open(file)}
      className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
    >
      {children}
    </button>
  );
}

/** The main calls to action, used on the hello and contact pages. */
export function QuickActions() {
  const { setPanel, setTerminalOpen } = useIde();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`mailto:${person.email}`} className="btn btn-amber">
        <MailIcon className="size-4" />
        Email me
      </a>
      <a href={site.resumePath} target="_blank" rel="noopener noreferrer" className="btn">
        <DownloadIcon className="size-4" />
        Résumé
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <a href={person.github} target="_blank" rel="noopener noreferrer" className="btn">
        <GitHubIcon className="size-4" />
        GitHub
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
        <LinkedInIcon className="size-4" />
        LinkedIn
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <button
        type="button"
        onClick={() => {
          setTerminalOpen(true);
          setPanel("explorer");
          document.getElementById("terminal-input")?.focus();
        }}
        className="btn"
      >
        <TerminalIcon className="size-4" />
        Try the terminal
      </button>
    </div>
  );
}

/** Jumps to a side panel from inside page content. */
export function PanelLink({ panel, children }: { panel: "git" | "extensions" | "search"; children: React.ReactNode }) {
  const { setPanel, openDrawer } = useIde();
  return (
    <button
      type="button"
      onClick={() => {
        setPanel(panel);
        if (window.matchMedia("(max-width: 767px)").matches) openDrawer(panel);
      }}
      className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
    >
      {children}
    </button>
  );
}

/** The file's own path, shown as a comment above each page title. */
export function FilePathNote({ cmd }: { cmd: string }) {
  const file = findFile(cmd);
  return <p className="note">{file ? filePath(file) : cmd}</p>;
}
