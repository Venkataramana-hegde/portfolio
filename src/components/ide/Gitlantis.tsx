"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { files, filePath, workspaceName, type WorkspaceFile } from "@/content/workspace";
import { useIde } from "./ide-state";
import { GitlantisScene, type Landmark as Island, type BoatPosition as Position, type ScenePrefs as Prefs } from "./GitlantisScene";
import "./gitlantis.css";

const initialPrefs: Prefs = { minimap: true, breadcrumbs: true, labels: true, waves: true, mapSize: 150 };
const allDirs = ["", "src", "src/projects", ".vscode"];

function nodesFor(dir: string): Island[] {
  const folders = allDirs.filter((candidate) => candidate && candidate.slice(0, candidate.lastIndexOf("/")) === dir && candidate !== dir);
  // Root folders have no slash; nested folders have their immediate parent as a prefix.
  const visibleFolders = dir === "" ? allDirs.filter((candidate) => candidate && !candidate.includes("/")) : folders;
  const items: Pick<Island, "id" | "label" | "kind" | "file" | "overview">[] = [
    ...visibleFolders.map((path) => ({ id: path, label: path.split("/").at(-1)!, kind: "folder" as const })),
    ...files.filter((file) => (dir === "" || (file.dir ?? "") === dir) && file.href !== "/gitlantis").map((file) => ({ id: filePath(file), label: file.name, kind: "file" as const, file, overview: dir === "" })),
  ];
  return items.map((item, i) => {
    const row = Math.floor(i / 5);
    const column = i % 5;
    return { ...item, x: (column - Math.min(4, items.length - 1 - row * 5) / 2) * 7.4 + (row % 2 ? 1.9 : 0), z: 12 + row * 11.5 };
  });
}

