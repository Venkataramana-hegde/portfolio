import type { WorkspaceFile } from "@/content/workspace";
import type { Weather } from "./weather";

// Scene design, assets and default tuning come from the Gitlantis VS Code extension
// (Brian Njogu, Apache-2.0, https://github.com/liltrendi/gitlantis). See public/gitlantis/NOTICE.txt.

export type Landmark = { id: string; label: string; kind: "folder" | "file"; file?: WorkspaceFile };

export type Toggle = "Show" | "Hide";
export type NodesToShow = "Folders and files" | "Folders only" | "Files only";

export type BoatColors = { walls: string; roof: string; hull: string; rails: string; body: string; floaters: string };

export type GitlantisSettings = {
  minimap: Toggle;
  breadcrumbs: Toggle;
  compass: Toggle;
  nodesToShow: NodesToShow;
  weather: Weather;
  boatSpeed: number;
  acceleration: number;
  deceleration: number;
  turnSpeed: number;
  turnDeceleration: number;
  collisionRadius: number;
  collisionPushStrength: number;
  rockingAmplitude: number;
  rockingSpeed: number;
  bobbingAmplitude: number;
  bobbingSpeed: number;
  volume: number;
  boatColors: BoatColors;
};

export const DEFAULT_SETTINGS: GitlantisSettings = {
  minimap: "Show",
  breadcrumbs: "Show",
  compass: "Show",
  nodesToShow: "Folders and files",
  weather: "Clear",
  boatSpeed: 3.0,
  acceleration: 0.02,
  deceleration: 0.01,
  turnSpeed: 0.02,
  turnDeceleration: 0.05,
  collisionRadius: 100,
  collisionPushStrength: 5,
  rockingAmplitude: 0.03,
  rockingSpeed: 0.3,
  bobbingAmplitude: 0.2,
  bobbingSpeed: 0.6,
  volume: 0.5,
  boatColors: { walls: "#222222", roof: "#c99732", hull: "#ffffff", rails: "#000000", body: "#ffffff", floaters: "#eeeeee" },
};

export const SETTINGS_KEY = "portfolio.gitlantis.settings";
export const DIR_KEY = "portfolio.gitlantis.directory";

const ROOT = "/gitlantis";
export const ASSETS = {
  ocean: `${ROOT}/models/ocean/ocean.jpeg`,
  boat: `${ROOT}/models/boat/boat.glb`,
  folder: `${ROOT}/models/folder/folder.glb`,
  file: `${ROOT}/models/file/file.glb`,
  waves: `${ROOT}/music/waves.mp3`,
  horn: `${ROOT}/music/horn.ogg`,
  logo: `${ROOT}/favicon.png`,
};

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "W A S D / ← ↑ ↓ →", label: "Sail and turn" },
  { keys: "Shift + Enter", label: "Open the landmark you are next to" },
  { keys: "Esc", label: "Back to the parent folder" },
  { keys: "H", label: "Sound the horn" },
  { keys: "T", label: "Change the weather" },
  { keys: "F", label: "Full-screen map" },
];

export type EngineHandle = {
  setLandmarks(landmarks: Landmark[], seed: string): void;
  setSettings(settings: GitlantisSettings): void;
  setMapFull(full: boolean): void;
  setMuted(muted: boolean): void;
  setKey(key: "forward" | "backward" | "left" | "right", down: boolean): void;
  honk(on: boolean): void;
  start(): void;
  openColliding(): void;
  dispose(): void;
};
