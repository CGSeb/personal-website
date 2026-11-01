import { describe, expect, it } from 'vitest';
import { WAVE_MS, waveAngle } from '../../src/scene/wave';

describe('wave of the figure', () => {
  it('lasts 2 seconds at most', () => {
    expect(WAVE_MS).toBeGreaterThan(0);
    expect(WAVE_MS).toBeLessThanOrEqual(2000);
  });

  it('starts and ends at exactly the rest pose', () => {
    expect(waveAngle(0)).toBe(0);
    expect(waveAngle(WAVE_MS)).toBe(0);
    expect(waveAngle(WAVE_MS + 1000)).toBe(0);
  });

  it('raises the arm in between', () => {
    for (let ms = 50; ms < WAVE_MS; ms += 50) {
      expect(waveAngle(ms), `${ms} ms`).toBeGreaterThan(0);
    }
  });

  it('beats twice while the arm is up', () => {
    const beats = [];
    for (let ms = 1; ms < WAVE_MS; ms++) {
      const angle = waveAngle(ms);
      if (angle < waveAngle(ms - 1) && angle < waveAngle(ms + 1)) beats.push(ms);
    }
    expect(beats).toHaveLength(2);
  });

  it('moves without a jump', () => {
    for (let ms = 1; ms <= WAVE_MS; ms++) {
      expect(Math.abs(waveAngle(ms) - waveAngle(ms - 1)), `${ms} ms`).toBeLessThan(0.05);
    }
  });
});
