"use client";

import { useEffect, useRef, useState } from "react";
import { experience, extensions, person, projects } from "@/content/profile";
import { files, filePath, findFile, tree, workspaceName, type WorkspaceFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { CloseIcon, TerminalIcon } from "./Icons";

type Entry = { id: number; kind: "in" | "out" | "err"; node: React.ReactNode };

const PROMPT = "visitor@portfolio";

const COMMANDS = [
  "help", "ls", "open", "cat", "cd", "whoami", "about", "projects", "skills",
  "git", "experience", "contact", "email", "resume", "github", "linkedin",
  "neofetch", "pwd", "date", "clear", "history", "sudo", "echo",
] as const;

const HELP: [string, string][] = [
  ["help", "show this list"],
  ["ls", "list the files in the workspace"],
  ["open <file>", "open a file, e.g. open about"],
  ["projects", "list everything I have shipped"],
  ["skills", "list my stack with experience levels"],
  ["git log", "my roles as commits"],
  ["whoami", "the short version"],
  ["neofetch", "system info, the usual"],
  ["contact / email", "ways to reach me"],
  ["resume", "open the PDF"],
  ["github / linkedin", "open a profile"],
  ["clear", "clear the screen"],
];

export function Terminal() {
  const { open, toggleTerminal } = useIde();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const nextId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (kind: Entry["kind"], node: React.ReactNode) =>
    setEntries((list) => [...list, { id: nextId.current++, kind, node }]);

  /** A file name in terminal output that opens the file when clicked. */
  function FileLink({ file, label }: { file: WorkspaceFile; label?: string }) {
    return (
      <button
        type="button"
        onClick={() => open(file)}
        className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
      >
        {label ?? filePath(file)}
      </button>
    );
  }

  function run(raw: string) {
    const line = raw.trim();
    push("in", line);
    if (!line) return;

    const [head, ...rest] = line.split(/\s+/);
    const cmd = head.toLowerCase();
    const arg = rest.join(" ");
    const argLower = arg.toLowerCase();

    const openByName = (name: string, verb: string) => {
      const file = findFile(name);
      if (!file) {
        push("err", `${verb}: ${name}: no such file. Run ls to see what is here.`);
        return;
      }
      open(file);
      push("out", (
        <span>
          opening <FileLink file={file} />
          {file.external && <span className="text-muted"> in a new tab</span>}
        </span>
      ));
    };

    switch (cmd) {
      case "help":
      case "?":
        push("out", (
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-[13rem_1fr]">
            {HELP.map(([c, d]) => (
              <span key={c} className="contents">
                <span className="text-amber">{c}</span>
                <span className="text-muted">{d}</span>
              </span>
            ))}
          </div>
        ));
        break;

      case "ls":
      case "dir":
        push("out", (
          <div className="flex flex-col gap-2">
            {tree.map((folder) => (
              <div key={folder.dir}>
                <span className="text-purple">{folder.dir}/</span>
                <div className="flex flex-wrap gap-x-5 gap-y-0.5 pl-4">
                  {folder.items.map((f) => (
                    <FileLink key={f.href} file={f} label={f.name} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-x-5">
              {files.filter((f) => !f.dir).map((f) => (
                <FileLink key={f.href} file={f} label={f.name} />
              ))}
            </div>
          </div>
        ));
        break;

      case "open":
      case "cat":
      case "cd":
      case "code":
      case "vim":
      case "nano":
        if (!arg) push("err", `${cmd}: which file? Try: ${cmd} about`);
        else openByName(arg, cmd);
        break;

      case "whoami":
        push("out", (
          <div className="flex flex-col">
            <span className="text-fg">{person.name}</span>
            <span className="text-muted">
              {person.role}, {person.location}. Currently at {person.currentCompany}.
            </span>
            <span className="text-faint">
              Type <span className="text-amber">help</span> for commands, or press Ctrl+K to jump to a file.
            </span>
          </div>
        ));
        break;

      case "projects": {
        push("out", (
          <div className="flex flex-col gap-0.5">
            {projects.map((p) => {
              const file = findFile(p.slug)!;
              return (
                <span key={p.slug} className="flex flex-wrap items-baseline gap-x-2">
                  <FileLink file={file} label={p.name} />
                  <span className="text-faint">{p.internal ? "internal" : p.hrefLabel}</span>
                  <span className="text-muted">{p.stack.join(" ")}</span>
                </span>
              );
            })}
          </div>
        ));
        break;
      }

      case "skills":
      case "stack": {
        const list = argLower
          ? extensions.filter((e) => e.category.toLowerCase().includes(argLower) || e.name.toLowerCase().includes(argLower))
          : extensions;
        if (!list.length) {
          push("err", `skills: nothing matches "${arg}". Try: skills backend`);
          break;
        }
        push("out", (
          <div className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[9rem_auto_1fr]">
            {list.map((e) => (
              <span key={e.id} className="contents">
                <span style={{ color: e.color }}>{e.name}</span>
                <span className="text-amber" aria-label={`${e.level} out of 5`}>
                  {"█".repeat(e.level)}
                  <span className="text-faint">{"░".repeat(5 - e.level)}</span>
                </span>
                <span className="text-muted">{e.blurb}</span>
              </span>
            ))}
          </div>
        ));
        break;
      }

      case "git":
        if (argLower && !argLower.startsWith("log")) {
          push("err", `git: ${arg} is not supported here. Try: git log`);
          break;
        }
      // falls through to the log
      case "experience":
      case "log": {
        const file = findFile("experience")!;
        push("out", (
          <div className="flex flex-col gap-2">
            {experience.map((role) => (
              <div key={role.id} className="flex flex-col">
                <span>
                  <span className="text-amber">commit {role.hash}</span>
                  {role.current && <span className="text-mint"> (HEAD -&gt; main)</span>}
                </span>
                <span className="text-muted">
                  Date: {role.start} to {role.end}
                </span>
                <span className="pl-4 text-fg">{role.title}</span>
                <span className="pl-4 text-muted">{role.company}</span>
              </div>
            ))}
            <span className="text-faint">
              Full log in <FileLink file={file} />
            </span>
          </div>
        ));
        break;
      }

      case "contact":
        openByName("contact", "open");
        break;

      case "about":
        openByName("about", "open");
        break;

      case "resume":
      case "cv":
        openByName("resume", "open");
        break;

      case "email":
        push("out", (
          <a href={`mailto:${person.email}`} className="text-mint underline underline-offset-2">
            {person.email}
          </a>
        ));
        break;

      case "github":
      case "linkedin": {
        const href = cmd === "github" ? person.github : person.linkedin;
        window.open(href, "_blank", "noopener,noreferrer");
        push("out", (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-mint underline underline-offset-2">
            {href}
          </a>
        ));
        break;
      }

      case "neofetch":
        push("out", (
          <div className="flex flex-wrap gap-6">
            <pre className="text-amber leading-tight" aria-hidden="true">{`   ▄▄▄▄▄▄▄
  █ ▄▄▄ █
  █ ███ █
  █▄▄▄▄▄█
  ▄▄ ▄▄▄▄▄
  █▄█▄█▄█▄█`}</pre>
            <div className="grid grid-cols-[7rem_1fr] gap-x-3">
              {[
                ["user", person.handle],
                ["role", person.role],
                ["company", person.currentCompany],
                ["location", person.location],
                ["languages", "TypeScript, JavaScript"],
                ["runtime", "Node.js"],
                ["db", "MongoDB, Supabase"],
                ["editor", "VS Code"],
                ["uptime", "3 roles since Feb 2025"],
              ].map(([k, v]) => (
                <span key={k} className="contents">
                  <span className="text-amber">{k}</span>
                  <span className="text-muted">{v}</span>
                </span>
              ))}
            </div>
          </div>
        ));
        break;

      case "pwd":
        push("out", `/${workspaceName}`);
        break;

      case "date":
        push("out", new Date().toString());
        break;

      case "history":
        push("out", history.length ? history.map((h, i) => `${i + 1}  ${h}`).join("\n") : "nothing yet");
        break;

      case "echo":
        push("out", arg);
        break;

      case "clear":
      case "cls":
        setEntries([]);
        break;

      case "sudo":
        push("err", "sudo: permission denied. Asking nicely works better: type contact");
        break;

      case "exit":
      case "q":
        toggleTerminal();
        break;

      default:
        push("err", (
          <span>
            {cmd}: command not found. Type <span className="text-amber">help</span> to see what works.
          </span>
        ));
    }
  }

  function complete() {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const hits = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (hits.length === 1) setInput(`${hits[0]} `);
      else if (hits.length > 1) push("out", hits.join("   "));
      return;
    }
    const q = parts.slice(1).join(" ").toLowerCase();
    const hits = files.filter((f) => f.cmd.startsWith(q) || f.name.toLowerCase().startsWith(q));
    if (hits.length === 1) setInput(`${parts[0]} ${hits[0].cmd}`);
    else if (hits.length > 1) push("out", hits.map((f) => f.cmd).join("   "));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input);
      if (input.trim()) setHistory((h) => [...h, input.trim()]);
      setInput("");
      setCursor(-1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown" && cursor !== -1) {
      e.preventDefault();
      const next = cursor + 1;
      setCursor(next >= history.length ? -1 : next);
      setInput(next >= history.length ? "" : history[next]);
    } else if (e.key.toLowerCase() === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  }

  // Greet on first open so the panel is never an empty black box.
  useEffect(() => {
    push("out", (
      <div className="flex flex-col">
        <span className="text-mint">{person.name} — {person.role}</span>
        <span className="text-muted">
          This terminal works. Try <span className="text-amber">help</span>, <span className="text-amber">ls</span>,{" "}
          <span className="text-amber">projects</span> or <span className="text-amber">neofetch</span>.
        </span>
      </div>
    ));
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
  }, [entries]);

  return (
    <section className="flex h-full flex-col bg-panel" aria-label="Terminal">
      <div className="flex h-9 shrink-0 items-center gap-4 border-b border-line px-3">
        <span className="flex items-center gap-2 text-[0.75rem] font-semibold text-fg">
          <TerminalIcon className="size-4" />
          Terminal
        </span>
        <span className="hidden text-[0.75rem] text-faint sm:inline">
          bash — type <span className="text-amber">help</span> · Tab completes · ↑ repeats
        </span>
        <button
          type="button"
          onClick={toggleTerminal}
          aria-label="Close terminal"
          className="ml-auto grid size-7 place-items-center rounded text-muted hover:bg-raise hover:text-fg"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div
        ref={bodyRef}
        onClick={(e) => {
          // Clicking blank space focuses the prompt, but keep links clickable.
          if ((e.target as HTMLElement).closest("a,button")) return;
          inputRef.current?.focus({ preventScroll: true });
        }}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-2 text-[0.8125rem] leading-relaxed"
      >
        <div role="log" aria-live="polite" aria-label="Terminal output" className="flex flex-col gap-1.5">
          {entries.map((entry) =>
            entry.kind === "in" ? (
              <p key={entry.id} className="term-line">
                <span className="text-mint">{PROMPT}</span>
                <span className="text-muted">:~$ </span>
                <span className="text-fg">{entry.node}</span>
              </p>
            ) : (
              <div key={entry.id} className={`term-line ${entry.kind === "err" ? "text-rose" : "text-fg"}`}>
                {entry.node}
              </div>
            ),
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <label htmlFor="terminal-input" className="shrink-0">
            <span className="text-mint">{PROMPT}</span>
            <span className="text-muted">:~$</span>
            <span className="sr-only">Terminal command</span>
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="type help"
            className="min-w-0 flex-1 bg-transparent text-fg caret-amber outline-none placeholder:text-faint"
          />
        </div>
      </div>
    </section>
  );
}
