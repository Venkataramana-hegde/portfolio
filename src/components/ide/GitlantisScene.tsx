"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { WorkspaceFile } from "@/content/workspace";

export type Landmark = { id: string; label: string; x: number; z: number; kind: "folder" | "file"; file?: WorkspaceFile; overview?: boolean };
export type BoatPosition = { x: number; z: number; angle: number };
export type ScenePrefs = { minimap: boolean; breadcrumbs: boolean; labels: boolean; waves: boolean; mapSize: number };

type LandmarkModel = { landmark: Landmark; group: THREE.Group; label: THREE.Sprite; glow: THREE.Mesh; light?: THREE.PointLight };

const clamp = THREE.MathUtils.clamp;
const standard = (color: number, roughness = .76, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function labelSprite(text: string, folder: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = folder ? "#122e40" : "#133445";
  ctx.beginPath(); ctx.roundRect(8, 12, 496, 100, 22); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = folder ? "#edc88a" : "#e28877"; ctx.stroke();
  ctx.font = "600 37px system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#f8f4e7";
  ctx.fillText(text.length > 26 ? text.slice(0, 24) + "…" : text, 256, 64, 445);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(5.8, 1.45, 1);
  return sprite;
}

function buildLighthouse(landmark: Landmark): LandmarkModel {
  const group = new THREE.Group();
  group.position.set(landmark.x, 0, landmark.z);
  const rock = standard(0x667c78), stone = standard(0xf2ead9), red = standard(0xc96557), dark = standard(0x26394a), glass = new THREE.MeshStandardMaterial({ color: 0xffdfa1, emissive: 0xffb454, emissiveIntensity: 1.45, roughness: .2 });
  mesh(new THREE.CylinderGeometry(2.5, 3.6, .65, 9), rock, group, 0, -.14);
  mesh(new THREE.CylinderGeometry(.88, 1.28, 6.6, 12), stone, group, 0, 3.4);
  mesh(new THREE.CylinderGeometry(1.05, 1.18, .7, 12), red, group, 0, 1.7);
  mesh(new THREE.CylinderGeometry(.95, 1.05, .65, 12), red, group, 0, 4.4);
  mesh(new THREE.CylinderGeometry(1.3, 1.25, .24, 12), dark, group, 0, 6.9);
  mesh(new THREE.CylinderGeometry(.83, .83, .95, 10), glass, group, 0, 7.48);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    mesh(new THREE.CylinderGeometry(.045, .045, 1.07, 5), dark, group, Math.sin(a) * .8, 7.48, Math.cos(a) * .8);
  }
  mesh(new THREE.CylinderGeometry(1.3, 1.15, .21, 12), dark, group, 0, 8.05);
  mesh(new THREE.ConeGeometry(1.42, .9, 12), red, group, 0, 8.57);
  const light = new THREE.PointLight(0xffc27a, 11, 15, 2);
  light.position.set(0, 7.5, 0); group.add(light);
  const label = labelSprite(landmark.label, true); label.position.y = 10.7; group.add(label);
  const glow = mesh(new THREE.RingGeometry(2.7, 3.2, 40), new THREE.MeshBasicMaterial({ color: 0xffd68b, transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }), group, 0, .05);
  glow.rotation.x = -Math.PI / 2;
  group.traverse((obj) => { obj.userData.landmarkId = landmark.id; });
  return { landmark, group, label, glow, light };
}

function buildBuoy(landmark: Landmark): LandmarkModel {
  const group = new THREE.Group(); group.position.set(landmark.x, 0, landmark.z);
  const red = standard(0xd96755), cream = standard(0xffefd2), dark = standard(0x223846), amber = new THREE.MeshStandardMaterial({ color: 0xffdf9c, emissive: 0xffa544, emissiveIntensity: 1.6 });
  mesh(new THREE.CylinderGeometry(.48, .85, 1.5, 12), red, group, 0, .9);
  mesh(new THREE.CylinderGeometry(.65, .63, .23, 12), cream, group, 0, 1.1);
  mesh(new THREE.CylinderGeometry(.26, .26, .55, 10), dark, group, 0, 1.93);
  mesh(new THREE.SphereGeometry(.24, 10, 8), amber, group, 0, 2.32);
  mesh(new THREE.TorusGeometry(.88, .15, 8, 24), dark, group, 0, .65).rotation.x = Math.PI / 2;
  const label = labelSprite(landmark.label, false); label.position.y = 3.8; label.scale.set(5.3, 1.32, 1); group.add(label);
  const glow = mesh(new THREE.RingGeometry(1.25, 1.55, 32), new THREE.MeshBasicMaterial({ color: 0xffb58b, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false }), group, 0, .09);
  glow.rotation.x = -Math.PI / 2;
  group.traverse((obj) => { obj.userData.landmarkId = landmark.id; });
  return { landmark, group, label, glow };
}

