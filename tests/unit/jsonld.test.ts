import { describe, expect, it } from 'vitest';
import {
  breadcrumb,
  educationLd,
  experienceLd,
  graph,
  personId,
  personLd,
  profilePageLd,
  projectLd,
} from '../../src/lib/jsonld';

const site = new URL('https://example.com');
const profile = {
  name: 'Test Person',
  headline: { fr: 'Développeur', en: 'Developer' },
  summary: { fr: 'Résumé.', en: 'Summary.' },
  jobTitle: { fr: 'Développeur', en: 'Developer' },
  profiles: [{ network: 'github' as const, url: 'https://github.com/test' }],
  languages: [{ code: 'fr', level: { fr: 'Natif', en: 'Native' } }],
};
const project = {
  id: 'demo',
  title: { fr: 'Démo', en: 'Demo' },
  summary: { fr: 'Un projet.', en: 'A project.' },
  period: { start: '2025-01' },
  technologies: ['astro'],
  links: [{ kind: 'code' as const, url: 'https://github.com/test/demo' }],
  kind: 'software' as const,
};

const types = (data: { '@graph': { '@type': string }[] }) => data['@graph'].map((n) => n['@type']);

describe('JSON-LD generators', () => {
  it('person has a stable id, name, job title and profiles', () => {
    const p = personLd(profile, { site, lang: 'en' }, 'https://example.com/photo.webp');
    expect(p['@id']).toBe(personId(site));
    expect(p).toMatchObject({
      '@type': 'Person',
      name: 'Test Person',
      jobTitle: 'Developer',
      sameAs: ['https://github.com/test'],
      image: 'https://example.com/photo.webp',
    });
  });

  it('home page is a ProfilePage whose main entity is the person', () => {
    const data = graph(
      profilePageLd(profile, { site, lang: 'fr' }, '/fr/'),
      personLd(profile, { site, lang: 'fr' }),
    );
    expect(types(data)).toEqual(['ProfilePage', 'Person']);
    expect(data['@graph'][0]).toMatchObject({
      mainEntity: { '@id': personId(site) },
      inLanguage: 'fr',
    });
  });

  it('software project is SoftwareSourceCode, creative project is CreativeWork', () => {
    const ctx = { site, lang: 'en' as const };
    const soft = projectLd(project, ctx, { url: '/en/projects/demo/' });
    expect(soft).toMatchObject({
      '@type': 'SoftwareSourceCode',
      name: 'Demo',
      url: 'https://example.com/en/projects/demo/',
      author: { '@id': personId(site) },
      codeRepository: 'https://github.com/test/demo',
      dateCreated: '2025-01',
    });
    expect(projectLd({ ...project, kind: 'creative' }, ctx, { url: '/x/' })['@type']).toBe(
      'CreativeWork',
    );
  });

  it('diploma is an EducationalOccupationalCredential held by the person', () => {
    const nodes = educationLd(
      {
        title: { fr: 'Master', en: 'Master' },
        institution: 'Université',
        level: { fr: 'Bac+5', en: "Master's" },
        period: { start: '2018-09', end: '2020-06' },
      },
      { site, lang: 'en' },
      '/en/career/education/master/',
    );
    expect(nodes.map((n) => n['@type'])).toEqual(['EducationalOccupationalCredential', 'Person']);
    expect(nodes[1]).toMatchObject({
      '@id': personId(site),
      hasCredential: { '@id': nodes[0]!['@id'] },
    });
  });

  it('employment is an EmployeeRole, freelance an OrganizationRole', () => {
    const base = {
      position: { fr: 'Dev', en: 'Dev' },
      organization: 'Studio',
      period: { start: '2020-01', end: '2021-01' },
    };
    const ctx = { site, lang: 'en' as const };
    const job = experienceLd({ ...base, type: 'employment' }, ctx, '/en/career/experience/a/');
    expect(job[0]).toMatchObject({
      '@type': 'EmployeeRole',
      roleName: 'Dev',
      startDate: '2020-01',
      endDate: '2021-01',
      worksFor: { '@type': 'Organization', name: 'Studio' },
    });
    expect(job[1]).toMatchObject({ '@id': personId(site), worksFor: { '@id': job[0]!['@id'] } });
    expect(experienceLd({ ...base, type: 'freelance' }, ctx, '/x/')[0]!['@type']).toBe(
      'OrganizationRole',
    );
  });

  it('breadcrumb lists positions with absolute URLs', () => {
    const b = breadcrumb(site, [
      { name: 'Home', path: '/en/' },
      { name: 'Projects', path: '/en/projects/' },
    ]);
    expect(b['@type']).toBe('BreadcrumbList');
    expect(b.itemListElement[1]).toEqual({
      '@type': 'ListItem',
      position: 2,
      name: 'Projects',
      item: 'https://example.com/en/projects/',
    });
  });
});
