"use client";

import { useState } from "react";
import { settingDefs, settingGroups, settingsJson, type SettingDef } from "@/content/settings";
import { themeById, themes } from "@/content/themes";
import { useSettings } from "./settings-state";
import { useTheme } from "./theme-state";

/* settings.json, the way an editor shows it: the form on the left and the file
   on the right, both editing the same store. Typing valid JSON applies it
   immediately — the same live-preview idea as the contact form, except here the
   thing being previewed is the workspace you are sitting in. */

function Toggle({ def, value, onChange }: { def: SettingDef; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-11 shrink-0 items-center rounded-full border border-line bg-bg p-0.5 transition-colors aria-checked:border-mint/60 aria-checked:bg-mint/20"
    >
      <span
        className={`size-4 rounded-full transition-transform ${value ? "translate-x-5 bg-mint" : "bg-faint"}`}
        aria-hidden="true"
      />
      <span className="sr-only">{def.label}</span>
    </button>
  );
}

function Row({ def }: { def: SettingDef }) {
  const { settings, setSetting } = useSettings();
  const value = settings[def.key];
  const id = `set-${def.key.replace(".", "-")}`;
  const changed = value !== def.default;

  return (
    <div className="flex flex-col gap-1.5 border-b border-line py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={id} className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-fg">
            {def.label}
            {changed && (
              <span className="rounded bg-amber/15 px-1 text-[0.5625rem] tracking-wide text-amber uppercase">
                modified
              </span>
            )}
          </label>
          <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted">{def.description}</p>
          <code className="text-[0.625rem] text-faint">{def.key}</code>
        </div>

        {def.kind === "boolean" && (
          <Toggle def={def} value={value as boolean} onChange={(v) => setSetting(def.key, v as never)} />
        )}
      </div>

      {def.kind === "number" && (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="range"
            min={def.min}
            max={def.max}
            step={def.step}
            value={value as number}
            onChange={(e) => setSetting(def.key, Number(e.target.value) as never)}
            className="h-1 min-w-0 flex-1 accent-[var(--amber)]"
          />
          <output className="w-16 shrink-0 text-right text-[0.75rem] text-mint">
            {value}
            {def.unit}
          </output>
        </div>
      )}

      {def.kind === "enum" && (
        <div className="flex flex-wrap gap-1" role="group" aria-labelledby={id}>
          {def.options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={value === option}
              onClick={() => setSetting(def.key, option as never)}
              className={`rounded px-2 py-0.5 text-[0.6875rem] transition-colors ${
                value === option ? "bg-amber text-amber-ink" : "border border-line text-muted hover:text-fg"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Colour theme is stored by the theme registry, but it belongs in this file. */
function ThemeRow() {
  const { themeId, installed, setTheme } = useTheme();
  return (
    <div className="flex flex-col gap-1.5 border-b border-line py-3">
      <label htmlFor="set-theme" className="text-[0.8125rem] text-fg">
        Colour theme
      </label>
      <p className="text-[0.6875rem] leading-snug text-muted">
        Only installed themes are listed. Install more from the Extensions panel.
      </p>
      <code className="text-[0.625rem] text-faint">workbench.colorTheme</code>
      <select
        id="set-theme"
        value={themeId}
        onChange={(e) => setTheme(e.target.value)}
        className="mt-1 rounded border border-line bg-bg px-2 py-1 text-[0.75rem] text-fg focus:border-amber focus:outline-none"
      >
        {themes
          .filter((t) => installed.includes(t.id))
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.appearance})
            </option>
          ))}
      </select>
    </div>
  );
}

type Status = { kind: "clean" } | { kind: "applied" } | { kind: "error"; message: string };

export function SettingsEditor() {
  const { settings, replaceSettings, resetSettings, isModified } = useSettings();
  const { themeId, installed, setTheme } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "clean" });

  const canonical = settingsJson(settings, themeId);
  const text = draft ?? canonical;

  function onEdit(next: string) {
    setDraft(next);
    let parsed: unknown;
    try {
      parsed = JSON.parse(next);
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Invalid JSON" });
      return;
    }

    // The theme lives in the other store, so it is pulled out before coercing.
    const body = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
    const wanted = body["workbench.colorTheme"];
    if (typeof wanted === "string" && wanted !== themeId) {
      if (!themes.some((t) => t.id === wanted)) {
        setStatus({ kind: "error", message: `No theme with id "${wanted}".` });
        return;
      }
      if (!installed.includes(wanted)) {
        setStatus({ kind: "error", message: `"${themeById(wanted).name}" is not installed yet.` });
        return;
      }
      setTheme(wanted);
    }

    replaceSettings(body);
    setStatus({ kind: "applied" });
  }

  const unknownKeys = (() => {
    try {
      const body = JSON.parse(text) as Record<string, unknown>;
      const known = new Set<string>([...settingDefs.map((d) => d.key), "workbench.colorTheme"]);
      return Object.keys(body).filter((k) => !known.has(k));
    } catch {
      return [];
    }
  })();

  return (
    <div className="flex flex-col gap-6 px-5 py-8 pb-16 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="note">.vscode/settings.json — every switch here changes this page as you use it</p>
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Settings</h1>
        <p className="max-w-[68ch] text-muted">
          A real settings file. The form and the JSON are two views of the same store, saved to this browser only.
          Nothing here is a placeholder: if a switch exists, the thing it controls exists.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* ------------------------------------------------------------ form */}
        <section aria-label="Settings form" className="min-w-0">
          {settingGroups.map((group) => (
            <div key={group} className="mb-4">
              <h2 className="sticky top-0 z-10 bg-bg py-2 text-[0.6875rem] font-semibold tracking-wide text-faint uppercase">
                {group}
              </h2>
              {group === "Workbench" && <ThemeRow />}
              {settingDefs.filter((d) => d.group === group).map((def) => (
                <Row key={def.key} def={def} />
              ))}
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              resetSettings();
              setDraft(null);
              setStatus({ kind: "clean" });
            }}
            disabled={!isModified}
            className="btn mt-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset to defaults
          </button>
        </section>

        {/* ------------------------------------------------------------ json */}
        <section aria-label="settings.json" className="min-w-0 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded border border-line">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-panel px-3 py-1.5">
              <span className="text-[0.6875rem] text-muted">.vscode/settings.json</span>
              <div className="flex items-center gap-2">
                {draft !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setStatus({ kind: "clean" });
                    }}
                    className="text-[0.625rem] text-faint hover:text-fg"
                  >
                    Reformat
                  </button>
                )}
                <span className="text-[0.625rem] text-faint">JSON</span>
              </div>
            </div>

            <label htmlFor="settings-json" className="sr-only">
              Edit settings.json directly
            </label>
            <textarea
              id="settings-json"
              value={text}
              onChange={(e) => onEdit(e.target.value)}
              spellCheck={false}
              rows={text.split("\n").length + 1}
              className="w-full resize-y bg-bg px-3 py-2 font-mono text-[0.75rem] leading-relaxed text-fg focus:outline-none"
              style={{ tabSize: 2 }}
            />
          </div>

          <p
            aria-live="polite"
            className={`mt-2 text-[0.6875rem] ${status.kind === "error" ? "text-rose" : "text-mint"}`}
          >
            {status.kind === "error"
              ? `Not applied — ${status.message}`
              : status.kind === "applied"
                ? "Valid JSON, applied."
                : "In sync with the form."}
          </p>

          {unknownKeys.length > 0 && (
            <p className="mt-1 text-[0.6875rem] text-amber">
              Ignored unknown {unknownKeys.length === 1 ? "key" : "keys"}: {unknownKeys.join(", ")}
            </p>
          )}

          <p className="mt-3 text-[0.6875rem] leading-snug text-faint">
            Try it: change <code className="text-muted">&quot;editor.fontSize&quot;</code> to{" "}
            <code className="text-muted">1.0625</code>, or set{" "}
            <code className="text-muted">&quot;workbench.sideBarLocation&quot;</code> to{" "}
            <code className="text-muted">&quot;right&quot;</code>. Out-of-range numbers are clamped rather than
            rejected.
          </p>
        </section>
      </div>
    </div>
  );
}
