import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import schema from '../../src/lib/export.schema.json' with { type: 'json' };
import type { Project } from '../../src/content/schemas';
import { buildExport, type ExportSite } from '../../src/lib/export';
import { loadFixture } from './load-fixture';

const ajv = new Ajv2020({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile(schema);

// The export site the build would assemble from the valid fixture: drafts dropped,
// reverse relations computed.
function fixtureSite(): ExportSite<string> {
  const { input } = loadFixture('valid');
  // Fixture images are plain paths, so the parsed data is a `Project`.
  const projects = input.projects
    .map((p) => p.data as Project)
    .filter((p) => p.status === 'published');
  const linked = (field: 'experience' | 'education', id: string) =>
    projects.filter((p) => p[field].includes(id)).map((p) => p.id);
  return {
    profile: {
      name: 'Test Person',
      headline: { fr: 'Développeur', en: 'Developer' },
      summary: { fr: 'Résumé.', en: 'Summary.' },
      profiles: [{ network: 'github', url: 'https://github.com/test' }],
      photo: { image: './photo.webp', alt: { fr: 'Portrait', en: 'Portrait' } },
    },
    categories: input.categories,
    technologies: input.technologies,
    projects: projects.map(({ cover, gallery: _gallery, ...p }) => ({
      ...p,
      cover: cover && { image: cover.src, alt: cover.alt! },
    })),
    education: input.education.map((e) => ({
      ...e.data,
      projects: linked('education', e.data.id),
    })),
    experience: input.experience.map((e) => ({
      ...e.data,
      projects: linked('experience', e.data.id),
    })),
  };
}

const exported = buildExport(fixtureSite(), {
  baseUrl: 'https://example.com',
  generatedAt: '2026-10-30T12:00:00.000Z',
  imageUrl: (src) => `/_astro/${src.replace('./', '')}`,
});

describe('portfolio.json export', () => {
  it('matches the JSON Schema of contracts/portfolio-export.md', () => {
    const ok = validate(exported);
    expect(validate.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
  });

  it('has no e-mail and no long descriptions', () => {
    const json = JSON.stringify(exported);
    expect(json).not.toContain('test@example.com');
    expect(json).not.toContain('Description FR.');
  });

  it('keeps the ids of the content source (US6-4)', () => {
    expect(exported.projects.map((p) => p.id)).toEqual(['alpha', 'beta']);
    expect(exported.experience.map((e) => e.id)).toEqual(['job-a', 'job-b']);
  });

  it('includes reverse relations', () => {
    const jobA = exported.experience.find((e) => e.id === 'job-a')!;
    expect(jobA.projects).toEqual(['alpha', 'beta']);
    expect(exported.education[0]!.projects).toEqual(['alpha']);
  });

  it('gives page URLs per language and null for missing values', () => {
    const beta = exported.projects.find((p) => p.id === 'beta')!;
    expect(beta.urls).toEqual({ fr: '/fr/projets/beta/', en: '/en/projects/beta/' });
    expect(beta.cover).toBeNull();
    expect(beta.period.end).toBeNull();
    expect(exported.projects[0]!.cover?.url).toBe('/_astro/cover.webp');
  });
});
