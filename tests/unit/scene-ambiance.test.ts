import { describe, expect, it } from 'vitest';
import { ambianceFor, blend, settingsFor } from '../../src/scene/ambiance';

describe('ambianceFor', () => {
  it('maps the light theme to day and the dark theme to night', () => {
    expect(ambianceFor('light')).toBe('day');
    expect(ambianceFor('dark')).toBe('night');
  });
});

describe('settingsFor', () => {
  it('lights the lamps at night only', () => {
    expect(settingsFor('day', 'high').lampEmissive).toBe(0);
    expect(settingsFor('night', 'high').lampEmissive).toBeGreaterThan(0);
  });

  it('LED strips glow a little by day and much more at night', () => {
    const day = settingsFor('day', 'high').neonEmissive;
    expect(day).toBeGreaterThan(0);
    expect(settingsFor('night', 'high').neonEmissive).toBeGreaterThan(day);
  });

  it('has no point light by day', () => {
    for (const q of ['high', 'medium', 'low'] as const)
      expect(settingsFor('day', q).pointLight).toBeNull();
  });

  it('adds point lights at night, except at low quality', () => {
    expect(settingsFor('night', 'high').pointLight).not.toBeNull();
    expect(settingsFor('night', 'medium').pointLight).not.toBeNull();
    expect(settingsFor('night', 'low').pointLight).toBeNull();
  });

  it('adds LED glows at night at high quality only', () => {
    expect(settingsFor('day', 'high').neonLight).toBeNull();
    expect(settingsFor('night', 'high').neonLight).not.toBeNull();
    expect(settingsFor('night', 'medium').neonLight).toBeNull();
    expect(settingsFor('night', 'low').neonLight).toBeNull();
  });

  it('makes up for the missing point lights at low quality', () => {
    const low = settingsFor('night', 'low');
    const high = settingsFor('night', 'high');
    expect(low.lampEmissive).toBeGreaterThan(high.lampEmissive);
    expect(low.hemisphere.intensity).toBeGreaterThan(high.hemisphere.intensity);
  });

  it('makes the night darker than the day', () => {
    const day = settingsFor('day', 'high');
    const night = settingsFor('night', 'high');
    expect(night.sun.intensity).toBeLessThan(day.sun.intensity);
    expect(night.hemisphere.intensity).toBeLessThan(day.hemisphere.intensity);
  });
});

describe('blend', () => {
  const day = settingsFor('day', 'high');
  const night = settingsFor('night', 'high');

  it('returns the ends at t = 0 and t = 1', () => {
    expect(blend(day, night, 0)).toEqual(day);
    expect(blend(day, night, 1)).toEqual(night);
  });

  it('interpolates numbers and colours half way', () => {
    const mid = blend(
      { ...day, hemisphere: { sky: '#000000', ground: '#ffffff', intensity: 0 } },
      { ...night, hemisphere: { sky: '#ffffff', ground: '#000000', intensity: 2 } },
      0.5,
    );
    expect(mid.hemisphere).toEqual({ sky: '#808080', ground: '#808080', intensity: 1 });
    expect(mid.lampEmissive).toBeCloseTo(night.lampEmissive / 2);
  });

  it('fades a point light in from zero', () => {
    const mid = blend(day, night, 0.5);
    expect(mid.pointLight?.color).toBe(night.pointLight!.color);
    expect(mid.pointLight?.intensity).toBeCloseTo(night.pointLight!.intensity / 2);
  });
});
