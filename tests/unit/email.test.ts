import { describe, expect, it } from 'vitest';
import { encodeEntities, protectedMailto } from '../../src/lib/email';

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));

describe('e-mail protection', () => {
  it('encodes every character as a numeric HTML entity', () => {
    const encoded = encodeEntities('a@b.fr');
    expect(encoded).toBe('&#97;&#64;&#98;&#46;&#102;&#114;');
    expect(decode(encoded)).toBe('a@b.fr');
  });

  it('builds a mailto link that never contains the address in clear', () => {
    const { href, text } = protectedMailto('contact@example.com');
    for (const part of [href, text]) {
      expect(part).not.toContain('contact');
      expect(part).not.toContain('@');
    }
    expect(decode(href)).toBe('mailto:contact@example.com');
    expect(decode(text)).toBe('contact@example.com');
  });
});
