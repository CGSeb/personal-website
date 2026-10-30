import { describe, expect, it } from 'vitest';
import { buildManifest, type ManifestSite } from '../../src/lib/scene-manifest';

const site: ManifestSite<string> = {
  projects: [
    {
      id: 'alpha',
      title: { fr: 'Alpha FR', en: 'Alpha EN' },
      period: { start: '2026-01' },
      featured: true,
      cover: { image: 'alpha.webp' },
    },
    {
      id: 'beta',
      title: { fr: 'Bêta', en: 'Beta' },
      period: { start: '2025-03' },
      featured: false,
      slug: { fr: 'beta-fr' },
    },
  ],
  education: [
    {
      id: 'master',
      title: { fr: 'Master', en: "Master's" },
      institution: 'Université',
      level: { fr: 'Bac+5', en: "Master's level" },
      period: { start: '2018-09', end: '2020-06' },
    },
  ],
  experience: [
    {
      id: 'job',
      position: { fr: 'Développeur', en: 'Developer' },
      organization: 'Une organisation au nom vraiment beaucoup trop long pour un badge',
      period: { start: '2021-01' },
    },
  ],
};

describe('scene manifest', () => {
  const fr = buildManifest(site, 'fr', (img) => `/_astro/${img}`);
  const en = buildManifest(site, 'en', (img) => `/_astro/${img}`);

  it('lists every item once with a unique key and panel id', () => {
    expect(fr.map((i) => i.key)).toEqual([
      'project/alpha',
      'project/beta',
      'education/master',
      'experience/job',
    ]);
    expect(new Set(fr.map((i) => i.panelId)).size).toBe(fr.length);
    expect(fr[0]!.panelId).toBe('panel-project-alpha');
  });

  it('uses the page language for labels and written-page links', () => {
    expect(fr[0]).toMatchObject({ label: 'Alpha FR', href: '/fr/projets/alpha/' });
    expect(en[0]).toMatchObject({ label: 'Alpha EN', href: '/en/projects/alpha/' });
    expect(fr[1]!.href).toBe('/fr/projets/beta-fr/');
    expect(en[2]).toMatchObject({ label: "Master's", href: '/en/career/education/master/' });
    expect(fr[3]!.label).toBe(
      'Développeur — Une organisation au nom vraiment beaucoup trop long pour un badge',
    );
  });

  it('keeps order, featured flag and image only for projects', () => {
    expect(fr.map((i) => i.order)).toEqual([0, 1, 0, 0]);
    expect(fr[0]).toMatchObject({ featured: true, image: '/_astro/alpha.webp' });
    expect(fr[1]!.image).toBeNull();
    expect(fr[2]).toMatchObject({ featured: false, image: null });
  });

  it('paints short badges, at most 40 characters', () => {
    expect(fr[0]!.badge).toBe('2026');
    expect(fr[2]!.badge).toBe('Bac+5 · 2020');
    expect(fr[3]!.badge.length).toBeLessThanOrEqual(40);
    expect(fr[3]!.badge.endsWith('…')).toBe(true);
  });
});
