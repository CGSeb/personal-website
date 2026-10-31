import { describe, expect, it } from 'vitest';
import { QualityGovernor, type QualityAction } from '../../src/scene/quality';

/** Feeds frames every `interval` ms from `from` to `to`; returns the actions that happened. */
function run(g: QualityGovernor, from: number, to: number, interval: number) {
  const actions: { at: number; action: QualityAction }[] = [];
  for (let t = from; t <= to; t += interval) {
    const action = g.frame(t);
    if (action.type !== 'none') actions.push({ at: t, action });
  }
  return actions;
}

describe('quality governor', () => {
  it('does nothing while the scene is fast enough', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 50 });
    expect(run(g, 0, 20_000, 16)).toEqual([]);
    expect(g.level).toBe('high');
  });

  it('waits 3 s after the first frame before judging', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 50 });
    const actions = run(g, 0, 6000, 40); // 25 fps from the start
    expect(actions[0]!.at).toBeGreaterThanOrEqual(3000);
  });

  it('steps down one level at a time, at most every 3 s, never back up', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 30 });
    const actions = run(g, 0, 20_000, 50); // 20 fps
    const downs = actions.filter((a) => a.action.type === 'down');
    expect(downs.map((a) => (a.action as { level: string }).level)).toEqual(['medium', 'low']);
    expect(downs[1]!.at - downs[0]!.at).toBeGreaterThanOrEqual(3000);
    run(g, 20_016, 40_000, 16); // fast again
    expect(g.level).toBe('low');
  });

  it('proposes the written version once, when still slow at the lowest level', () => {
    const g = new QualityGovernor({ level: 'low', minFps: 30 });
    const actions = run(g, 0, 30_000, 50);
    expect(actions.map((a) => a.action.type)).toEqual(['propose-written']);
  });

  it('also catches a device too slow to draw 20 frames in the window (5 fps)', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 30 });
    const actions = run(g, 0, 20_000, 190);
    expect(actions.map((a) => a.action.type)).toEqual(['down', 'down', 'propose-written']);
    expect(g.level).toBe('low');
  });

  it('ignores idle gaps between on-demand frames', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 50 });
    // Bursts of fast frames separated by long pauses: never judged as slow.
    const actions: QualityAction[] = [];
    for (let burst = 0; burst < 20; burst++) {
      for (let i = 0; i < 30; i++) actions.push(g.frame(burst * 2000 + i * 16));
    }
    expect(actions.every((a) => a.type === 'none')).toBe(true);
  });

  it('with request times, catches a device far too slow to draw (4 fps)', () => {
    // Each frame is asked for as soon as the previous one is drawn (the scene keeps moving).
    const g = new QualityGovernor({ level: 'high', minFps: 50 });
    const actions: QualityAction[] = [];
    for (let t = 0; t <= 30_000; t += 250) actions.push(g.frame(t, t - 250));
    expect(actions.filter((a) => a.type !== 'none').map((a) => a.type)).toEqual([
      'down',
      'down',
      'propose-written',
    ]);
  });

  it('with request times, still ignores pauses between gestures', () => {
    const g = new QualityGovernor({ level: 'high', minFps: 50 });
    const actions: QualityAction[] = [];
    for (let burst = 0; burst < 20; burst++) {
      const start = burst * 2000;
      // The first frame of a burst is asked for after a pause, then each frame right away.
      for (let i = 0; i < 30; i++) actions.push(g.frame(start + i * 16, start + (i - 1) * 16));
    }
    expect(actions.every((a) => a.type === 'none')).toBe(true);
  });

  it('uses the phone threshold (30 fps) and the desktop threshold (50 fps)', () => {
    expect(run(new QualityGovernor({ level: 'medium', minFps: 30 }), 0, 10_000, 28)).toEqual([]);
    expect(run(new QualityGovernor({ level: 'high', minFps: 50 }), 0, 10_000, 28)).not.toEqual([]);
  });
});
