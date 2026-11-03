"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { files, filePath, workspaceName } from "@/content/workspace";
import { useIde } from "./ide-state";
import { createEngine } from "./gitlantis/engine";
import { ASSETS, DEFAULT_SETTINGS, DIR_KEY, SETTINGS_KEY, SHORTCUTS, type EngineHandle, type GitlantisSettings, type Landmark } from "./gitlantis/config";
import { GitlantisSettingsPanel } from "./gitlantis/Settings";
import { WEATHERS } from "./gitlantis/weather";
import "./gitlantis.css";

// The sea shows what a visitor actually needs. The root holds the pages and the résumé as buoys, with one
// tower, projects, that leads to every project. Wrapper folders (src, .vscode) are left out: they are
// file-tree plumbing, not places worth sailing to.
const PROJECTS = "src/projects";
const UP = "__up";

function landmarksFor(dir: string, show: GitlantisSettings["nodesToShow"]): Landmark[] {
  const here: Landmark[] = files
    .filter((file) => file.href !== "/gitlantis" && (dir === "" ? ["src", ""].includes(file.dir ?? "") : file.dir === dir))
    .map((file) => ({ id: filePath(file), label: file.name, kind: "file", file }));
  const tower: Landmark = dir === "" ? { id: PROJECTS, label: "projects", kind: "folder" } : { id: UP, label: "← back", kind: "folder" };
  return [...(show === "Files only" && dir === "" ? [] : [tower]), ...(show === "Folders only" && dir === "" ? [] : here)];
}

const CARDINALS = [["N", 0], ["NE", 45], ["E", 90], ["SE", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]] as const;
const closest = (deg: number) => CARDINALS.reduce((best, c) => (Math.min(Math.abs(deg - c[1]), 360 - Math.abs(deg - c[1])) < Math.min(Math.abs(deg - best[1]), 360 - Math.abs(deg - best[1])) ? c : best))[0];

function Compass({ heading }: { heading: number }) {
  const px = 1.6; // pixels per degree
  const ticks = [-360, 0, 360].flatMap((turn) => CARDINALS.map(([label, degree]) => ({ label, at: degree + turn })));
  return (
    <div className="gl-compass" role="img" aria-label={`Heading ${Math.round(heading)} degrees ${closest(heading)}`}>
      <div className="gl-compass-readout">{Math.round(heading)}° {closest(heading)}</div>
      <div className="gl-compass-strip">
        {ticks.filter((t) => Math.abs(t.at - heading) < 110).map((t) => (
          <span key={`${t.label}${t.at}`} style={{ left: `calc(50% + ${(t.at - heading) * px}px)` }}><i />{t.label}</span>
        ))}
        <b />
      </div>
    </div>
  );
}

const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const ICONS = {
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  sound: "M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13",
  mute: "M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6",
  full: "M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3",
  map: "M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6zM8 3v15M16 6v15",
  horn: "M3 10v4h3l7 4V6L6 10H3zM17 9a4 4 0 010 6",
  cloud: "M18 10h-1.3A6 6 0 105 15.3M7 19h11a4 4 0 000-8h-.3",
};

function HoldButton({ label, onHold, children }: { label: string; onHold(down: boolean): void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onHold(true); }} onPointerUp={() => onHold(false)} onPointerCancel={() => onHold(false)} onContextMenu={(e) => e.preventDefault()}>{children}</button>
  );
}

