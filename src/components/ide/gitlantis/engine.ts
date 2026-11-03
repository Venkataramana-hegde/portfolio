import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { PRESETS, type Preset } from "./weather";
import { ASSETS, DEFAULT_SETTINGS, type BoatColors, type EngineHandle, type GitlantisSettings, type Landmark } from "./config";

type Callbacks = {
  onProgress(progress: number): void;
  onReady(): void;
  onError(): void;
  onCollide(id: string | null): void;
  onOpen(id: string): void;
  onHover(id: string | null): void;
  onHeading(degrees: number): void;
  onCycleWeather(): void;
};

type NodeEntry = {
  landmark: Landmark;
  group: THREE.Group;
  pivot: THREE.Object3D;
  marker: THREE.Mesh;
  title: THREE.Sprite;
  prompt: THREE.Sprite;
  baseY: number;
  sink: number;
  phase: number;
  scale: number;
  colliding: boolean;
};

const BOAT_START = new THREE.Vector3(0, -5.5, -20);
const MAP_LAYER = 1;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dark rounded plate with coloured text, like the extension's Backdrop. Height is in world units.
function labelSprite(text: string, worldHeight: number, color: string) {
  const px = 72, pad = 26;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 ${px}px system-ui, "Segoe UI", sans-serif`;
  const width = Math.ceil(measure.measureText(text).width) + pad * 2, height = px + pad * 1.4;
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(34,34,34,.86)";
  ctx.beginPath(); ctx.roundRect(0, 0, width, height, height * .3); ctx.fill();
  ctx.font = `600 ${px}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2 + 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  sprite.scale.set(worldHeight * width / height, worldHeight, 1);
  sprite.userData.baseScale = sprite.scale.clone();
  sprite.renderOrder = 20;
  return sprite;
}

