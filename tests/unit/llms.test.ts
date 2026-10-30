import { describe, expect, it } from 'vitest';
import { buildLlms, buildLlmsFull, type LlmsInput } from '../../src/lib/llms';

const input: LlmsInput = {
  site: new URL('https://example.com'),
  profile: {
    name: 'Test Person',
    headline: { fr: 'Développeur', en: 'Developer' },
    summary: { fr: 'Je fais des sites.', en: 'I build websites.' },
  },
  projects: [
    {
      title: { fr: 'Démo', en: 'Demo' },
      summary: { fr: 'Un projet de démo.', en: 'A demo project.' },
      urls: { fr: '/fr/projets/demo/', en: '/en/projects/demo/' },
      text: { fr: '## Contexte\n\nTexte long FR.', en: '## Context\n\nLong EN text.' },
    },
  ],
  experience: [
    {
      title: { fr: 'Développeur', en: 'Developer' },
      organization: 'Studio',
      period: { start: '2020-01' },
      urls: { fr: '/fr/parcours/experiences/studio/', en: '/en/career/experience/studio/' },
      text: { fr: 'Missions.', en: 'Work.' },
    },
  ],
  education: [
    {
      title: { fr: 'Master', en: 'Master' },
      organization: 'Université',
      period: { start: '2018-09', end: '2020-06' },
      urls: { fr: '/fr/parcours/diplomes/master/', en: '/en/career/education/master/' },
      text: { fr: 'Formation.', en: 'Degree.' },
    },
  ],
};

describe('llms.txt', () => {
  const text = buildLlms(input);

  it('starts with the name as H1 and a blockquote summary', () => {
    const lines = text.split('\n');
    expect(lines[0]).toBe('# Test Person');
    expect(text).toMatch(/^> .+$/m);
  });

  it('lists French sections before English ones, with absolute links', () => {
    const fr = text.indexOf('## Projets');
    const en = text.indexOf('## Projects');
    expect(fr).toBeGreaterThan(0);
    expect(en).toBeGreaterThan(fr);
    expect(text).toContain('- [Démo](https://example.com/fr/projets/demo/): Un projet de démo.');
    expect(text).toContain('- [Demo](https://example.com/en/projects/demo/): A demo project.');
    expect(text).toContain(
      '[Developer — Studio](https://example.com/en/career/experience/studio/)',
    );
    expect(text).toContain(
      '[Master — Université](https://example.com/fr/parcours/diplomes/master/)',
    );
  });

  it('points to the full version and the JSON export', () => {
    expect(text).toContain('https://example.com/llms-full.txt');
    expect(text).toContain('https://example.com/data/portfolio.json');
  });

  it('does not include long descriptions', () => {
    expect(text).not.toContain('Texte long FR.');
  });
});

describe('llms-full.txt', () => {
  const full = buildLlmsFull(input);

  it('contains every long description in both languages', () => {
    for (const s of [
      'Texte long FR.',
      'Long EN text.',
      'Missions.',
      'Work.',
      'Formation.',
      'Degree.',
    ]) {
      expect(full).toContain(s);
    }
  });

  it('demotes the headings of the descriptions under each element', () => {
    expect(full).toContain('#### Contexte');
    expect(full).not.toMatch(/^## Contexte$/m);
  });
});
