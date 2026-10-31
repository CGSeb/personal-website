import { describe, expect, it } from 'vitest';
import { effectiveTheme, nextPreference, parsePreference } from '../../src/lib/theme';

describe('effectiveTheme', () => {
  it('follows the system without a choice', () => {
    expect(effectiveTheme('system', true)).toBe('dark');
    expect(effectiveTheme('system', false)).toBe('light');
  });
  it('a choice wins over the system', () => {
    expect(effectiveTheme('light', true)).toBe('light');
    expect(effectiveTheme('dark', false)).toBe('dark');
  });
});

describe('nextPreference', () => {
  it('cycles system -> light -> dark -> system', () => {
    expect(nextPreference('system')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
  });
});

describe('parsePreference', () => {
  it('keeps light and dark', () => {
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('dark')).toBe('dark');
  });
  it('treats null and unknown values as no choice', () => {
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference('blue')).toBe('system');
    expect(parsePreference('')).toBe('system');
  });
});
