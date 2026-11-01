// The board's invitation: at the opening of the scene the experience cards light up once, one
// after the other, from the most recent. Pure, unit tested; scene3d.ts applies it to the cards.

const PULSE_MS = 700;
const STEP_MS = 220;

/** Length of the whole gesture for `count` cards. */
export const inviteMs = (count: number) => (count > 0 ? (count - 1) * STEP_MS + PULSE_MS : 0);

/** Glow of the card at `index` (0 to 1) at time `ms`: 0 before and after its own pulse. */
export function inviteGlow(ms: number, index: number): number {
  const t = (ms - index * STEP_MS) / PULSE_MS;
  return t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI);
}