export function Gitlantis() {
  const { open, setTerminalOpen } = useIde();
  const viewportRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<Position>({ x: 0, z: 0, angle: 0 });
  const keysRef = useRef(new Set<string>());
  const [dir, setDir] = useState("");
  const [position, setPosition] = useState<Position>({ x: 0, z: 0, angle: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  const islands = useMemo(() => nodesFor(dir), [dir]);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("portfolio.gitlantis.preferences") ?? "null"); if (saved) setPrefs({ ...initialPrefs, ...saved }); } catch { /* Ignore unavailable or stale storage. */ }
    setTerminalOpen(false);
    viewportRef.current?.focus();
    const syncFullscreen = () => setFullscreen(document.fullscreenElement === viewportRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);
  const updatePrefs = (next: Prefs) => { setPrefs(next); try { localStorage.setItem("portfolio.gitlantis.preferences", JSON.stringify(next)); } catch { /* Storage is optional. */ } };

  const sailTo = useCallback((path: string) => {
    setDir(path); posRef.current = { x: 0, z: 0, angle: 0 }; setPosition(posRef.current); setHover(null); setSearch("");
    viewportRef.current?.focus();
  }, []);
  const activate = useCallback((island: Island) => {
    if (island.kind === "folder") sailTo(island.id);
    else if (island.file) open(island.file);
  }, [open, sailTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " "].includes(e.key)) {
      e.preventDefault(); keysRef.current.add(e.key.toLowerCase().startsWith("arrow") ? e.key : e.key.toLowerCase());
    }
    if (e.key === "Escape" && dir) { e.stopPropagation(); sailTo(dir.includes("/") ? dir.slice(0, dir.lastIndexOf("/")) : ""); }
    if (e.key === "Enter" && hover) { const target = islands.find((i) => i.id === hover); if (target) activate(target); }
  };
  const onKeyUp = (e: React.KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase().startsWith("arrow") ? e.key : e.key.toLowerCase());
  const query = search.trim().toLowerCase();
  const results = query ? islands.filter((i) => i.label.toLowerCase().includes(query)).slice(0, 8) : [];
  const crumbs = dir ? dir.split("/").map((_, i, parts) => parts.slice(0, i + 1).join("/")) : [];

  return (
    <section className="gitlantis" aria-label="Gitlantis portfolio explorer">
      <div className="gitlantis-bar">
        <div><span className="gitlantis-mark">◈</span><strong>GITLANTIS</strong><span className="gitlantis-subtitle">{workspaceName}</span></div>
        <div className="gitlantis-actions"><span>{islands.length} landmarks</span><button type="button" onClick={() => { if (fullscreen) document.exitFullscreen(); else viewportRef.current?.requestFullscreen(); }}>{fullscreen ? "Exit fullscreen" : "⛶ Fullscreen"}</button><button type="button" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}>⚙ Settings</button></div>
      </div>
      <div className="gitlantis-world" ref={viewportRef} tabIndex={0} role="application" aria-label="Sailing world. Use W A S D or arrow keys to sail and turn. Click a lighthouse to enter a folder or a buoy to open a file." onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={() => keysRef.current.clear()}>
        <GitlantisScene landmarks={islands} positionRef={posRef} keysRef={keysRef} prefs={prefs} onPosition={setPosition} onHover={setHover} onActivate={activate} />
        {fullscreen && <button type="button" className="gitlantis-exit" onClick={() => document.exitFullscreen()}>Exit fullscreen</button>}
        {prefs.breadcrumbs && dir && <nav className="gitlantis-crumbs" aria-label="Folder path"><button type="button" onClick={() => sailTo("")}>{workspaceName}</button>{crumbs.map((crumb) => <span key={crumb}><span aria-hidden="true"> / </span><button type="button" onClick={() => sailTo(crumb)}>{crumb.split("/").at(-1)}</button></span>)}</nav>}
        <div className="gitlantis-compass" aria-label={`Heading ${Math.round(((position.angle * 180 / Math.PI) % 360 + 360) % 360)} degrees`}><span style={{ transform: `rotate(${-position.angle}rad)` }}>N</span><small>COMPASS</small></div>
        {prefs.minimap && <div className="gitlantis-map" style={{ width: prefs.mapSize, height: prefs.mapSize }} aria-label="Minimap"><div className="gitlantis-map-title">MAP · {dir || "root"}</div><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 14v76M18 50h64" stroke="rgba(190,230,222,.14)" />{islands.map((island) => <circle key={island.id} cx={50 - island.x * 1.2} cy={20 + island.z * 1.2} r={island.kind === "folder" ? 3.4 : 2.5} fill={island.kind === "folder" ? "#ffe3a3" : "#e77d67"} />)}<g transform={`translate(${50 - position.x * 1.2} ${20 + position.z * 1.2}) rotate(${180 - position.angle * 180 / Math.PI})`}><path d="M0 -5L4 5L0 3L-4 5Z" fill="#fff" /></g></svg></div>}
        <div className="gitlantis-guide"><strong>SAIL THE CODEBASE</strong><span>W / ↑ forward · S / ↓ back · A D / ← → turn</span><span>Select a landmark to open a file or folder</span></div>
        <div className="gitlantis-pad" aria-label="Touch sailing controls"><button type="button" onPointerDown={() => keysRef.current.add("ArrowLeft")} onPointerUp={() => keysRef.current.delete("ArrowLeft")} onPointerLeave={() => keysRef.current.delete("ArrowLeft")} aria-label="Turn left">←</button><div><button type="button" onPointerDown={() => keysRef.current.add("ArrowUp")} onPointerUp={() => keysRef.current.delete("ArrowUp")} onPointerLeave={() => keysRef.current.delete("ArrowUp")} aria-label="Sail forward">↑</button><button type="button" onPointerDown={() => keysRef.current.add("ArrowDown")} onPointerUp={() => keysRef.current.delete("ArrowDown")} onPointerLeave={() => keysRef.current.delete("ArrowDown")} aria-label="Sail backward">↓</button></div><button type="button" onPointerDown={() => keysRef.current.add("ArrowRight")} onPointerUp={() => keysRef.current.delete("ArrowRight")} onPointerLeave={() => keysRef.current.delete("ArrowRight")} aria-label="Turn right">→</button></div>
      </div>
      <div className="gitlantis-dock"><label><span>⌕</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a landmark in this folder" aria-label="Find a landmark in this folder" /></label><span className="gitlantis-coordinates">{Math.round(position.x)}, {Math.round(position.z)} · {Math.round(((position.angle * 180 / Math.PI) % 360 + 360) % 360)}°</span></div>
      {query && <div className="gitlantis-results" aria-live="polite">{results.length ? results.map((island) => <button key={island.id} type="button" onClick={() => activate(island)}><span>{island.kind === "folder" ? "▣" : "◆"}</span><strong>{island.label}</strong><small>{island.kind === "folder" ? "Enter folder" : "Open file"}</small></button>) : <p>No landmarks match “{search}”.</p>}</div>}
      <div className="gitlantis-directory"><h2>Landmarks in {dir || "root"}</h2><div>{islands.map((island) => <button key={island.id} type="button" onClick={() => activate(island)}><span className={island.kind}>{island.kind === "folder" ? "▣" : "◆"}</span><span>{island.label}</span><small>{island.kind === "folder" ? "Explore" : "Open"} ↗</small></button>)}</div></div>
      {settingsOpen && <div className="gitlantis-settings" role="dialog" aria-label="Gitlantis settings"><div><strong>Voyage settings</strong><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button></div>{(["minimap", "breadcrumbs", "labels", "waves"] as const).map((key) => <label key={key}><span>{({ minimap: "Show minimap", breadcrumbs: "Show breadcrumbs", labels: "Show landmark labels", waves: "Animate waves" })[key]}</span><input type="checkbox" checked={prefs[key]} onChange={(e) => updatePrefs({ ...prefs, [key]: e.target.checked })} /></label>)}<label><span>Minimap size</span><input type="range" min="120" max="220" step="10" value={prefs.mapSize} onChange={(e) => updatePrefs({ ...prefs, mapSize: Number(e.target.value) })} /></label></div>}
    </section>
  );
}
