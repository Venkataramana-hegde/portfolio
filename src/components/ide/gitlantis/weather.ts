// Weather presets. The extension ships a single fixed sky; these are this site's addition, tuned around
// the same Sky and Water shaders. "Clear" is a calmer take on the extension's look (lower exposure, softer glint).

export const WEATHERS = ["Clear", "Sunset", "Overcast", "Foggy", "Rain", "Storm", "Night"] as const;
export type Weather = (typeof WEATHERS)[number];

export type Preset = {
  exposure: number;
  ambient: number; ambientColor: number;     // cool base light
  warm: number; warmColor: number;           // warm fill
  sun: number; sunColor: number;             // directional light (sun or moon)
  turbidity: number; rayleigh: number; mie: number; mieG: number;
  cloudCoverage: number; cloudDensity: number;
  sunPos: [number, number, number];          // sky sun direction; negative y puts it below the horizon
  waterSun: [number, number, number];        // where the sun's glint sits on the water
  glint: number;                             // colour of the sun's reflection on the water
  water: number; distortion: number;         // water body colour and wave choppiness
  fog: number; fogColor: number;             // exponential fog density and colour
  rain: number;                              // 0..1 share of the rain streaks shown
  stars: number;                             // 0..1
  lightning: boolean;
  rock: number;                              // multiplies the boat's idle rocking and bobbing
};

const BEHIND: [number, number, number] = [-1, 1, 1]; // the extension's own glint direction

export const PRESETS: Record<Weather, Preset> = {
  Clear: {
    exposure: .55, ambient: .6, ambientColor: 0xffffff, warm: 1, warmColor: 0xfceec1, sun: .7, sunColor: 0xffffff,
    turbidity: 4, rayleigh: 1.6, mie: .03, mieG: .8, cloudCoverage: .4, cloudDensity: .4, sunPos: [.3, .12, .4], waterSun: BEHIND, glint: 0x8f8a78,
    water: 0x001e0f, distortion: .7, fog: .00006, fogColor: 0x9fb9c4, rain: 0, stars: 0, lightning: false, rock: 1,
  },
  Sunset: {
    exposure: .62, ambient: .4, ambientColor: 0xffd9bd, warm: 1.1, warmColor: 0xffb77f, sun: .8, sunColor: 0xff9f5a,
    turbidity: 6, rayleigh: 2, mie: .06, mieG: .93, cloudCoverage: .45, cloudDensity: .5, sunPos: [-.85, .06, .25], waterSun: [-.85, .2, .25], glint: 0xffa760,
    water: 0x05212a, distortion: .8, fog: .00012, fogColor: 0xe0a888, rain: 0, stars: 0, lightning: false, rock: 1,
  },
  Overcast: {
    exposure: .6, ambient: .9, ambientColor: 0xdfe6ea, warm: .5, warmColor: 0xcfd6da, sun: .12, sunColor: 0xdfe6ea,
    turbidity: 22, rayleigh: .4, mie: .05, mieG: .7, cloudCoverage: .8, cloudDensity: .8, sunPos: [.3, .3, .4], waterSun: BEHIND, glint: 0x4a555c,
    water: 0x0a2a2a, distortion: 1.2, fog: .00028, fogColor: 0x8c9aa0, rain: 0, stars: 0, lightning: false, rock: 1.4,
  },
  Foggy: {
    exposure: .6, ambient: .9, ambientColor: 0xd7dde0, warm: .6, warmColor: 0xcfd6da, sun: .1, sunColor: 0xd7dde0,
    turbidity: 32, rayleigh: .1, mie: .04, mieG: .6, cloudCoverage: .6, cloudDensity: .7, sunPos: [.3, .3, .4], waterSun: BEHIND, glint: 0x3c464c,
    water: 0x13303a, distortion: .4, fog: .0016, fogColor: 0xaab4b8, rain: 0, stars: 0, lightning: false, rock: .8,
  },
  Rain: {
    exposure: .5, ambient: .7, ambientColor: 0xc3cfd8, warm: .3, warmColor: 0xaeb9c1, sun: .1, sunColor: 0xc3cfd8,
    turbidity: 30, rayleigh: .15, mie: .03, mieG: .6, cloudCoverage: .9, cloudDensity: .95, sunPos: [.3, .16, .4], waterSun: BEHIND, glint: 0x333d44,
    water: 0x0a2430, distortion: 1.6, fog: .0008, fogColor: 0x6f7d86, rain: .5, stars: 0, lightning: false, rock: 1.8,
  },
  Storm: {
    exposure: .45, ambient: .5, ambientColor: 0x9fb0bd, warm: .2, warmColor: 0x8b99a3, sun: .05, sunColor: 0x9fb0bd,
    turbidity: 40, rayleigh: .05, mie: .02, mieG: .5, cloudCoverage: 1, cloudDensity: 1.4, sunPos: [.3, .05, .4], waterSun: BEHIND, glint: 0x222a30,
    water: 0x06161c, distortion: 3.2, fog: .0011, fogColor: 0x39434b, rain: 1, stars: 0, lightning: true, rock: 3.2,
  },
  Night: {
    exposure: .8, ambient: .55, ambientColor: 0x8aa0d4, warm: .2, warmColor: 0x5a6a98, sun: .9, sunColor: 0x9db4e6,
    turbidity: 2, rayleigh: .1, mie: .005, mieG: .7, cloudCoverage: 0, cloudDensity: 0, sunPos: [.3, -.35, .4], waterSun: BEHIND, glint: 0x2c3c63,
    water: 0x00080f, distortion: .6, fog: .0003, fogColor: 0x070d18, rain: 0, stars: 1, lightning: false, rock: 1,
  },
};