function buildBoat() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const hull = standard(0x754937), rim = standard(0xc88e5a), cream = standard(0xf7ebcf), sailRed = standard(0xcf6c5a), mast = standard(0x654836);
  const outline = new THREE.Shape();
  outline.moveTo(0, 2.5); outline.bezierCurveTo(1.35, 1.5, 1.4, -1, .75, -2.2); outline.quadraticCurveTo(0, -2.55, -.75, -2.2); outline.bezierCurveTo(-1.4, -1, -1.35, 1.5, 0, 2.5);
  const hullGeo = new THREE.ExtrudeGeometry(outline, { depth: .7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .13, bevelThickness: .12 });
  hullGeo.rotateX(Math.PI / 2); hullGeo.translate(0, .8, 0);
  mesh(hullGeo, hull, body);
  const deck = mesh(new THREE.CylinderGeometry(1.02, 1.02, .13, 18), rim, body, 0, .86, -.2); deck.scale.set(1, 1, 1.9);
  mesh(new THREE.BoxGeometry(1.4, .5, 1.25), cream, body, 0, 1.18, -.95);
  mesh(new THREE.CylinderGeometry(.07, .08, 4.8, 8), mast, body, 0, 3.25, .25);
  const sailGeom = new THREE.BufferGeometry();
  sailGeom.setAttribute("position", new THREE.Float32BufferAttribute([.12, 5.45, .25, .12, 1.52, .25, 2.25, 1.52, .25, -.12, 4.6, .25, -.12, 1.75, .25, -1.15, 1.75, .25], 3));
  sailGeom.computeVertexNormals();
  mesh(sailGeom, new THREE.MeshStandardMaterial({ color: 0xf5ecd4, side: THREE.DoubleSide, roughness: .8 }), body);
  const redSail = mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([-.12, 4.6, .26, -.12, 1.75, .26, -1.15, 1.75, .26], 3)), new THREE.MeshStandardMaterial({ color: 0xd66f59, side: THREE.DoubleSide }), body);
  redSail.geometry.computeVertexNormals();
  const wake = new THREE.Group(); root.add(wake);
  for (let i = 0; i < 6; i++) {
    const ring = mesh(new THREE.RingGeometry(1.1 + i * .42, 1.16 + i * .42, 24, 1, Math.PI * .13, Math.PI * .74), new THREE.MeshBasicMaterial({ color: 0xb8ecdf, transparent: true, opacity: .3 - i * .035, side: THREE.DoubleSide, depthWrite: false }), wake, 0, .06, -2 - i * .7);
    ring.rotation.x = -Math.PI / 2;
  }
  return { root, body, wake };
}

