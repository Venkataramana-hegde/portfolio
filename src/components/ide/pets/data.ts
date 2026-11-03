// Sprites and scenes come from VS Code Pets by Anthony Shaw (MIT, https://github.com/tonybaloney/vscode-pets).
// The dog sprites are CC BY-ND 4.0 and are used unmodified. See public/pets/NOTICE.txt.

export type Anim = "idle" | "walk" | "walk_fast" | "run" | "swipe" | "lie" | "with_ball";

export type PetKind = { id: string; label: string; colors: string[]; anims: Anim[] };

const CORE: Anim[] = ["idle", "walk", "walk_fast", "run", "swipe", "with_ball"];
const LIES: Anim[] = [...CORE, "lie"];

export const PET_KINDS: PetKind[] = [
  { id: "dog", label: "Dog", colors: ["black", "brown", "white", "red", "akita"], anims: LIES },
  { id: "fox", label: "Fox", colors: ["red", "white"], anims: LIES },
  { id: "panda", label: "Panda", colors: ["black", "brown"], anims: LIES },
  { id: "turtle", label: "Turtle", colors: ["green", "orange"], anims: LIES },
  { id: "crab", label: "Crab", colors: ["red"], anims: CORE },
  { id: "chicken", label: "Chicken", colors: ["brown", "gray", "white"], anims: CORE },
  { id: "rubber-duck", label: "Rubber duck", colors: ["yellow"], anims: CORE },
  { id: "snake", label: "Snake", colors: ["green"], anims: CORE },
  { id: "cockatiel", label: "Cockatiel", colors: ["brown", "gray", "piedpearl", "whiteface"], anims: CORE },
  { id: "snail", label: "Snail", colors: ["brown"], anims: CORE },
  { id: "rat", label: "Rat", colors: ["brown", "gray", "white"], anims: CORE },
  { id: "monkey", label: "Monkey", colors: ["gray"], anims: ["idle", "walk", "run", "swipe", "with_ball"] },
];

export const kindOf = (id: string) => PET_KINDS.find((k) => k.id === id) ?? PET_KINDS[0];

export const spriteUrl = (kind: string, color: string, anim: Anim) => `/pets/${kind}/${color}_${anim}_8fps.gif`;

export type SizeId = "nano" | "small" | "medium" | "large";
// scale: how much the 90px-ish sprites grow; sceneHeight: the height of that size's scene art, which sets where the ground sits.
export const SIZES: Record<SizeId, { label: string; scale: number; sceneHeight: number }> = {
  nano: { label: "Nano", scale: .45, sceneHeight: 300 },
  small: { label: "Small", scale: .6, sceneHeight: 400 },
  medium: { label: "Medium", scale: .8, sceneHeight: 500 },
  large: { label: "Large", scale: 1.15, sceneHeight: 800 },
};

export const SCENES = [
  { id: "none", label: "No scene" },
  { id: "forest", label: "Forest" },
  { id: "beach", label: "Beach" },
  { id: "winter", label: "Winter" },
  { id: "autumn", label: "Autumn" },
] as const;

export const sceneUrl = (scene: string, layer: "background" | "foreground", tone: "dark" | "light", size: SizeId) =>
  `/pets/backgrounds/${scene}/${layer}-${tone}-${size}.png`;

export const NAMES = ["Bella", "Max", "Luna", "Milo", "Daisy", "Rocky", "Coco", "Pepper", "Ziggy", "Waffles", "Biscuit", "Pixel", "Nova", "Mochi", "Pickles", "Juno"];

export type PetData = { id: string; kind: string; color: string; name: string };
export type PetPrefs = { pets: PetData[]; scene: string; size: SizeId; names: boolean };

export const DEFAULT_PREFS: PetPrefs = { pets: [], scene: "forest", size: "medium", names: true };
export const PETS_KEY = "portfolio.pets";
export const MAX_PETS = 8;
