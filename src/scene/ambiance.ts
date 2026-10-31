// Day and night in the room (specs/003-visual-design-pass/contracts/scene-ambiance.md): lights,
// lamp glow and window, per quality level. Pure: scene3d.ts applies the settings. The light and
// sky colours below are the only literal colours allowed in the scene code.
import type { QualityLevel } from './quality';

export type Ambiance = 'day' | 'night';

export interface AmbianceSettings {
  hemisphere: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number; position: [number, number, number] };
  /** Emissive intensity of the `lamp` material (shades and bulbs). */
  lampEmissive: number;
  /** Emissive intensity of the `neon` material (LED strips), in its own colour. */
  neonEmissive: number;
  /** Colour and intensity emitted by the `window` material (the glass). */
  window: { color: string; intensity: number };
  /** One light per `light.lamp.NN` empty; none at low quality (FR-027). */
  pointLight: { color: string; intensity: number; distance: number } | null;
  /**
   * One light per `light.neon.NN` empty, in the colour of the room's `neon` material (LED glow
   * on the floor and the furniture); at high quality only.
   */
  neonLight: { intensity: number; distance: number } | null;
  /** Baked rooms: 0 shows the day texture, 1 the night texture. */
  bakedNight: number;
}

/** Colour the lamps glow with, at night: the amber of the room's LED strip and lamps. */
export const LAMP_GLOW = '#ffc27a';

export const ambianceFor = (theme: 'light' | 'dark'): Ambiance =>
  theme === 'dark' ? 'night' : 'day';

// The room's own light is baked (room-day.webp, room-night.webp); these lights fall on the placed
// objects (diplomas, cards, the desk's objects) so they match it. By day: daylight from the
// window, a warm bounce from the walnut and the rug.
const DAY: AmbianceSettings = {
  hemisphere: { sky: '#ffffff', ground: '#b09074', intensity: 1.6 },
  sun: { color: '#fff3e0', intensity: 1.8, position: [5, 9, 6] },
  lampEmissive: 0,
  neonEmissive: 0.6,
  window: { color: '#cfe6f5', intensity: 0.6 },
  pointLight: null,
  neonLight: null,
  bakedNight: 0,
};

// At night the room is lit by its lamps and the amber LED strip, with a little city light
// through the window: a warm, low ambient light and warm pools from the lamps.
const NIGHT: AmbianceSettings = {
  hemisphere: { sky: '#5a4a3c', ground: '#1c1712', intensity: 0.6 },
  sun: { color: '#b8c4ff', intensity: 0.35, position: [-3, 7, -8] },
  lampEmissive: 2.2,
  neonEmissive: 2.6,
  window: { color: '#1b2440', intensity: 0.5 },
  pointLight: { color: LAMP_GLOW, intensity: 6, distance: 6 },
  neonLight: { intensity: 3, distance: 2.6 },
  bakedNight: 1,
};

export function settingsFor(ambiance: Ambiance, quality: QualityLevel): AmbianceSettings {
  const base = ambiance === 'night' ? NIGHT : DAY;
  if (quality === 'high' || !base.pointLight) return base;
  if (quality === 'medium') return { ...base, neonLight: null };
  // Without point lights, the glow and the ambient light carry the night.
  return {
    ...base,
    pointLight: null,
    neonLight: null,
    lampEmissive: base.lampEmissive * 1.3,
    hemisphere: { ...base.hemisphere, intensity: base.hemisphere.intensity * 1.5 },
  };
}

// Exact at both ends, so a finished fade lands on the target settings.
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function mix(a: string, b: string, t: number): string {
  const [ca, cb] = [channels(a), channels(b)];
  return `#${ca
    .map((c, i) =>
      Math.round(lerp(c, cb[i]!, t))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Settings between `a` (t = 0) and `b` (t = 1), for the fade between day and night. */
export function blend(a: AmbianceSettings, b: AmbianceSettings, t: number): AmbianceSettings {
  // A missing point light fades from or to an unlit one of the same colour.
  const pa = a.pointLight ?? (b.pointLight && { ...b.pointLight, intensity: 0 });
  const pb = b.pointLight ?? (a.pointLight && { ...a.pointLight, intensity: 0 });
  const point =
    pa && pb
      ? {
          color: mix(pa.color, pb.color, t),
          intensity: lerp(pa.intensity, pb.intensity, t),
          distance: lerp(pa.distance, pb.distance, t),
        }
      : null;
  const na = a.neonLight ?? (b.neonLight && { ...b.neonLight, intensity: 0 });
  const nb = b.neonLight ?? (a.neonLight && { ...a.neonLight, intensity: 0 });
  const neon =
    na && nb
      ? {
          intensity: lerp(na.intensity, nb.intensity, t),
          distance: lerp(na.distance, nb.distance, t),
        }
      : null;
  return {
    hemisphere: {
      sky: mix(a.hemisphere.sky, b.hemisphere.sky, t),
      ground: mix(a.hemisphere.ground, b.hemisphere.ground, t),
      intensity: lerp(a.hemisphere.intensity, b.hemisphere.intensity, t),
    },
    sun: {
      color: mix(a.sun.color, b.sun.color, t),
      intensity: lerp(a.sun.intensity, b.sun.intensity, t),
      position: a.sun.position.map((v, i) => lerp(v, b.sun.position[i]!, t)) as [
        number,
        number,
        number,
      ],
    },
    lampEmissive: lerp(a.lampEmissive, b.lampEmissive, t),
    neonEmissive: lerp(a.neonEmissive, b.neonEmissive, t),
    bakedNight: lerp(a.bakedNight, b.bakedNight, t),
    window: {
      color: mix(a.window.color, b.window.color, t),
      intensity: lerp(a.window.intensity, b.window.intensity, t),
    },
    pointLight: t >= 1 ? b.pointLight : t <= 0 ? a.pointLight : point,
    neonLight: t >= 1 ? b.neonLight : t <= 0 ? a.neonLight : neon,
  };
}