const oceanVertex = `
uniform float uTime; uniform float uWaves; varying vec3 vWorld; varying float vWave;
float wave(vec2 p){ return sin(p.x*.27+uTime*.8)*.15 + sin(p.y*.35-uTime*1.1)*.11 + sin((p.x+p.y)*.17+uTime*.55)*.19; }
void main(){ vec3 p=position; p.z += wave(p.xy)*uWaves; vec4 world=modelMatrix*vec4(p,1.0); vWorld=world.xyz; vWave=p.z; gl_Position=projectionMatrix*viewMatrix*world; }
`;
const oceanFragment = `
uniform float uTime; varying vec3 vWorld; varying float vWave;
void main(){ float stripe=sin(vWorld.x*.72+vWorld.z*.55+uTime*.7)*sin(vWorld.z*.38-uTime*.4); float foam=smoothstep(.91,.995,stripe); vec3 deep=vec3(.018,.16,.23); vec3 light=vec3(.07,.38,.43); vec3 color=mix(deep,light,clamp(vWave*1.3+.47,0.,1.)); color+=foam*vec3(.025,.065,.07); float haze=1.-exp(-length(vWorld.xz)*.003); color=mix(color,vec3(.23,.46,.52),haze*.65); gl_FragColor=vec4(color,1.); }
`;
const skyVertex = `varying vec3 vPosition; void main(){ vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
const skyFragment = `varying vec3 vPosition; void main(){ float h=clamp(normalize(vPosition).y*.5+.5,0.,1.); vec3 horizon=vec3(.79,.71,.58); vec3 middle=vec3(.34,.61,.66); vec3 high=vec3(.045,.19,.31); vec3 color=mix(horizon,middle,smoothstep(.47,.54,h)); color=mix(color,high,smoothstep(.51,.68,h)); gl_FragColor=vec4(color,1.); }`;

export function GitlantisScene({ landmarks, positionRef, keysRef, prefs, onPosition, onHover, onActivate }: {
  landmarks: Landmark[];
  positionRef: React.RefObject<BoatPosition>;
  keysRef: React.RefObject<Set<string>>;
  prefs: ScenePrefs;
  onPosition: (position: BoatPosition) => void;
  onHover: (id: string | null) => void;
  onActivate: (landmark: Landmark) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const prefsRef = useRef(prefs); prefsRef.current = prefs;
  const onPositionRef = useRef(onPosition); onPositionRef.current = onPosition;
  const onHoverRef = useRef(onHover); onHoverRef.current = onHover;
  const onActivateRef = useRef(onActivate); onActivateRef.current = onActivate;
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current, host = hostRef.current;
    if (!canvas || !host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x84b2b1, .005);
    const sky = mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false, fog: false }), scene);
    sky.frustumCulled = false;
    const camera = new THREE.PerspectiveCamera(60, 1, .1, 900);
    camera.position.set(0, 7, -11);
    scene.add(new THREE.HemisphereLight(0xffedce, 0x204050, 2.4));
    const sunLight = new THREE.DirectionalLight(0xffd7a3, 3.4);
    sunLight.position.set(-30, 55, 80); scene.add(sunLight);
    const sun = mesh(new THREE.SphereGeometry(14, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd39b, fog: false }), scene, -88, 35, 360);
    sun.renderOrder = -1;
    const seaMaterial = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uWaves: { value: 1 } }, vertexShader: oceanVertex, fragmentShader: oceanFragment, side: THREE.DoubleSide });
    const sea = mesh(new THREE.PlaneGeometry(1100, 1100, 120, 120), seaMaterial, scene);
    sea.rotation.x = -Math.PI / 2;
    // Low islands on the far horizon give scale without competing with file landmarks.
    const distantMaterial = standard(0x3d6970);
    for (let i = 0; i < 18; i++) {
      const a = i * 2.399;
      const distance = 175 + (i % 4) * 23;
      const hill = mesh(new THREE.ConeGeometry(16 + i % 3 * 8, 9 + i % 4 * 3, 7), distantMaterial, scene, Math.sin(a) * distance, 1.6, Math.cos(a) * distance);
      hill.scale.z = 1.8;
    }
    const models = landmarks.map((landmark) => landmark.kind === "folder" || landmark.overview ? buildLighthouse(landmark) : buildBuoy(landmark));
    models.forEach(({ group }) => scene.add(group));
    const modelById = new Map(models.map((model) => [model.landmark.id, model]));
    const boat = buildBoat(); scene.add(boat.root);
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const selectables = models.flatMap((model) => model.group.children.filter((obj) => obj instanceof THREE.Mesh || obj instanceof THREE.Sprite));
    const resize = () => { const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    let hovered: string | null = null;
    let drag: { x: number; y: number; moved: boolean } | null = null;
    let zoom = 11;
    const pointerAt = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(selectables, true)[0]; return hit?.object.userData.landmarkId as string | undefined; };
    const down = (event: PointerEvent) => { host.parentElement?.focus(); drag = { x: event.clientX, y: event.clientY, moved: false }; canvas.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => {
      if (drag && event.buttons) { const dx = event.clientX - drag.x; if (Math.abs(dx) > 1 || Math.abs(event.clientY - drag.y) > 1) drag.moved = true; positionRef.current.angle += dx * .004; drag.x = event.clientX; drag.y = event.clientY; }
      const id = pointerAt(event) ?? null;
      if (id !== hovered) { hovered = id; onHoverRef.current(id); canvas.style.cursor = id ? "pointer" : drag?.moved ? "grabbing" : "grab"; }
    };
    const up = (event: PointerEvent) => { if (drag && !drag.moved) { const id = pointerAt(event); const target = id && modelById.get(id); if (target) onActivateRef.current(target.landmark); } drag = null; };
    const leave = () => { if (hovered) { hovered = null; onHoverRef.current(null); } };
    const wheel = (event: WheelEvent) => { event.preventDefault(); zoom = clamp(zoom + event.deltaY * .015, 6.5, 22); };
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointerleave", leave); canvas.addEventListener("wheel", wheel, { passive: false });
    let last = 0, report = 0, velocity = 0, turnVelocity = 0;
    const cameraTarget = new THREE.Vector3();
    const animate = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
      const t = now * .001;
      const keys = keysRef.current, pos = positionRef.current;
      const forward = Number(keys.has("ArrowUp") || keys.has("w")) - Number(keys.has("ArrowDown") || keys.has("s"));
      const turn = Number(keys.has("ArrowRight") || keys.has("d")) - Number(keys.has("ArrowLeft") || keys.has("a"));
      velocity = THREE.MathUtils.damp(velocity, forward * 11, 2.1, dt);
      turnVelocity = THREE.MathUtils.damp(turnVelocity, turn * 1.55, 3.4, dt);
      pos.angle += turnVelocity * dt;
      pos.x = clamp(pos.x - Math.sin(pos.angle) * velocity * dt, -75, 75);
      pos.z = clamp(pos.z + Math.cos(pos.angle) * velocity * dt, -18, Math.max(55, Math.ceil(landmarks.length / 5) * 13 + 18));
      boat.root.position.set(pos.x, 0, pos.z);
      boat.root.rotation.y = -pos.angle;
      boat.body.position.y = Math.sin(t * 1.65) * .1;
      boat.body.rotation.z = Math.sin(t * 1.2) * .035 - turnVelocity * .08;
      boat.body.rotation.x = Math.sin(t * 1.7) * .027 + velocity * .004;
      boat.wake.visible = Math.abs(velocity) > .6;
      boat.wake.children.forEach((child, i) => { child.scale.setScalar(1 + (t * 1.9 + i * .23) % .45); });
      models.forEach((model, i) => { if (model.landmark.kind === "file" && !model.landmark.overview) model.group.position.y = Math.sin(t * 1.8 + i) * .13; model.glow.material instanceof THREE.MeshBasicMaterial && (model.glow.material.opacity = hovered === model.landmark.id ? .95 : .34 + Math.sin(t * 1.6 + i) * .12); model.glow.scale.setScalar(hovered === model.landmark.id ? 1.15 : 1); model.label.visible = prefsRef.current.labels && (Math.hypot(model.landmark.x - pos.x, model.landmark.z - pos.z) < 23 || hovered === model.landmark.id); if (model.light) model.light.intensity = 8 + Math.sin(t * 2 + i) * 2; });
      seaMaterial.uniforms.uTime.value = t;
      seaMaterial.uniforms.uWaves.value = prefsRef.current.waves ? 1 : 0;
      cameraTarget.set(pos.x + Math.sin(pos.angle) * zoom, 5.8 + zoom * .18, pos.z - Math.cos(pos.angle) * zoom);
      camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 3.4));
      const lookAt = new THREE.Vector3(pos.x - Math.sin(pos.angle) * 6, 1.7, pos.z + Math.cos(pos.angle) * 6);
      camera.lookAt(lookAt);
      report += dt; if (report > .06) { onPositionRef.current({ ...pos }); report = 0; }
      renderer.render(scene, camera);
    };
    renderer.setAnimationLoop(animate);
    return () => {
      renderer.setAnimationLoop(null); observer.disconnect();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointerleave", leave); canvas.removeEventListener("wheel", wheel);
      scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => material.dispose()); } if (object instanceof THREE.Sprite) { object.material.map?.dispose(); object.material.dispose(); } });
      renderer.dispose();
    };
  }, [landmarks, positionRef, keysRef]);

  return <div ref={hostRef} className="gitlantis-scene"><canvas ref={canvasRef} aria-hidden="true" />{error && <div className="gitlantis-webgl-error">3D rendering is unavailable in this browser. Use the landmark list below to explore.</div>}</div>;
}
