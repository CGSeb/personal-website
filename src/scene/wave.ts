// The figure's wave (contracts/avatar.md): the arm goes up, beats twice and comes back down.
// Pure, unit tested; avatar.ts applies the angle to the `avatar.arm` node.

/** Length of the whole gesture (FR-008: 2 s at most). */
export const WAVE_MS = 1600;

const RAISE_MS = 400;
const LOWER_MS = 400;
/** Height of the raised arm, and how far each beat drops from it (radians). */
const RAISED = 1.4;
const BEAT = 0.6;
const BEATS = 2;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Arm rotation (radians) at time `ms`: 0 at the start and from WAVE_MS on. */
export function waveAngle(ms: number): number {
  if (ms <= 0 || ms >= WAVE_MS) return 0;
  if (ms < RAISE_MS) return RAISED * smooth(ms / RAISE_MS);
  if (ms > WAVE_MS - LOWER_MS) return RAISED * smooth((WAVE_MS - ms) / LOWER_MS);
  // Each cosine period leaves the raised height and returns to it at rest, so the joins are smooth.
  const beats = (ms - RAISE_MS) / (WAVE_MS - RAISE_MS - LOWER_MS);
  return RAISED - (BEAT * (1 - Math.cos(beats * BEATS * 2 * Math.PI))) / 2;
}
