// Adaptive quality (data-model.md, `QualityLevel`): watches frame intervals while the scene is
// moving and steps the quality down when it stays too slow; at the lowest level it asks to
// propose the written version. Pure: time comes from the caller, so it is unit tested.

export type QualityLevel = 'high' | 'medium' | 'low';

export const QUALITY: Record<QualityLevel, { pixelRatio: number; shadows: boolean }> = {
  high: { pixelRatio: 2, shadows: true },
  medium: { pixelRatio: 1.5, shadows: false },
  low: { pixelRatio: 1, shadows: false },
};

const ORDER: QualityLevel[] = ['high', 'medium', 'low'];

export type QualityAction =
  { type: 'none' } | { type: 'down'; level: QualityLevel } | { type: 'propose-written' };

export interface GovernorOptions {
  level: QualityLevel;
  /** Frames per second under which the scene is too slow (30 phone, 50 desktop). */
  minFps: number;
  /** Time after the first frame before judging (ms). */
  warmup?: number;
  /** Sliding window of the average (ms). */
  window?: number;
  /** Minimum time between two steps down (ms). */
  cooldown?: number;
}

/**
 * Without the request time, frames further apart than this are idle gaps (render on demand),
 * not slow frames. With it, only a stall longer than MAX_FRAME is left out (a lost context, a
 * long pause of the page).
 */
const IDLE_GAP = 250;
const MAX_FRAME = 2000;
/**
 * Enough to judge: this many frames in the window, or frames covering this share of it (a
 * device below 10 fps never gets 20 frames in 2 s, and must not escape the governor).
 */
const MIN_SAMPLES = 20;
const MIN_COVERAGE = 0.75;

export class QualityGovernor {
  level: QualityLevel;
  private readonly minFps: number;
  private readonly warmup: number;
  private readonly window: number;
  private readonly cooldown: number;
  private start: number | null = null;
  private last: number | null = null;
  private lastStep = -Infinity;
  private proposed = false;
  private samples: { at: number; interval: number }[] = [];

  constructor(options: GovernorOptions) {
    this.level = options.level;
    this.minFps = options.minFps;
    this.warmup = options.warmup ?? 3000;
    this.window = options.window ?? 2000;
    this.cooldown = options.cooldown ?? 3000;
  }

  /**
   * Call once per rendered frame with its timestamp (ms) and, when known, the time the frame was
   * asked for. The interval then starts at the later of the previous frame and the request: a
   * pause of the scene does not count, but a frame that takes long to draw does, however long.
   */
  frame(now: number, requestedAt?: number): QualityAction {
    this.start ??= now;
    const previous = this.last;
    this.last = now;
    if (previous === null || now - this.start < this.warmup) return { type: 'none' };
    const interval =
      requestedAt === undefined ? now - previous : now - Math.max(previous, requestedAt);
    if (interval > (requestedAt === undefined ? IDLE_GAP : MAX_FRAME)) return { type: 'none' };

    this.samples.push({ at: now, interval });
    this.samples = this.samples.filter((s) => now - s.at <= this.window);
    const covered = this.samples.reduce((sum, s) => sum + s.interval, 0);
    const enough = this.samples.length >= MIN_SAMPLES || covered >= this.window * MIN_COVERAGE;
    if (!enough || now - this.lastStep < this.cooldown) return { type: 'none' };
    const average = covered / this.samples.length;
    if (1000 / average >= this.minFps) return { type: 'none' };

    this.samples = [];
    this.lastStep = now;
    const next = ORDER[ORDER.indexOf(this.level) + 1];
    if (next) {
      this.level = next;
      return { type: 'down', level: next };
    }
    if (this.proposed) return { type: 'none' };
    this.proposed = true;
    return { type: 'propose-written' };
  }
}
