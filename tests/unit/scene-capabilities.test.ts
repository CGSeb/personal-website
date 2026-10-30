import { describe, expect, it } from 'vitest';
import { decide, type Capabilities } from '../../src/scene/capabilities';

const base: Capabilities = { webgl: true, reducedMotion: false, saveData: false, stored: null };

describe('scene path', () => {
  it('falls back without WebGL, whatever else', () => {
    expect(decide({ ...base, webgl: false })).toBe('fallback');
    expect(decide({ ...base, webgl: false, stored: '3d' })).toBe('fallback');
  });

  it('asks first with reduced motion or data saving', () => {
    expect(decide({ ...base, reducedMotion: true })).toBe('choice');
    expect(decide({ ...base, saveData: true })).toBe('choice');
  });

  it('honours a stored choice for 3D, asks again after a written choice', () => {
    expect(decide({ ...base, reducedMotion: true, stored: '3d' })).toBe('3d');
    expect(decide({ ...base, stored: 'written' })).toBe('choice');
  });

  it('goes straight to 3D otherwise', () => {
    expect(decide(base)).toBe('3d');
  });
});
