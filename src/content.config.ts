// Content collections read from `content/` (contracts/content-source.md). `CONTENT_DIR`
// points the build at another folder; the build tests use it with the fixtures.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  bodySchema,
  educationSchema,
  experienceSchema,
  pageSchema,
  taxonomySchema,
  withImageSource,
} from './content/schemas';

const root = process.env.CONTENT_DIR ?? 'content';

const folderId = ({ entry }: { entry: string }) => entry.split('/')[0]!;
// `<id>/fr.md` -> `<id>/fr`
const bodyId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

// Each element folder holds `meta.yaml` (one collection) and `fr.md` / `en.md` (another).
const metaLoader = (dir: string) =>
  glob({ pattern: '*/meta.yaml', base: `${root}/${dir}`, generateId: folderId });
const bodies = (dir: string) =>
  defineCollection({
    loader: glob({ pattern: '*/{fr,en}.md', base: `${root}/${dir}`, generateId: bodyId }),
    schema: bodySchema,
  });

export const collections = {
  profile: defineCollection({
    loader: glob({ pattern: 'profile.yaml', base: root, generateId: () => 'profile' }),
    schema: ({ image }) => withImageSource(image()).profile,
  }),
  categories: defineCollection({ loader: file(`${root}/categories.yaml`), schema: taxonomySchema }),
  technologies: defineCollection({
    loader: file(`${root}/technologies.yaml`),
    schema: taxonomySchema,
  }),
  projects: defineCollection({
    loader: metaLoader('projects'),
    schema: ({ image }) => withImageSource(image()).project,
  }),
  projectBodies: bodies('projects'),
  education: defineCollection({ loader: metaLoader('education'), schema: educationSchema }),
  educationBodies: bodies('education'),
  experience: defineCollection({ loader: metaLoader('experience'), schema: experienceSchema }),
  experienceBodies: bodies('experience'),
  pages: defineCollection({
    loader: glob({ pattern: '*/{fr,en}.md', base: `${root}/pages`, generateId: bodyId }),
    schema: pageSchema,
  }),
};