export function Gitlantis() {
  const { open, setTerminalOpen } = useIde();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EngineHandle | null>(null);
  const actionsRef = useRef<(id: string) => void>(() => {});
  const phaseRef = useRef<"idle" | "loading" | "sailing">("idle");
  const cycleWeatherRef = useRef<() => void>(() => {});

  const [dir, setDir] = useState("");
  const [settings, setSettings] = useState<GitlantisSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<"idle" | "loading" | "sailing">("idle");
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [heading, setHeading] = useState(0);
  const [colliding, setColliding] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mapFull, setMapFull] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const landmarks = useMemo(() => landmarksFor(dir, settings.nodesToShow), [dir, settings.nodesToShow]);
  const byId = useMemo(() => new Map(landmarks.map((l) => [l.id, l])), [landmarks]);

  useEffect(() => {
    setTerminalOpen(false);
    // Saved choices are read after hydration so the server and first client render agree.
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved, boatColors: { ...DEFAULT_SETTINGS.boatColors, ...saved.boatColors } });
        const last = localStorage.getItem(DIR_KEY);
        if (last === PROJECTS) setDir(last);
      } catch { /* Storage is optional. */ }
      setCoarse(window.matchMedia("(pointer: coarse)").matches);
    });
    const sync = () => setFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [setTerminalOpen]);

  const go = useCallback((path: string) => {
    setDir(path); setColliding(null); setHovered(null);
    try { localStorage.setItem(DIR_KEY, path); } catch { /* Storage is optional. */ }
  }, []);

  useEffect(() => {
    actionsRef.current = (id) => {
      const target = byId.get(id);
      if (!target) return;
      if (target.id === UP) go("");
      else if (target.kind === "folder") go(target.id);
      else if (target.file) open(target.file);
    };
  }, [byId, go, open]);

  useEffect(() => {
    const canvas = canvasRef.current, host = sceneRef.current;
    if (!canvas || !host) return;
    const engine = createEngine(canvas, host, DEFAULT_SETTINGS, {
      onProgress: setProgress,
      onReady: () => setReady(true),
      onError: () => setFailed(true),
      onCollide: setColliding,
      onHover: setHovered,
      onOpen: (id) => actionsRef.current(id),
      onHeading: (deg) => setHeading(Math.round(deg * 2) / 2),
      onCycleWeather: () => cycleWeatherRef.current(),
    });
    const onMap = (e: Event) => setMapFull((e as CustomEvent<boolean>).detail);
    host.addEventListener("gitlantis:map", onMap);
    engineRef.current = engine;
    // A rebuilt scene (hot reload, Strict Mode) must pick up where the visitor already is.
    if (phaseRef.current !== "idle") engine?.start();
    return () => { host.removeEventListener("gitlantis:map", onMap); engine?.dispose(); engineRef.current = null; };
  }, []);

  useEffect(() => { engineRef.current?.setSettings(settings); }, [settings]);
  useEffect(() => { engineRef.current?.setLandmarks(landmarks, dir || "root"); }, [landmarks, dir]);
  useEffect(() => { engineRef.current?.setMuted(muted); }, [muted]);
  useEffect(() => { engineRef.current?.setMapFull(mapFull); }, [mapFull]);

  useEffect(() => {
    if (phase !== "loading" || !ready) return;
    const timer = window.setTimeout(() => setPhase("sailing"), 900);
    return () => window.clearTimeout(timer);
  }, [phase, ready]);

  // Esc closes the settings first, then leaves the current folder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || phase !== "sailing") return;
      if (settingsOpen) { setSettingsOpen(false); return; }
      if (mapFull) { setMapFull(false); return; }
      if (dir) go("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, settingsOpen, mapFull, dir, go]);

  const update = (next: GitlantisSettings) => {
    setSettings(next);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
  };
  useEffect(() => {
    cycleWeatherRef.current = () => {
      const next = { ...settings, weather: WEATHERS[(WEATHERS.indexOf(settings.weather) + 1) % WEATHERS.length] };
      setSettings(next);
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
    };
  }, [settings]);
  const restore = () => { setSettings(DEFAULT_SETTINGS); try { localStorage.removeItem(SETTINGS_KEY); } catch { /* Storage is optional. */ } };
  const start = () => { setPhase("loading"); engineRef.current?.start(); };
  const collidingLandmark = colliding ? byId.get(colliding) : undefined;
  const steer = useCallback((key: "forward" | "backward" | "left" | "right", down: boolean) => engineRef.current?.setKey(key, down), []);
  const honk = useCallback((on: boolean) => engineRef.current?.honk(on), []);
  const sailing = phase === "sailing";

  return (
    <section ref={sectionRef} className="gitlantis" aria-label="Gitlantis, the portfolio as a 3D ocean">
      <div className={`gl-world${mapFull ? " is-map" : ""}`}>
        <div ref={sceneRef} className="gl-scene"><canvas ref={canvasRef} aria-hidden="true" /></div>

        {failed && <div className="gl-error" role="alert"><strong>3D could not start</strong><span>WebGL is unavailable or a model failed to load. Every landmark is listed below, so you can still open anything.</span></div>}

        {sailing && (
          <>
            {settings.breadcrumbs === "Show" && (
              <nav className="gl-crumbs" aria-label="Folder path">
                <span>Exploring:</span>
                {dir ? <button type="button" onClick={() => go("")}>{workspaceName}</button> : <b>{workspaceName}</b>}
                {dir && <span><i aria-hidden="true">›</i><b>{dir.split("/").at(-1)}</b></span>}
              </nav>
            )}

            {settings.minimap === "Show" && (
              <>
                {!mapFull && <div className="gl-mapframe" aria-hidden="true" />}
                <button type="button" className="gl-mapbtn" onClick={() => setMapFull(!mapFull)} aria-pressed={mapFull}><Icon d={ICONS.map} />{mapFull ? "Close map" : "Map"}<kbd>F</kbd></button>
              </>
            )}

            {settings.compass === "Show" && <Compass heading={heading} />}

            {(collidingLandmark || hovered) && (
              <div className="gl-hint" role="status">
                {collidingLandmark
                  ? <><b>{collidingLandmark.label}</b><span>{coarse ? "Tap it to " : <><kbd>Shift</kbd>+<kbd>Enter</kbd> or click to </>}{collidingLandmark.kind === "folder" ? "sail in" : "open"}</span></>
                  : <span>{byId.get(hovered!)?.kind === "folder" ? "Click to sail into " : "Click to open "}<b>{byId.get(hovered!)?.label}</b></span>}
              </div>
            )}

            <div className="gl-tools">
              <button type="button" onClick={() => setMuted(!muted)} aria-pressed={muted} aria-label={muted ? "Unmute ocean sounds" : "Mute ocean sounds"} title={muted ? "Unmute" : "Mute"}><Icon d={muted ? ICONS.mute : ICONS.sound} /></button>
              <button type="button" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen} aria-label="Gitlantis settings" title="Settings"><Icon d={ICONS.gear} /></button>
              <button type="button" className="gl-weather" onClick={() => cycleWeatherRef.current()} aria-label={`Weather: ${settings.weather}. Change weather`} title="Change weather (T)"><Icon d={ICONS.cloud} /><span>{settings.weather}</span></button>
              <button type="button" onClick={() => { if (fullscreen) document.exitFullscreen(); else sectionRef.current?.requestFullscreen(); }} aria-pressed={fullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"} title="Full screen"><Icon d={ICONS.full} /></button>
            </div>

            <div className="gl-pad" aria-label="Touch sailing controls">
              <HoldButton label="Sound the horn" onHold={honk}><Icon d={ICONS.horn} /></HoldButton>
              <div>
                <HoldButton label="Turn left" onHold={(d) => steer("left", d)}>←</HoldButton>
                <HoldButton label="Sail forward" onHold={(d) => steer("forward", d)}>↑</HoldButton>
                <HoldButton label="Sail backward" onHold={(d) => steer("backward", d)}>↓</HoldButton>
                <HoldButton label="Turn right" onHold={(d) => steer("right", d)}>→</HoldButton>
              </div>
            </div>

            {settingsOpen && <GitlantisSettingsPanel settings={settings} onChange={update} onRestore={restore} onClose={() => setSettingsOpen(false)} />}
          </>
        )}

        <div className={`gl-splash${sailing ? " is-gone" : ""}`} aria-hidden={sailing}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.logo} alt="" width={80} height={80} />
          <h1>Gitlantis</h1>
          <p className="gl-tag">Sail through {workspaceName}</p>
          {phase === "idle" && (
            <>
              <button type="button" className="gl-start" onClick={start} disabled={failed}>Start expedition</button>
              <dl className="gl-keys">
                {SHORTCUTS.map((s) => <div key={s.keys}><dt>{s.keys}</dt><dd>{s.label}</dd></div>)}
              </dl>
              <p className="gl-credit">Sound on. Folders are lighthouses, files are buoys. Based on the <a href="https://github.com/liltrendi/gitlantis" target="_blank" rel="noreferrer">Gitlantis VS Code extension<span className="sr-only"> (opens in a new tab)</span></a> by Brian Njogu.</p>
            </>
          )}
          {phase === "loading" && <div className="gl-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Loading the ocean"><div style={{ width: `${progress}%` }} /></div>}
        </div>
      </div>

      <div className="gl-directory">
        <h2>Landmarks in {dir ? dir.split("/").at(-1) : "root"}</h2>
        <div>
          {landmarks.length === 0 && <p>Nothing here with the current “nodes to show” setting.</p>}
          {landmarks.map((l) => (
            <button key={l.id} type="button" onClick={() => actionsRef.current(l.id)}>
              <span className={l.kind} aria-hidden="true">{l.kind === "folder" ? "▣" : "◆"}</span>
              <span>{l.label}</span>
              <small>{l.kind === "folder" ? "Sail in" : "Open"} ↗</small>
            </button>
          ))}
        </div>
        {dir && <button type="button" className="gl-up" onClick={() => go("")}>← Back to {workspaceName}</button>}
      </div>
    </section>
  );
}