export function createEngine(canvas: HTMLCanvasElement, host: HTMLElement, initial: GitlantisSettings, callbacks: Callbacks): EngineHandle | null {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
  catch { callbacks.onError(); return null; }

  let settings = initial;
  let mapFull = false, muted = false, started = false, disposed = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 1, 5000);
  camera.position.set(0, -50, 100);
  scene.add(camera);
  const mapCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
  mapCamera.layers.enable(MAP_LAYER);
  mapCamera.up.set(-1, 0, 0);

  // Lights, as in the extension.
  const ambientCool = new THREE.AmbientLight(0xffffff, .8), ambientWarm = new THREE.AmbientLight(0xfceec1, 1.5);
  const sunLight = new THREE.DirectionalLight(0xffffff, 1); sunLight.position.set(-100, 100, 100);
  scene.add(ambientCool, ambientWarm, sunLight);
  scene.fog = new THREE.FogExp2(0x9fb9c4, 0);

  const sky = new Sky();
  sky.scale.setScalar(450000);
  const skyUniforms = sky.material.uniforms;
  skyUniforms.turbidity.value = 5; skyUniforms.rayleigh.value = 2; skyUniforms.mieCoefficient.value = .05; skyUniforms.mieDirectionalG.value = .8;
  skyUniforms.sunPosition.value.set(.3, .1, .4);
  scene.add(sky);

  const boat = new THREE.Group();
  boat.position.copy(BOAT_START);
  const floating = new THREE.Group();
  floating.rotation.x = Math.PI;
  boat.add(floating);
  scene.add(boat);

  // Top-down map furniture lives on its own layer so the 3D view never sees it.
  const mapSea = new THREE.Mesh(new THREE.PlaneGeometry(40000, 40000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0a3d52, toneMapped: false, fog: false }));
  mapSea.position.y = -1; mapSea.layers.set(MAP_LAYER); scene.add(mapSea);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(55, 150, 3).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }));
  arrow.layers.set(MAP_LAYER); arrow.position.y = 300; scene.add(arrow);

  const entries: NodeEntry[] = [];
  const nodes = new THREE.Group(); scene.add(nodes);
  let water: Water | null = null;
  let pending: { landmarks: Landmark[]; seed: string } | null = null;
  const models: { folder?: THREE.Object3D; file?: THREE.Object3D } = {};
  const boatMeshes: Partial<Record<keyof BoatColors, THREE.Mesh[]>> = {};

  // ---- weather ---------------------------------------------------------------------------
  const numKeys = ["exposure", "ambient", "warm", "sun", "turbidity", "rayleigh", "mie", "mieG", "distortion", "fog", "rain", "stars", "rock", "cloudCoverage", "cloudDensity"] as const;
  const colorKeys = ["ambientColor", "warmColor", "sunColor", "glint", "water", "fogColor"] as const;
  let target: Preset = PRESETS[settings.weather] ?? PRESETS.Clear;
  const cur = Object.fromEntries(numKeys.map((k) => [k, target[k]])) as Record<(typeof numKeys)[number], number>;
  const curColor = Object.fromEntries(colorKeys.map((k) => [k, new THREE.Color(target[k])])) as Record<(typeof colorKeys)[number], THREE.Color>;
  const sunDir = new THREE.Vector3(...target.sunPos), waterSunDir = new THREE.Vector3(...target.waterSun).normalize(), scratchColor = new THREE.Color(), scratchVec = new THREE.Vector3();
  let flash = 0, echo = 0, nextStrike = 5;

  const RAIN = 4000, RAIN_BOX = 700, RAIN_TALL = 380, RAIN_LEN = 18;
  const drops = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) { drops[i * 3] = (Math.random() - .5) * RAIN_BOX; drops[i * 3 + 1] = Math.random() * RAIN_TALL; drops[i * 3 + 2] = (Math.random() - .5) * RAIN_BOX; }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RAIN * 6), 3).setUsage(THREE.DynamicDrawUsage));
  const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: 0xb9ccd8, transparent: true, opacity: .4, fog: false, toneMapped: false, depthWrite: false }));
  rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 15; scene.add(rain);
  // Drawn for the main camera only, so the water mirror does not reflect streaks of it.
  const rainMaterial = rain.material as THREE.LineBasicMaterial; let rainOpacity = 0;
  rain.onBeforeRender = (_r, _s, cam) => { rainMaterial.opacity = cam === camera ? rainOpacity : 0; };

  const starPositions = new Float32Array(1800 * 3);
  for (let i = 0; i < 1800; i++) {
    const y = .03 + Math.random() * .97, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - y * y);
    starPositions.set([Math.cos(a) * r * 4500, y * 4500, Math.sin(a) * r * 4500], i * 3);
  }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, toneMapped: false, depthWrite: false }));
  stars.frustumCulled = false; stars.visible = false; scene.add(stars);
  const starMaterial = stars.material as THREE.PointsMaterial;
  stars.onBeforeRender = (_r, _s, cam) => { starMaterial.opacity = cam === camera ? cur.stars : 0; };

  const blendWeather = (dt: number) => {
    const t = 1 - Math.exp(-dt * 1.2);
    numKeys.forEach((k) => { cur[k] += (target[k] - cur[k]) * t; });
    colorKeys.forEach((k) => curColor[k].lerp(scratchColor.set(target[k]), t));
    sunDir.lerp(scratchVec.set(...target.sunPos), t);
    waterSunDir.lerp(scratchVec.set(...target.waterSun).normalize(), t);
    if (target.lightning) {
      nextStrike -= dt;
      if (nextStrike <= 0) { flash = 1; echo = .14; nextStrike = 3 + Math.random() * 7; }
      if (echo > 0 && (echo -= dt) <= 0) flash = Math.max(flash, .8);
    }
    flash = Math.max(0, flash - dt * 4);
    renderer.toneMappingExposure = cur.exposure + flash * 1.2;
    ambientCool.intensity = cur.ambient + flash * 1.4; ambientCool.color.copy(curColor.ambientColor);
    ambientWarm.intensity = cur.warm; ambientWarm.color.copy(curColor.warmColor);
    sunLight.intensity = cur.sun + flash * 1.4; sunLight.color.copy(curColor.sunColor);
    skyUniforms.turbidity.value = cur.turbidity; skyUniforms.rayleigh.value = cur.rayleigh;
    skyUniforms.mieCoefficient.value = cur.mie; skyUniforms.mieDirectionalG.value = cur.mieG;
    skyUniforms.sunPosition.value.copy(sunDir);
    skyUniforms.cloudCoverage.value = cur.cloudCoverage; skyUniforms.cloudDensity.value = cur.cloudDensity;
    const fog = scene.fog as THREE.FogExp2; fog.color.copy(curColor.fogColor); fog.density = cur.fog;
    if (water) {
      water.material.uniforms.waterColor.value.copy(curColor.water);
      water.material.uniforms.sunColor.value.copy(curColor.glint);
      water.material.uniforms.distortionScale.value = cur.distortion;
      water.material.uniforms.sunDirection.value.copy(waterSunDir).normalize();
    }
    stars.visible = cur.stars > .01; 
    stars.position.copy(camera.position);
  };

  const fallRain = (dt: number) => {
    const count = Math.round(cur.rain * RAIN);
    rain.visible = count > 8;
    if (!rain.visible) return;
    const attr = rainGeometry.getAttribute("position") as THREE.BufferAttribute, out = attr.array as Float32Array;
    const fall = 480 + cur.rain * 220, slant = 2 + cur.rain * 7;
    for (let i = 0; i < count; i++) {
      let y = drops[i * 3 + 1] - fall * dt;
      if (y < 0) y += RAIN_TALL;
      drops[i * 3 + 1] = y;
      const x = drops[i * 3], z = drops[i * 3 + 2], o = i * 6;
      out[o] = x; out[o + 1] = y; out[o + 2] = z;
      out[o + 3] = x - slant; out[o + 4] = y + RAIN_LEN; out[o + 5] = z;
    }
    attr.needsUpdate = true;
    rainGeometry.setDrawRange(0, count * 2);
    rainOpacity = .22 + cur.rain * .22;
    rain.position.set(camera.position.x, camera.position.y - 90, camera.position.z);
  };

  // Audio is created up front but only plays after the visitor presses Start (browser autoplay rules).
  const listener = new THREE.AudioListener(); camera.add(listener);
  const waves = new THREE.Audio(listener), horn = new THREE.Audio(listener);
  const applyVolume = () => { const v = muted ? 0 : settings.volume; waves.setVolume(v); horn.setVolume(v); };

  const manager = new THREE.LoadingManager();
  let best = 0;
  manager.onProgress = (_url, loaded, total) => { best = Math.max(best, loaded / Math.max(total, 1)); callbacks.onProgress(best * 100); };
  manager.onError = () => callbacks.onError();
  manager.onLoad = () => { if (disposed) return; callbacks.onProgress(100); callbacks.onReady(); };
  const gltf = new GLTFLoader(manager);
  const audioLoader = new THREE.AudioLoader(manager);

  const recolour = () => {
    (Object.keys(boatMeshes) as (keyof BoatColors)[]).forEach((key) => boatMeshes[key]?.forEach((mesh) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.color.set(settings.boatColors[key]);
    }));
  };

  const buildBoat = (root: THREE.Object3D) => {
    const solid = (roughness: number, metalness: number) => new THREE.MeshStandardMaterial({ roughness, metalness });
    // The extension swaps these materials for flat standard ones, which is what gives the boat its look.
    const byMaterial: Record<string, [keyof BoatColors, THREE.Material | null]> = {
      boat_body: ["walls", solid(.8, .8)], boat_buffer: ["floaters", solid(.4, .4)], boat_roof_accessory: ["roof", solid(.8, .8)],
      PaletteMaterial001: ["hull", solid(.8, .8)], PaletteMaterial003: ["rails", null], PaletteMaterial004: ["body", null],
    };
    const scaleGroup = new THREE.Group(); scaleGroup.scale.setScalar(.03);
    scaleGroup.add(root); floating.add(scaleGroup);
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      // The extension draws the raw geometry and ignores node rotations; this model carries a -90deg X turn that would lay the boat on its side.
      // glTF applies translation after rotation, so the quantization offset is un-rotated too.
      child.position.applyQuaternion(child.quaternion.clone().invert());
      child.quaternion.identity();
      const entry = byMaterial[(child.material as THREE.Material).name];
      if (!entry) return;
      const [key, replacement] = entry;
      if (replacement) child.material = replacement;
      (boatMeshes[key] ??= []).push(child);
    });
    recolour();
  };

  gltf.load(ASSETS.boat, (g) => buildBoat(g.scene), undefined, () => callbacks.onError());
  gltf.load(ASSETS.folder, (g) => { models.folder = g.scene; rebuild(); }, undefined, () => callbacks.onError());
  gltf.load(ASSETS.file, (g) => { models.file = g.scene; rebuild(); }, undefined, () => callbacks.onError());
  new THREE.TextureLoader(manager).load(ASSETS.ocean, (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    water = new Water(new THREE.PlaneGeometry(30000, 30000), {
      textureWidth: 512, textureHeight: 512, waterNormals: texture, sunDirection: new THREE.Vector3(-1, 1, 1).normalize(),
      sunColor: 0xffffff, waterColor: 0x001e0f, distortionScale: .7, fog: true,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
  });
  audioLoader.load(ASSETS.waves, (buffer) => { waves.setBuffer(buffer); waves.setLoop(true); applyVolume(); });
  audioLoader.load(ASSETS.horn, (buffer) => { horn.setBuffer(buffer); horn.setLoop(true); applyVolume(); });

  // ---- landmarks -------------------------------------------------------------------------
  const clearNodes = () => {
    entries.forEach(({ group, marker, title, prompt }) => {
      nodes.remove(group, title, prompt); scene.remove(marker);
      [title, prompt].forEach((s) => { s.material.map?.dispose(); s.material.dispose(); });
      marker.geometry.dispose(); (marker.material as THREE.Material).dispose();
    });
    entries.length = 0;
  };

  const place = (count: number, seed: string) => {
    const rand = seeded(hash(seed));
    const radius = 1500, grid = Math.max(1, Math.ceil(Math.sqrt(count * 1.5))), cell = radius * 2 / grid;
    const cells: [number, number][] = [];
    for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) cells.push([(i - grid / 2) * cell + boat.position.x, (j - grid / 2) * cell + boat.position.z]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const spots: [number, number][] = [];
    for (const [cx, cz] of cells) {
      if (spots.length >= count) break;
      for (let attempt = 0; attempt < 100; attempt++) {
        const x = cx + (rand() - .5) * cell * .8, z = cz + (rand() - .5) * cell * .8;
        if (Math.hypot(x - boat.position.x, z - boat.position.z) < 500) continue;
        if (spots.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 300)) continue;
        spots.push([x, z]); break;
      }
    }
    // A crowded folder can run out of room; the rest go on a spiral so nothing goes missing.
    for (let k = 0; spots.length < count; k++) spots.push([boat.position.x + Math.cos(k * 2.4) * (700 + k * 140), boat.position.z + Math.sin(k * 2.4) * (700 + k * 140)]);
    return spots;
  };

  function rebuild() {
    clearNodes();
    if (!pending || !models.folder || !models.file) return;
    const { landmarks, seed } = pending;
    const spots = place(landmarks.length, seed);
    const rand = seeded(hash(seed + "phase"));
    landmarks.forEach((landmark, i) => {
      const folder = landmark.kind === "folder";
      const scale = folder ? 7 : 27, baseY = folder ? 2.5 : 13;
      const group = new THREE.Group(); group.position.y = baseY;
      const pivot = new THREE.Object3D();
      const model = (folder ? models.folder! : models.file!).clone(true);
      model.scale.setScalar(scale);
      pivot.add(model); group.add(pivot);
      pivot.position.set(spots[i][0], -5, spots[i][1]);
      const title = labelSprite(landmark.label, folder ? 21 : 16, "#f2bc07");
      const prompt = labelSprite(landmark.file ? "Press SHIFT+ENTER to open" : "Press SHIFT+ENTER to explore", folder ? 9 : 7, "#ffffff");
      prompt.visible = false;
      const marker = new THREE.Mesh(new THREE.CircleGeometry(folder ? 75 : 55, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: folder ? 0xf2bc07 : 0x7fd1c7, toneMapped: false, fog: false }));
      marker.layers.set(MAP_LAYER); marker.position.set(spots[i][0], 200, spots[i][1]);
      [group, title, prompt, marker].forEach((o) => o.traverse((c) => { c.userData.nodeId = landmark.id; }));
      nodes.add(group, title, prompt); scene.add(marker);
      entries.push({ landmark, group, pivot, marker, title, prompt, baseY, sink: 5, phase: rand() * Math.PI * 2, scale, colliding: false });
    });
  }

  // ---- input -----------------------------------------------------------------------------
  const keys = { forward: false, backward: false, left: false, right: false };
  const typing = (target: EventTarget | null) => target instanceof Element && target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='dialog'], [role='textbox'], [role='listbox']") !== null;
  const mapKeys: Record<string, keyof typeof keys> = { arrowup: "forward", w: "forward", keyw: "forward", arrowdown: "backward", s: "backward", keys: "backward", arrowleft: "left", a: "left", keya: "left", arrowright: "right", d: "right", keyd: "right" };
  // Match both the typed character and the physical key, so other layouts and input methods still steer.
  const steering = (e: KeyboardEvent) => [e.key.toLowerCase(), e.code.toLowerCase()].map((name) => mapKeys[name]).find(Boolean);
  let lastOpen = 0;
  const openColliding = () => {
    const hit = entries.find((e) => e.colliding);
    if (!hit || performance.now() - lastOpen < 500) return;
    lastOpen = performance.now();
    callbacks.onOpen(hit.landmark.id);
  };
  const honk = (on: boolean) => {
    if (!started || !horn.buffer) return;
    if (on && !horn.isPlaying) horn.play();
    if (!on && horn.isPlaying) horn.stop();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!started || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase(), dir = steering(e);
    if (dir) { keys[dir] = true; e.preventDefault(); }
    else if (k === "h") honk(true);
    else if (k === "t" && !e.repeat) callbacks.onCycleWeather();
    else if (k === "f" && !e.repeat) { mapFull = !mapFull; callbacks.onHover(null); host.dispatchEvent(new CustomEvent("gitlantis:map", { detail: mapFull })); }
    else if (k === "enter" && e.shiftKey) { e.preventDefault(); openColliding(); }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase(), dir = steering(e);
    if (dir) keys[dir] = false;
    else if (k === "h") honk(false);
  };
  const onBlur = () => { keys.forward = keys.backward = keys.left = keys.right = false; honk(false); };
  window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("blur", onBlur);

  // ---- picking ---------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster(); raycaster.layers.enableAll();
  const pointer = new THREE.Vector2();
  let mapRect = { x: 0, y: 0, w: 0, h: 0 }; // CSS px, top-left origin
  const pick = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left, py = event.clientY - rect.top;
    const inMap = settings.minimap === "Show" && started && px >= mapRect.x && px <= mapRect.x + mapRect.w && py >= mapRect.y && py <= mapRect.y + mapRect.h;
    if (inMap) pointer.set((px - mapRect.x) / mapRect.w * 2 - 1, -((py - mapRect.y) / mapRect.h) * 2 + 1);
    else pointer.set(px / rect.width * 2 - 1, -(py / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, inMap ? mapCamera : camera);
    const targets = entries.flatMap((e) => [e.group, e.title, e.marker]);
    const hit = raycaster.intersectObjects(targets, true).find((h) => h.object.visible && h.object.userData.nodeId);
    return hit ? (hit.object.userData.nodeId as string) : null;
  };
  let hovered: string | null = null, lastMove = 0, downAt: { x: number; y: number } | null = null;
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || performance.now() - lastMove < 70) return;
    lastMove = performance.now();
    const id = started ? pick(event) : null;
    if (id !== hovered) { hovered = id; canvas.style.cursor = id ? "pointer" : "default"; callbacks.onHover(id); }
  };
  const onDown = (event: PointerEvent) => { (document.activeElement as HTMLElement | null)?.blur?.(); downAt = { x: event.clientX, y: event.clientY }; };
  const onUp = (event: PointerEvent) => {
    if (!started || !downAt || Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 6) return;
    const id = pick(event);
    if (id) callbacks.onOpen(id);
  };
  canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerdown", onDown); canvas.addEventListener("pointerup", onUp);

  // ---- sizing ----------------------------------------------------------------------------
  let width = 1, height = 1;
  const resize = () => {
    width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();

  // ---- frame loop ------------------------------------------------------------------------
  const state = { speed: 0, angular: 0, direction: 0 };
  let last = performance.now(), elapsed = 0;
  const idealPosition = new THREE.Vector3(), idealLook = new THREE.Vector3(), tmp = new THREE.Vector3(), quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0), fixed = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, 0));
  const correction = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
  const lookMatrix = new THREE.Matrix4(), faceTarget = new THREE.Quaternion();
  let reportHeading = 0, lastCollision = "";

  const frame = () => {
    const now = performance.now(), delta = Math.min((now - last) / 1000, .1);
    last = now; elapsed += delta;
    const k = Math.min(delta * 60, 6); // frames' worth of motion, as the extension's per-frame constants expect; high cap keeps slow machines in real time
    const s = settings;

    // Boat: same acceleration model as the extension.
    const movement = 1 - Math.min(Math.abs(state.speed) / s.boatSpeed, 1);
    floating.rotation.y = Math.sin(elapsed * s.rockingSpeed * Math.PI * 2) * s.rockingAmplitude * movement * cur.rock;
    floating.position.y = Math.sin(elapsed * s.bobbingSpeed * Math.PI * 2) * s.bobbingAmplitude * movement * cur.rock;
    let targetSpeed = 0, active = 0;
    if (keys.forward && !keys.backward) { targetSpeed = s.boatSpeed; active = 1; }
    else if (keys.backward && !keys.forward) { targetSpeed = -s.boatSpeed * .5; active = -1; }
    if (active !== 0) state.direction = active;
    else if (Math.abs(state.speed) < .001) state.direction = 0;
    else state.direction = state.speed > 0 ? 1 : -1;
    if (targetSpeed !== 0) state.speed += (targetSpeed - state.speed) * (1 - Math.pow(1 - s.acceleration, k));
    else state.speed *= Math.pow(1 - s.deceleration, k);
    const still = Math.abs(state.speed) < .001, reversing = !still && state.direction === -1;
    let turn = 0;
    if (keys.left) turn = reversing ? -s.turnSpeed : s.turnSpeed;
    if (keys.right) turn = reversing ? s.turnSpeed : -s.turnSpeed;
    if (turn !== 0) state.angular += (turn - state.angular) * (1 - Math.pow(.9, k));
    else state.angular *= Math.pow(1 - s.turnDeceleration, k);
    // Only snap to rest once the key is released: the first frame's gain is below the threshold on 144Hz+ screens, which would otherwise cancel every turn.
    if (state.angular !== 0) boat.rotateY(state.angular * k);
    if (state.speed !== 0) boat.translateX(-state.speed * k);
    if (turn === 0 && Math.abs(state.angular) < .001) state.angular = 0;
    if (targetSpeed === 0 && still) state.speed = 0;

    // Landmarks bob, turn to face the boat, and push it away when it gets too close.
    const push = tmp.set(0, 0, 0);
    let colliding = "";
    for (const e of entries) {
      e.pivot.position.y = -e.sink + Math.sin(elapsed * 3 + e.phase) * 2;
      if (mapFull) e.pivot.quaternion.copy(fixed);
      else {
        lookMatrix.lookAt(e.pivot.position, tmp2.set(boat.position.x, e.pivot.position.y, boat.position.z), up);
        faceTarget.setFromRotationMatrix(lookMatrix).multiply(correction);
        e.pivot.quaternion.slerp(faceTarget, 1 - Math.pow(.9, k));
      }
      const dx = boat.position.x - e.pivot.position.x, dz = boat.position.z - e.pivot.position.z;
      const distance = Math.hypot(dx, dz);
      const hit = distance < s.collisionRadius && distance > .01;
      e.colliding = hit;
      if (hit) {
        if (!colliding) colliding = e.landmark.id;
        const strength = (s.collisionRadius - distance) / s.collisionRadius * s.collisionPushStrength / distance;
        push.x += dx * strength; push.z += dz * strength;
      }
      const labelY = e.baseY + e.pivot.position.y + (e.landmark.kind === "folder" ? 23 : 2.68) * e.scale + (e.landmark.kind === "folder" ? 6 : 8);
      e.title.position.set(e.pivot.position.x, labelY, e.pivot.position.z);
      e.prompt.position.set(e.pivot.position.x, e.baseY + e.pivot.position.y + (e.landmark.kind === "folder" ? 3.5 * 7 : 0.8 * 27) , e.pivot.position.z);
      e.prompt.visible = hit;
    }
    boat.position.add(push);
    if (colliding !== lastCollision) { lastCollision = colliding; callbacks.onCollide(colliding || null); }

    // Camera rig: behind and above the boat, easing toward the ideal spot.
    boat.getWorldQuaternion(quat);
    idealPosition.set(150, 25, 25).applyQuaternion(quat).add(boat.position);
    idealLook.set(0, 20, -.5).applyQuaternion(quat).add(boat.position);
    camera.position.lerp(idealPosition, 1 - Math.pow(.9, k));
    camera.lookAt(idealLook);

    if (water) {
      water.position.set(boat.position.x, 0, boat.position.z);
      water.material.uniforms.time.value += delta;
    }
    sky.position.copy(boat.position);
    blendWeather(delta); fallRain(delta);

    reportHeading += delta;
    if (reportHeading > .033) {
      reportHeading = 0;
      const yaw = new THREE.Euler().setFromQuaternion(quat, "YXZ").y;
      callbacks.onHeading((((-yaw * 180 / Math.PI) % 360) + 360) % 360);
    }

    // Main view.
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.render(scene, camera);

    // Overhead map, drawn into a viewport of the same canvas.
    if (settings.minimap === "Show" && started) {
      const size = mapFull ? 0 : Math.min(150, Math.max(96, width * .3));
      const mw = mapFull ? width : size, mh = mapFull ? height : size;
      const mx = mapFull ? 0 : width - size - 12, my = mapFull ? 0 : 12; // top-left origin
      mapRect = { x: mx, y: my, w: mw, h: mh };
      const extent = mapFull ? 4200 : 1500;
      const halfH = extent / 2, halfW = halfH * mw / mh;
      mapCamera.left = -halfW; mapCamera.right = halfW; mapCamera.top = halfH; mapCamera.bottom = -halfH;
      mapCamera.updateProjectionMatrix();
      mapCamera.position.set(boat.position.x, 800, boat.position.z);
      mapCamera.lookAt(boat.position.x, 0, boat.position.z);
      arrow.position.set(boat.position.x, 300, boat.position.z);
      arrow.quaternion.copy(quat);
      const boost = mapFull ? 2.4 : 1;
      arrow.scale.setScalar(boost);
      entries.forEach((e) => {
        e.marker.scale.setScalar(boost);
        e.title.visible = mapFull; e.title.scale.copy(e.title.userData.baseScale).multiplyScalar(mapFull ? 4.6 : 1);
        // On the map the label sits under its disc (screen-down is +X) and ignores depth so models never hide it.
        e.title.material.depthTest = false; e.title.position.set(e.pivot.position.x + (e.landmark.kind === "folder" ? 75 : 55) * boost + e.title.scale.y * .65, 400, e.pivot.position.z);
        e.prompt.visible = false;
      });
      if (water) water.visible = false;
      sky.visible = false; rain.visible = false; stars.visible = false;
      const fogged = scene.fog; scene.fog = null;
      renderer.clearDepth();
      renderer.setScissorTest(true);
      const bottom = height - my - mh;
      renderer.setViewport(mx, bottom, mw, mh); renderer.setScissor(mx, bottom, mw, mh);
      const autoClear = renderer.autoClear; renderer.autoClear = false;
      renderer.setClearColor(0x0a3d52, 1);
      renderer.clear(true, true, false);
      renderer.render(scene, mapCamera);
      renderer.autoClear = autoClear;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);
      if (water) water.visible = true;
      sky.visible = true; scene.fog = fogged;
      entries.forEach((e) => { e.title.visible = true; e.title.material.depthTest = true; e.title.scale.copy(e.title.userData.baseScale); e.prompt.visible = e.colliding; });
    } else mapRect = { x: 0, y: 0, w: 0, h: 0 };
  };
  const tmp2 = new THREE.Vector3();
  renderer.setAnimationLoop(frame);

  // Moves the camera to its rest spot at once so the first frame is not underwater.
  boat.getWorldQuaternion(quat);
  camera.position.copy(idealPosition.set(150, 25, 25).applyQuaternion(quat).add(boat.position));

  return {
    setLandmarks(landmarks, seed) { pending = { landmarks, seed }; rebuild(); },
    setSettings(next) { settings = { ...DEFAULT_SETTINGS, ...next }; target = PRESETS[settings.weather] ?? PRESETS.Clear; recolour(); applyVolume(); },
    setMapFull(full) { mapFull = full; },
    setMuted(value) { muted = value; applyVolume(); },
    setKey(key, down) { keys[key] = down; },
    honk,
    start() {
      started = true;
      (document.activeElement as HTMLElement | null)?.blur?.();
      applyVolume();
      listener.context.resume().then(() => { if (!disposed && waves.buffer && !waves.isPlaying) waves.play(); }).catch(() => {});
    },
    openColliding,
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null); observer.disconnect();
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerdown", onDown); canvas.removeEventListener("pointerup", onUp);
      if (waves.isPlaying) waves.stop();
      if (horn.isPlaying) horn.stop();
      clearNodes();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments)) return;
        object.geometry.dispose();
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material: THREE.Material & { map?: THREE.Texture | null }) => { material.map?.dispose(); material.dispose(); });
      });
      water?.material.dispose();
      // No forceContextLoss: React Strict Mode re-runs the effect on the same canvas, which needs a live context.
      renderer.dispose();
    },
  };
}
