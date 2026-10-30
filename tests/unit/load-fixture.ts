// Loads a fixture content folder (same layout as `content/`) the way the build does:
// schema parsing first, then the cross-check.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { ZodType } from 'zod';
import {
  educationSchema,
  experienceSchema,
  formatIssues,
  profileSchema,
  projectSchema,
  taxonomySchema,
} from '../../src/content/schemas';
import { validateContent, type ContentInput } from '../../src/content/validate';

export function loadFixture(name: 'valid' | 'invalid') {
  const root = join(import.meta.dirname, '..', 'fixtures', 'content', name);
  const schemaErrors: string[] = [];

  const parseFile = <T>(rel: string, schema: ZodType<T>): T | undefined => {
    const result = schema.safeParse(parse(readFileSync(join(root, rel), 'utf8')));
    if (result.success) return result.data;
    schemaErrors.push(...formatIssues(`content/${rel}`, result.error));
    return undefined;
  };

  const bodies = new Set<string>();
  const elements = <T>(collection: 'projects' | 'education' | 'experience', schema: ZodType<T>) => {
    const dir = join(root, collection);
    const out: { folder: string; data: T }[] = [];
    for (const folder of readdirSync(dir)) {
      for (const lang of ['fr', 'en']) {
        const file = join(dir, folder, `${lang}.md`);
        if (existsSync(file) && readFileSync(file, 'utf8').trim())
          bodies.add(`${collection}/${folder}/${lang}`);
      }
      const data = parseFile(`${collection}/${folder}/meta.yaml`, schema);
      if (data) out.push({ folder, data });
    }
    return out;
  };

  const profile = parseFile('profile.yaml', profileSchema);
  const list = (rel: string) =>
    (parse(readFileSync(join(root, rel), 'utf8')) as unknown[]).flatMap((item, i) => {
      const r = taxonomySchema.safeParse(item);
      if (r.success) return [r.data];
      schemaErrors.push(...formatIssues(`content/${rel}[${i}]`, r.error));
      return [];
    });

  const input: ContentInput = {
    projects: elements('projects', projectSchema),
    education: elements('education', educationSchema),
    experience: elements('experience', experienceSchema),
    categories: list('categories.yaml'),
    technologies: list('technologies.yaml'),
    bodies,
    imageExists: (collection, folder, src) =>
      existsSync(collection === 'profile' ? join(root, src) : join(root, collection, folder, src)),
    profilePhoto: profile?.photo,
  };

  return { schemaErrors, input, result: validateContent(input) };
}
