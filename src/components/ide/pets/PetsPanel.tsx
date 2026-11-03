"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIde } from "../ide-state";
import { CloseIcon } from "../Icons";
import { createPlayground, type Playground } from "./engine";
import { DEFAULT_PREFS, MAX_PETS, NAMES, PETS_KEY, PET_KINDS, SCENES, SIZES, kindOf, sceneUrl, spriteUrl, type PetPrefs, type SizeId } from "./data";
import "./pets.css";

const select = "rounded border border-line bg-raise px-1.5 py-1 text-[0.75rem] text-fg focus-visible:outline-2 focus-visible:outline-amber";
const button = "shrink-0 rounded border border-line px-2 py-1 text-[0.75rem] text-fg transition-colors hover:border-amber hover:text-amber disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-fg";

/** The Pets tab of the bottom panel: adopt, pet and play with the VS Code Pets sprites. */
export function PetsPanel({ active, tabs }: { active: boolean; tabs: React.ReactNode }) {
  const { toggleTerminal } = useIde();
  const fieldRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<Playground | null>(null);
  const [prefs, setPrefs] = useState<PetPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [pick, setPick] = useState({ kind: "dog", color: "black" });
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const [status, setStatus] = useState("");

  const kind = kindOf(pick.kind);
  const size = SIZES[prefs.size];
  const scene = prefs.scene;

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(PETS_KEY) ?? "null");
        if (saved && Array.isArray(saved.pets)) setPrefs({ ...DEFAULT_PREFS, ...saved, pets: saved.pets.filter((p: { kind?: string }) => p.kind && kindOf(p.kind).id === p.kind) });
      } catch { /* Storage is optional. */ }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PETS_KEY, JSON.stringify(prefs)); } catch { /* Storage is optional. */ }
  }, [prefs, loaded]);

  // Scene art comes in a dark and a light cut; follow the page's colour scheme, including live theme changes.
  useEffect(() => {
    const read = () => setTone(getComputedStyle(document.documentElement).colorScheme.includes("light") ? "light" : "dark");
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, { attributes: true });
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const play = createPlayground(field);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => play.setReducedMotion(media.matches || document.documentElement.dataset.reduceMotion === "on");
    sync();
    media.addEventListener("change", sync);
    playRef.current = play;
    return () => { media.removeEventListener("change", sync); play.dispose(); playRef.current = null; };
  }, []);

  useEffect(() => { playRef.current?.sync(prefs.pets); }, [prefs.pets]);
  useEffect(() => { playRef.current?.setScale(size.scale); }, [size.scale]);
  useEffect(() => { playRef.current?.setActive(active); }, [active]);

  const adopt = () => {
    if (prefs.pets.length >= MAX_PETS) return;
    const taken = new Set(prefs.pets.map((p) => p.name));
    const name = NAMES.find((n) => !taken.has(n)) ?? `${NAMES[0]} ${prefs.pets.length + 1}`;
    const id = `p${Math.max(0, ...prefs.pets.map((p) => Number(p.id.slice(1)) || 0)) + 1}`;
    setPrefs({ ...prefs, pets: [...prefs.pets, { id, kind: pick.kind, color: pick.color, name }] });
    setStatus(`Adopted ${name} the ${kind.label.toLowerCase()}`);
  };

  const floor = useMemo(() => Math.round(size.sceneHeight * .075), [size.sceneHeight]);
  const sceneVars = {
    "--floor": `${floor}px`,
    "--bg": scene === "none" ? "none" : `url(${sceneUrl(scene, "background", tone, prefs.size)})`,
    "--fg": scene === "none" ? "none" : `url(${sceneUrl(scene, "foreground", tone, prefs.size)})`,
  } as React.CSSProperties;

  return (
    <section className="flex h-full flex-col bg-panel" aria-label="Pets">
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-line px-3">
        {tabs}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap py-1 [scrollbar-width:thin]">
          <select aria-label="Pet type" className={select} value={pick.kind} onChange={(e) => setPick({ kind: e.target.value, color: kindOf(e.target.value).colors[0] })}>
            {PET_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <select aria-label="Pet colour" className={select} value={pick.color} onChange={(e) => setPick({ ...pick, color: e.target.value })} disabled={kind.colors.length < 2}>
            {kind.colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className={button} onClick={adopt} disabled={prefs.pets.length >= MAX_PETS} title={prefs.pets.length >= MAX_PETS ? `Up to ${MAX_PETS} pets` : undefined}>Adopt</button>
          <button type="button" className={button} onClick={() => playRef.current?.throwBall()} disabled={prefs.pets.length === 0}>Throw ball</button>
          <button type="button" className={button} onClick={() => { setPrefs({ ...prefs, pets: [] }); setStatus("Sent every pet home"); }} disabled={prefs.pets.length === 0}>Clear</button>
          <span className="mx-1 h-4 w-px shrink-0 bg-line" aria-hidden="true" />
          <select aria-label="Scene" className={select} value={scene} onChange={(e) => setPrefs({ ...prefs, scene: e.target.value })}>
            {SCENES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select aria-label="Pet size" className={select} value={prefs.size} onChange={(e) => setPrefs({ ...prefs, size: e.target.value as SizeId })}>
            {Object.entries(SIZES).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
          </select>
          <label className="flex shrink-0 items-center gap-1.5 text-[0.75rem] text-muted">
            <input type="checkbox" checked={prefs.names} onChange={(e) => setPrefs({ ...prefs, names: e.target.checked })} className="accent-[var(--amber)]" />
            Names
          </label>
        </div>
        <button type="button" onClick={toggleTerminal} aria-label="Close panel" className="ml-auto grid size-7 shrink-0 place-items-center rounded text-muted hover:bg-raise hover:text-fg">
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div ref={fieldRef} className="pets-field min-h-0 flex-1" style={sceneVars} data-names={prefs.names} role="group" aria-label="Pets playground">
        <div className="pets-bg" aria-hidden="true" />
        <div className="pets-layer">
          {prefs.pets.map((p) => (
            <button key={p.id} type="button" data-pet={p.id} className="pets-pet" onClick={() => playRef.current?.pet(p.id)} aria-label={`Pet ${p.name} the ${kindOf(p.kind).label.toLowerCase()}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spriteUrl(p.kind, p.color, "idle")} alt="" draggable={false} />
              <span className="pets-tag" aria-hidden="true">{p.name}</span>
              <span className="pets-heart" aria-hidden="true">♥</span>
            </button>
          ))}
          <span className="pets-ball" data-phase="off" aria-hidden="true" />
        </div>
        <div className="pets-fg" aria-hidden="true" />
        {loaded && prefs.pets.length === 0 && (
          <p className="pets-empty">No pets yet. Pick one above and press <b>Adopt</b>. They wander on their own, you can click to pet them, and <b>Throw ball</b> sends them running.</p>
        )}
        <p className="sr-only" role="status">{status}</p>
      </div>
    </section>
  );
}
