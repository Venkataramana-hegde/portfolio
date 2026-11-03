"use client";

import { useState } from "react";
import type { BoatColors, GitlantisSettings, NodesToShow, Toggle } from "./config";
import { WEATHERS, type Weather } from "./weather";

type Props = { settings: GitlantisSettings; onChange(next: GitlantisSettings): void; onRestore(): void; onClose(): void };
const TABS = ["General", "Controls", "Behavior", "About"] as const;
type NumberKey = { [K in keyof GitlantisSettings]: GitlantisSettings[K] extends number ? K : never }[keyof GitlantisSettings];

const COLOR_LABELS: Record<keyof BoatColors, string> = { walls: "Walls", roof: "Roof", hull: "Hull", rails: "Rails", body: "Body", floaters: "Floaters" };

export function GitlantisSettingsPanel({ settings, onChange, onRestore, onClose }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const set = <K extends keyof GitlantisSettings>(key: K, value: GitlantisSettings[K]) => onChange({ ...settings, [key]: value });

  const slider = (key: NumberKey, label: string, min: number, max: number, step: number, hint?: string) => (
    <label className="gl-row" key={key}>
      <span>{label}{hint && <small>{hint}</small>}</span>
      <input type="range" min={min} max={max} step={step} value={settings[key]} onChange={(e) => set(key, Number(e.target.value))} />
      <output>{Number(settings[key].toFixed(3))}</output>
    </label>
  );
  const toggle = (key: "minimap" | "breadcrumbs" | "compass", label: string) => (
    <label className="gl-row" key={key}>
      <span>{label}</span>
      <select value={settings[key]} onChange={(e) => set(key, e.target.value as Toggle)}><option>Show</option><option>Hide</option></select>
    </label>
  );

  return (
    <div className="gl-settings" role="dialog" aria-label="Gitlantis settings">
      <header>
        <strong>Settings</strong>
        <button type="button" onClick={onClose} aria-label="Close settings">×</button>
      </header>
      <div className="gl-tabs" role="tablist">
        {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <div className="gl-body" role="tabpanel">
        {tab === "General" && (
          <>
            <label className="gl-row">
              <span>Weather<small>Press T on the water to cycle</small></span>
              <select value={settings.weather} onChange={(e) => set("weather", e.target.value as Weather)}>{WEATHERS.map((w) => <option key={w}>{w}</option>)}</select>
            </label>
            {toggle("minimap", "Minimap")}
            {toggle("breadcrumbs", "Breadcrumbs")}
            {toggle("compass", "Compass")}
            <label className="gl-row">
              <span>Nodes to show</span>
              <select value={settings.nodesToShow} onChange={(e) => set("nodesToShow", e.target.value as NodesToShow)}><option>Folders and files</option><option>Folders only</option><option>Files only</option></select>
            </label>
            {slider("volume", "Volume", 0, 1, 0.05, "Ocean waves and horn")}
            <div className="gl-colors">
              <span>Boat colours</span>
              <div>
                {(Object.keys(COLOR_LABELS) as (keyof BoatColors)[]).map((key) => (
                  <label key={key}><input type="color" value={settings.boatColors[key]} onChange={(e) => set("boatColors", { ...settings.boatColors, [key]: e.target.value })} />{COLOR_LABELS[key]}</label>
                ))}
              </div>
            </div>
          </>
        )}
        {tab === "Controls" && (
          <>
            {slider("boatSpeed", "Top speed", 1, 8, 0.1)}
            {slider("acceleration", "Acceleration", 0.005, 0.1, 0.005)}
            {slider("deceleration", "Deceleration", 0.002, 0.08, 0.002, "How fast it coasts to a stop")}
            {slider("turnSpeed", "Turn speed", 0.005, 0.06, 0.005)}
            {slider("turnDeceleration", "Turn deceleration", 0.01, 0.3, 0.01)}
            {slider("collisionRadius", "Landmark radius", 50, 250, 10, "How close you can get")}
            {slider("collisionPushStrength", "Push-back strength", 1, 15, 1)}
          </>
        )}
        {tab === "Behavior" && (
          <>
            {slider("rockingAmplitude", "Rocking", 0, 0.12, 0.01, "Side to side while idle")}
            {slider("rockingSpeed", "Rocking speed", 0.05, 1, 0.05)}
            {slider("bobbingAmplitude", "Bobbing", 0, 1, 0.05, "Up and down while idle")}
            {slider("bobbingSpeed", "Bobbing speed", 0.05, 1.5, 0.05)}
          </>
        )}
        {tab === "About" && (
          <div className="gl-about">
            <p>This is the <a href="https://github.com/liltrendi/gitlantis" target="_blank" rel="noreferrer">Gitlantis<span className="sr-only"> (opens in a new tab)</span></a> VS Code extension by Brian Njogu, running on this site. Here the folders and files it shows are the ones in this portfolio.</p>
            <p>Models, ocean texture, sounds and tuning come from the extension (Apache-2.0).</p>
          </div>
        )}
      </div>
      <footer><button type="button" onClick={onRestore}>Restore defaults</button></footer>
    </div>
  );
}
