import { describe, expect, it } from 'vitest';
import { bubblePosition } from '../../src/scene/bubble';

describe('position of the bubble', () => {
  const bubble = { width: 200, height: 100 };
  const scene = { width: 800, height: 600 };
  const margin = 8;

  it('sits above the anchor, centred on it', () => {
    const { left, top } = bubblePosition({ x: 400, y: 300 }, bubble, scene, margin);
    expect(left + bubble.width / 2).toBe(400);
    expect(top + bubble.height).toBeLessThanOrEqual(300);
  });

  it('has a default margin', () => {
    expect(bubblePosition({ x: 0, y: 0 }, bubble, scene).left).toBeGreaterThan(0);
  });

  it.each([
    ['left', { x: 10, y: 300 }],
    ['right', { x: 790, y: 300 }],
    ['top', { x: 400, y: 10 }],
    ['bottom', { x: 400, y: 2000 }],
    ['top left corner', { x: -50, y: -50 }],
    ['bottom right corner', { x: 2000, y: 2000 }],
  ])('stays inside the scene at the %s', (_edge, anchor) => {
    const { left, top } = bubblePosition(anchor, bubble, scene, margin);
    expect(left).toBeGreaterThanOrEqual(margin);
    expect(left + bubble.width).toBeLessThanOrEqual(scene.width - margin);
    expect(top).toBeGreaterThanOrEqual(margin);
    expect(top + bubble.height).toBeLessThanOrEqual(scene.height - margin);
  });

  it('fits at 320 px', () => {
    const narrow = { width: 320, height: 240 };
    const wide = { width: 280, height: 120 };
    for (const x of [0, 160, 320]) {
      const { left, top } = bubblePosition({ x, y: 40 }, wide, narrow, margin);
      expect(left).toBeGreaterThanOrEqual(margin);
      expect(left + wide.width).toBeLessThanOrEqual(narrow.width - margin);
      expect(top).toBeGreaterThanOrEqual(margin);
    }
  });

  it('keeps the top left margin when the bubble is larger than the scene', () => {
    const huge = { width: 1000, height: 1000 };
    expect(bubblePosition({ x: 400, y: 300 }, huge, scene, margin)).toEqual({
      left: margin,
      top: margin,
    });
  });
});
