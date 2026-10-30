import { describe, expect, it } from 'vitest';
import { Period, projectSchema } from '../../src/content/schemas';
import { validateContent } from '../../src/content/validate';
import { loadFixture } from './load-fixture';

describe('valid fixture', () => {
  const { schemaErrors, input, result } = loadFixture('valid');

  it('parses without schema errors', () => {
    expect(schemaErrors).toEqual([]);
  });

  it('passes the cross-check', () => {
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('applies defaults', () => {
    const beta = input.projects.find((p) => p.folder === 'beta')!.data;
    expect(beta.kind).toBe('software');
    expect(beta.gallery).toEqual([]);
  });

  it('warns when a published project links to a draft', () => {
    const draftJob = {
      ...input.experience[0]!,
      data: { ...input.experience[0]!.data, status: 'draft' as const },
    };
    const { errors, warnings } = validateContent({
      ...input,
      experience: [draftJob, ...input.experience.slice(1)],
    });
    expect(errors).toEqual([]);
    expect(warnings).toContain(
      'content/projects/alpha/meta.yaml : experience[0] — « job-a » est un brouillon, lien ignoré',
    );
  });
});

describe('invalid fixture', () => {
  const { schemaErrors, result } = loadFixture('invalid');
  const all = [...schemaErrors, ...result.errors];

  it.each([
    ['missing translation', 'content/projects/missing-translation/meta.yaml : title.en —'],
    [
      'broken category reference',
      "content/projects/broken-ref/meta.yaml : categories[0] — « nope » n'existe pas",
    ],
    [
      'broken experience reference',
      "content/projects/broken-ref/meta.yaml : experience[0] — « ghost-job » n'existe pas dans experience",
    ],
    [
      'missing long description',
      'content/projects/broken-ref/en.md : description — fichier manquant ou vide',
    ],
    [
      'id not matching folder',
      'content/projects/dup-copy/meta.yaml : id — « alpha » doit être égal au nom du dossier « dup-copy »',
    ],
    [
      'duplicate id',
      'content/projects/dup-copy/meta.yaml : id — « alpha » est déjà utilisé dans projects',
    ],
    [
      'bad period',
      'content/projects/bad-period/meta.yaml : period.end — la fin doit être après le début',
    ],
    [
      'missing alt',
      'content/projects/no-alt/meta.yaml : cover.alt — texte alternatif FR/EN obligatoire',
    ],
  ])('reports %s', (_, expected) => {
    expect(all.some((message) => message.startsWith(expected))).toBe(true);
  });
});

describe('schemas', () => {
  it('rejects a summary outside 50-160 characters', () => {
    const r = projectSchema.safeParse({
      id: 'x1',
      title: { fr: 'T', en: 'T' },
      summary: { fr: 'trop court', en: 'too short' },
      role: { fr: 'R', en: 'R' },
      period: { start: '2024-01' },
      categories: ['web'],
    });
    expect(r.success).toBe(false);
  });

  it('accepts an ongoing period and rejects an invalid month', () => {
    expect(Period.safeParse({ start: '2024-01' }).success).toBe(true);
    expect(Period.safeParse({ start: '2024-13' }).success).toBe(false);
  });

  it('rejects non-https links', () => {
    const r = projectSchema.shape.links.safeParse([{ kind: 'demo', url: 'http://example.com' }]);
    expect(r.success).toBe(false);
  });
});
