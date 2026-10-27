"use client";

import { useState } from "react";
import { person, projects } from "@/content/profile";
import { searchIndex } from "@/content/search";
import { settingByKey } from "@/content/settings";
import { themes } from "@/content/themes";
import { findFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { useSettings } from "./settings-state";
import { useTheme } from "./theme-state";
import { SparkIcon } from "./Icons";

const button = "rounded border border-line bg-bg px-2 py-1 text-[0.6875rem] text-muted hover:border-amber hover:text-fg";

export function ApiPlayground() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/profile");
  const [sent, setSent] = useState(false);
  const [response, setResponse] = useState<unknown>(null);
  async function send() { const res = await fetch(path, { method }); setResponse(res.ok ? { status: res.status, body: await res.json() } : { status: res.status, error: "Request failed" }); setSent(true); }
  return <ToolShell title="API playground" subtitle="Send a safe, local request against portfolio data.">
    <div className="flex gap-1"><select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded border border-line bg-bg px-2 text-[0.75rem] text-amber"><option>GET</option><option>POST</option></select><input value={path} onChange={(e) => setPath(e.target.value)} className="min-w-0 flex-1 rounded border border-line bg-bg px-2 text-[0.75rem] text-fg" /><button className={button} onClick={send}>Send</button></div>
    <div className="mt-3 rounded border border-line bg-rail p-2"><div className="mb-1 text-[0.625rem] text-faint">200 OK · application/json</div><pre className="whitespace-pre-wrap text-[0.6875rem] text-mint">{sent ? JSON.stringify(response, null, 2) : "// press Send to run the request"}</pre></div>
  </ToolShell>;
}

export function DatabaseExplorer() {
  const [table, setTable] = useState("projects");
  const rows = table === "projects" ? projects.map((p) => ({ name: p.name, stack: p.stack.slice(0, 2).join(", "), type: p.internal ? "internal" : "shipped" })) : [{ name: person.name, stack: person.role, type: person.currentCompany }];
  return <ToolShell title="Database explorer" subtitle="Read-only sample tables from the portfolio model."><div className="flex gap-1"><button className={table === "projects" ? `${button} border-amber text-fg` : button} onClick={() => setTable("projects")}>projects</button><button className={table === "people" ? `${button} border-amber text-fg` : button} onClick={() => setTable("people")}>people</button></div><div className="mt-3 overflow-hidden rounded border border-line"><div className="grid grid-cols-3 bg-raise px-2 py-1 text-[0.625rem] text-faint"><span>name</span><span>stack / role</span><span>type</span></div>{rows.map((row) => <div key={row.name} className="grid grid-cols-3 border-t border-line px-2 py-2 text-[0.6875rem]"><span className="truncate text-fg">{row.name}</span><span className="truncate text-muted">{row.stack}</span><span className="truncate text-mint">{row.type}</span></div>)}</div></ToolShell>;
}

/* The quick switches, mirroring the most-used rows of settings.json. These
   drive the same store as the file, so flipping one here changes the file. */
export function IdeSettings() {
  const { settings, setSetting, isModified, resetSettings } = useSettings();
  const { theme, themeId, installed, setTheme } = useTheme();
  const { open, setPanel } = useIde();

  const quick = ["workbench.density", "workbench.sideBarLocation"] as const;
  const switches = ["editor.lineNumbers", "editor.fontLigatures", "workbench.reduceMotion", "workbench.statusBar"] as const;

  return (
    <ToolShell title="Settings" subtitle="Real switches. Each one changes this page immediately.">
      <label htmlFor="panel-theme" className="text-[0.6875rem] text-faint">
        Colour theme
      </label>
      <select
        id="panel-theme"
        value={themeId}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full rounded border border-line bg-bg px-2 py-1 text-[0.75rem] text-fg focus:border-amber focus:outline-none"
      >
        {themes.filter((t) => installed.includes(t.id)).map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button type="button" onClick={() => setPanel("extensions")} className="self-start text-[0.625rem] text-blue underline underline-offset-2">
        Install more themes
      </button>
      <p className="text-[0.625rem] text-faint">
        {theme.appearance === "light" ? "Light" : "Dark"} · by {theme.author}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {quick.map((key) => {
          const def = settingByKey.get(key)!;
          if (def.kind !== "enum") return null;
          return (
            <div key={key}>
              <p className="text-[0.6875rem] text-faint">{def.label}</p>
              <div className="mt-1 flex gap-1">
                {def.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={settings[key] === option}
                    onClick={() => setSetting(key, option as never)}
                    className={settings[key] === option ? `${button} border-amber text-fg` : button}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        {switches.map((key) => {
          const def = settingByKey.get(key)!;
          const value = settings[key] as boolean;
          return (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={value}
              onClick={() => setSetting(key, !value as never)}
              title={def.description}
              className="flex w-full items-center justify-between border-b border-line py-2 text-left text-[0.75rem] hover:text-fg"
            >
              <span className="text-muted">{def.label}</span>
              <span className={value ? "text-mint" : "text-faint"}>{value ? "on" : "off"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={button} onClick={() => open(findFile("settings")!)}>
          Open settings.json
        </button>
        {isModified && (
          <button type="button" className={button} onClick={resetSettings}>
            Reset
          </button>
        )}
      </div>
      <p className="pt-2 text-[0.625rem] text-faint">Saved in this browser only.</p>
    </ToolShell>
  );
}

export function PortfolioAssistant() {
  const [question, setQuestion] = useState(""); const [answer, setAnswer] = useState("Ask me about projects, experience, or how to get in touch.");
  function ask() { const q = question.toLowerCase(); const matches = searchIndex.filter((hit) => hit.text.toLowerCase().includes(q)).slice(0, 2); setAnswer(q.includes("contact") || q.includes("email") ? `You can reach ${person.givenName} at ${person.email}.` : matches.length ? `${matches.map((m) => `“${m.text}”`).join("\n")}\n\nSources: ${matches.map((m) => m.path).join(", ")}` : q.includes("project") ? `There are ${projects.length} projects in the workspace.` : `${person.name} is a ${person.role} at ${person.currentCompany}.`); }
  return <ToolShell title="AI portfolio assistant" subtitle="A local assistant grounded in the information on this site."><div className="rounded border border-line bg-rail p-2 text-[0.75rem] text-muted"><SparkIcon className="mb-1 size-4 text-amber" />{answer}</div><div className="mt-2 flex gap-1"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask about my work…" className="min-w-0 flex-1 rounded border border-line bg-bg px-2 text-[0.75rem] text-fg" /><button className={button} onClick={ask}>Ask</button></div></ToolShell>;
}

function ToolShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div className="flex flex-col gap-2 p-3"><h3 className="text-[0.8125rem] font-medium text-fg">{title}</h3><p className="text-[0.6875rem] text-faint">{subtitle}</p>{children}</div>; }
