import { kindOf, spriteUrl, type Anim, type PetData } from "./data";

type Sim = {
  id: string;
  kind: string;
  color: string;
  el: HTMLElement;
  img: HTMLImageElement;
  x: number;
  dir: 1 | -1;
  anim: Anim;
  until: number;
  cooldown: number;
  naturalW: number;
};

type Ball = {
  phase: "off" | "fly" | "ground" | "play";
  x: number; y: number; x0: number; x1: number; t0: number; dur: number;
  throws: number; since: number; owner: string | null; until: number;
};

// px per second at scale 1
const SPEED: Partial<Record<Anim, number>> = { walk: 42, walk_fast: 88, run: 210 };
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export type Playground = {
  sync(pets: PetData[]): void;
  setScale(scale: number): void;
  setActive(active: boolean): void;
  setReducedMotion(reduced: boolean): void;
  throwBall(): void;
  pet(id: string): void;
  dispose(): void;
};

/** Pets wander a strip, can be petted, and chase a thrown ball. State lives here, not in React, so frames never re-render. */
export function createPlayground(field: HTMLElement): Playground {
  const sims = new Map<string, Sim>();
  const ballEl = field.querySelector<HTMLElement>(".pets-ball");
  const ball: Ball = { phase: "off", x: 0, y: 0, x0: 0, x1: 0, t0: 0, dur: 900, throws: 0, since: 0, owner: null, until: 0 };
  let scale = .8, reduced = false, active = true, raf = 0, last = 0;

  const width = () => field.clientWidth;
  const widthOf = (s: Sim) => (s.naturalW || 100) * scale;
  const allowed = (s: Sim, anim: Anim) => kindOf(s.kind).anims.includes(anim);

  function setAnim(s: Sim, anim: Anim, now: number, ms: number) {
    if (s.anim !== anim) { s.anim = anim; s.img.src = spriteUrl(s.kind, s.color, anim); }
    s.until = now + ms;
  }

  function paint(s: Sim) {
    s.el.style.transform = `translateX(${s.x}px)`;
    s.img.style.transform = `scale(${s.dir * scale}, ${scale})`;
    s.el.style.setProperty("--ph", `${(s.img.naturalHeight || 90) * scale}px`);
  }

  function wander(s: Sim, now: number) {
    const r = Math.random();
    if (reduced) { setAnim(s, allowed(s, "lie") && r < .4 ? "lie" : "idle", now, rand(4000, 8000)); return; }
    const walking = s.anim === "walk" || s.anim === "walk_fast";
    if (walking && r < .5) setAnim(s, "idle", now, rand(1500, 4000));
    else if (walking) { setAnim(s, r < .75 && allowed(s, "walk_fast") ? "walk_fast" : "walk", now, rand(2500, 5500)); if (Math.random() < .25) s.dir = (s.dir * -1) as 1 | -1; }
    else if (r < .45) { s.dir = Math.random() < .5 ? 1 : -1; setAnim(s, "walk", now, rand(3000, 6000)); }
    else if (r < .6 && allowed(s, "walk_fast")) { s.dir = Math.random() < .5 ? 1 : -1; setAnim(s, "walk_fast", now, rand(2000, 4000)); }
    else if (r < .75 && allowed(s, "lie")) setAnim(s, "lie", now, rand(4000, 8000));
    else if (r < .85) setAnim(s, "swipe", now, 1300);
    else setAnim(s, "idle", now, rand(2000, 5000));
  }

  function launch(fromX: number, now: number) {
    const w = width();
    ball.phase = "fly"; ball.x0 = fromX; ball.x1 = rand(w * .15, Math.max(w * .15 + 1, w * .85)); ball.t0 = now; ball.dur = 900; ball.owner = null;
  }

  function stepBall(now: number) {
    if (!ballEl || ball.phase === "off") return;
    if (ball.phase === "fly") {
      const p = Math.min((now - ball.t0) / ball.dur, 1);
      ball.x = ball.x0 + (ball.x1 - ball.x0) * p;
      ball.y = 4 * 70 * scale * p * (1 - p);
      if (p >= 1) { ball.phase = "ground"; ball.since = now; ball.y = 0; }
    } else if (ball.phase === "ground" && now - ball.since > 20000) ball.phase = "off";
    else if (ball.phase === "play" && now >= ball.until) {
      const owner = ball.owner ? sims.get(ball.owner) : undefined;
      if (owner) owner.cooldown = now + 1500;
      if (ball.throws < 4) { ball.throws++; launch(owner ? owner.x + widthOf(owner) / 2 : ball.x, now); } else ball.phase = "off";
    }
    // The with_ball sprite already draws a ball, so the loose one hides while a pet plays with it.
    ballEl.dataset.phase = ball.phase;
    ballEl.style.transform = `translate(${ball.x - 7}px, ${-ball.y}px)`;
  }

  function step(s: Sim, now: number, dt: number) {
    const w = widthOf(s), max = Math.max(0, width() - w);
    const chasing = (ball.phase === "fly" || ball.phase === "ground") && now >= s.cooldown && s.anim !== "swipe";
    if (chasing) {
      const target = ball.phase === "fly" ? ball.x1 : ball.x;
      const center = s.x + w / 2, gap = target - center;
      if (ball.phase === "ground" && Math.abs(gap) < 12 * scale + 6) {
        ball.phase = "play"; ball.owner = s.id; ball.until = now + 3000;
        setAnim(s, "with_ball", now, 3000);
        return;
      }
      if (Math.abs(gap) > 4) s.dir = gap > 0 ? 1 : -1;
      if (s.anim !== "run") setAnim(s, "run", now, 60000);
      s.x += s.dir * (SPEED.run ?? 200) * scale * dt;
    } else {
      if (s.anim === "run") setAnim(s, "idle", now, rand(1500, 3000));
      if (now >= s.until && !(ball.phase === "play" && ball.owner === s.id)) wander(s, now);
      const speed = SPEED[s.anim];
      if (speed && !reduced) {
        s.x += s.dir * speed * scale * dt;
        if (s.x <= 0 || s.x >= max) s.dir = (s.dir * -1) as 1 | -1;
      }
    }
    s.x = Math.min(max, Math.max(0, s.x));
    paint(s);
  }

  function frame(t: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((t - (last || t)) / 1000, .05);
    last = t;
    stepBall(t);
    sims.forEach((s) => step(s, t, dt));
  }

  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  start();

  return {
    sync(pets) {
      const ids = new Set(pets.map((p) => p.id));
      sims.forEach((_, id) => { if (!ids.has(id)) sims.delete(id); });
      if (sims.size === 0) ball.phase = "off";
      const now = performance.now();
      for (const p of pets) {
        const el = field.querySelector<HTMLElement>(`[data-pet="${p.id}"]`);
        const img = el?.querySelector("img");
        if (!el || !img) continue;
        const existing = sims.get(p.id);
        if (existing && existing.el === el) continue;
        const sim: Sim = { id: p.id, kind: p.kind, color: p.color, el, img, x: rand(0, Math.max(1, width() - 100)), dir: Math.random() < .5 ? 1 : -1, anim: "idle", until: now + rand(500, 2500), cooldown: 0, naturalW: 0 };
        img.addEventListener("load", () => { sim.naturalW = img.naturalWidth; paint(sim); });
        sims.set(p.id, sim);
        // Warm the other animations so a state change never flashes an empty frame.
        kindOf(p.kind).anims.forEach((a) => { new Image().src = spriteUrl(p.kind, p.color, a); });
        paint(sim);
      }
    },
    setScale(next) { scale = next; sims.forEach(paint); },
    setActive(next) { active = next; if (active) start(); else stop(); },
    setReducedMotion(next) { reduced = next; },
    throwBall() {
      if (sims.size === 0) return;
      const now = performance.now();
      ball.throws = 1;
      launch(width() * .08, now);
    },
    pet(id) {
      const s = sims.get(id);
      if (!s) return;
      setAnim(s, "swipe", performance.now(), 1300);
      s.el.classList.remove("is-loved");
      void s.el.offsetWidth; // restart the heart animation
      s.el.classList.add("is-loved");
    },
    dispose() { stop(); sims.clear(); },
  };
}
