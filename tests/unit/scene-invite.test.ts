import { describe, expect, it } from 'vitest';
import { inviteGlow, inviteMs } from '../../src/scene/invite';

describe('invitation of the experience board', () => {
  it('lights the cards one after the other, from the first', () => {
    expect(inviteGlow(100, 0)).toBeGreaterThan(0);
    expect(inviteGlow(100, 1)).toBe(0);
    expect(inviteGlow(400, 1)).toBeGreaterThan(0);
  });

  it('leaves every card dark once the gesture ends', () => {
    const end = inviteMs(6);
    for (let i = 0; i < 6; i++) {
      expect(inviteGlow(0, i)).toBe(0);
      expect(inviteGlow(end, i)).toBe(0);
    }
    expect(inviteMs(0)).toBe(0);
  });
});
