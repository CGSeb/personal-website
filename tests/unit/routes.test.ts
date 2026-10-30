import { describe, expect, it } from 'vitest';
import { alternateOf, slugFor, urlFor, type PageType } from '../../src/i18n/routes';

// Table from contracts/routes.md.
const table: [PageType, string | undefined, string, string][] = [
  ['home', undefined, '/fr/', '/en/'],
  ['projects', undefined, '/fr/projets/', '/en/projects/'],
  ['category', 'web', '/fr/projets/categorie/web/', '/en/projects/category/web/'],
  ['project', 'demo', '/fr/projets/demo/', '/en/projects/demo/'],
  ['career', undefined, '/fr/parcours/', '/en/career/'],
  ['education', 'master', '/fr/parcours/diplomes/master/', '/en/career/education/master/'],
  ['experience', 'job', '/fr/parcours/experiences/job/', '/en/career/experience/job/'],
  ['contact', undefined, '/fr/contact/', '/en/contact/'],
  ['scene', undefined, '/fr/explorer/', '/en/explore/'],
];

describe('urlFor', () => {
  it.each(table)('%s', (type, slug, fr, en) => {
    expect(urlFor(type, 'fr', slug)).toBe(fr);
    expect(urlFor(type, 'en', slug)).toBe(en);
  });

  it('always ends with a slash', () => {
    for (const [type, slug] of table) expect(urlFor(type, 'en', slug).endsWith('/')).toBe(true);
  });

  it('requires a slug for element pages', () => {
    expect(() => urlFor('project', 'fr')).toThrow();
  });
});

describe('slugFor and alternateOf', () => {
  const element = { id: 'ambient-videos', slug: { fr: 'videos-ambiance' } };

  it('uses the localized slug, else the id', () => {
    expect(slugFor(element, 'fr')).toBe('videos-ambiance');
    expect(slugFor(element, 'en')).toBe('ambient-videos');
  });

  it('round-trips between languages', () => {
    const en = alternateOf('project', 'fr', element);
    expect(en).toBe('/en/projects/ambient-videos/');
    expect(alternateOf('project', 'en', element)).toBe('/fr/projets/videos-ambiance/');
    expect(alternateOf('home', 'en')).toBe('/fr/');
    expect(alternateOf('category', 'fr', 'web')).toBe('/en/projects/category/web/');
  });
});
