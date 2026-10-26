"use client";

import { useState } from "react";
import { person, site } from "@/content/profile";
import { filePath, rootFiles, tree, workspaceName, type WorkspaceFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { ChevronIcon, ExternalIcon, FileMark, GitHubIcon, LinkedInIcon, MailIcon } from "./Icons";

function Row({ file, depth }: { file: WorkspaceFile; depth: number }) {
  const { open, pathname } = useIde();
  const active = file.href === pathname;
  return (
    <button
      type="button"
      onClick={() => open(file)}
      aria-current={active ? "page" : undefined}
      title={filePath(file)}
      className={`flex h-8 w-full items-center gap-1 pr-2 text-left text-[0.8125rem] transition-colors ${
        active ? "bg-raise text-fg" : "text-muted hover:bg-raise/60 hover:text-fg"
      }`}
      style={{ paddingLeft: `${0.5 + depth * 0.85}rem` }}
    >
      <FileMark lang={file.lang} />
      <span className="truncate">{file.name}</span>
      {file.external && <ExternalIcon className="ml-auto size-3.5 shrink-0 text-faint" />}
      {active && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-amber" aria-hidden="true" />}
    </button>
  );
}

function Folder({ name, depth, children }: { name: string; depth: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-1 text-left text-[0.8125rem] font-medium text-fg hover:bg-raise/60"
        style={{ paddingLeft: `${0.125 + depth * 0.85}rem` }}
      >
        <ChevronIcon className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="truncate">{name}</span>
      </button>
      {open && children}
    </div>
  );
}

export function Explorer() {
  return (
    <div className="flex flex-col pb-4">
      <Folder name={workspaceName} depth={0}>
        {tree.map((folder) => (
          <Folder key={folder.dir} name={folder.dir.split("/").pop()!} depth={1}>
            {folder.items.map((f) => (
              <Row key={f.href} file={f} depth={3} />
            ))}
          </Folder>
        ))}
        {rootFiles.map((f) => (
          <Row key={f.href} file={f} depth={2} />
        ))}
      </Folder>

      {/* A quiet contact block, so the panel is useful even without navigating. */}
      <div className="mt-4 border-t border-line pt-3">
        <p className="px-3 pb-1 text-[0.6875rem] text-faint">CONTACT</p>
        <a href={`mailto:${person.email}`} className="flex h-8 items-center gap-2 px-3 text-[0.8125rem] text-muted hover:bg-raise/60 hover:text-fg">
          <MailIcon className="size-3.5 shrink-0" />
          <span className="truncate">{person.email}</span>
        </a>
        <a href={person.github} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-2 px-3 text-[0.8125rem] text-muted hover:bg-raise/60 hover:text-fg">
          <GitHubIcon className="size-3.5 shrink-0" />
          GitHub
          <ExternalIcon className="ml-auto size-3 text-faint" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-2 px-3 text-[0.8125rem] text-muted hover:bg-raise/60 hover:text-fg">
          <LinkedInIcon className="size-3.5 shrink-0" />
          LinkedIn
          <ExternalIcon className="ml-auto size-3 text-faint" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a href={site.resumePath} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-2 px-3 text-[0.8125rem] text-muted hover:bg-raise/60 hover:text-fg">
          <FileMark lang="pdf" className="!w-3.5" />
          Résumé
          <ExternalIcon className="ml-auto size-3 text-faint" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
