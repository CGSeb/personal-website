// Content collections read from `content/` (contracts/content-source.md).
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  bodySchema,
  educationSchema,
  experienceSchema,
  pageSchema,
  profileSchema,
  projectSchema,
  taxonomySchema,
} from './content/schemas';

const folderId = ({ entry }: { entry: string }) => entry.split('/')[0]!;
// `<id>/fr.md` -> `<id>/fr`
const bodyId = ({ entry }: { entry: string }) => entry.replace(/\.md$/, '');

// Each element folder holds `meta.yaml` (one collection) and `fr.md` / `en.md` (another).
const metaLoader = (base: string) => glob({ pattern: '*/meta.yaml', base, generateId: folderId });
const bodies = (base: string) =>
  defineCollection({
    loader: glob({ pattern: '*/{fr,en}.md', base, generateId: bodyId }),
    schema: bodySchema,
  });

export const collections = {
  profile: defineCollection({
    loader: glob({ pattern: 'profile.yaml', base: 'content', generateId: () => 'profile' }),
    schema: profileSchema,
  }),
  categories: defineCollection({ loader: file('content/categories.yaml'), schema: taxonomySchema }),
  technologies: defineCollection({
    loader: file('content/technologies.yaml'),
    schema: taxonomySchema,
  }),
  projects: defineCollection({ loader: metaLoader('content/projects'), schema: projectSchema }),
  projectBodies: bodies('content/projects'),
  education: defineCollection({ loader: metaLoader('content/education'), schema: educationSchema }),
  educationBodies: bodies('content/education'),
  experience: defineCollection({
    loader: metaLoader('content/experience'),
    schema: experienceSchema,
  }),
  experienceBodies: bodies('content/experience'),
  pages: defineCollection({
    loader: glob({ pattern: '*/{fr,en}.md', base: 'content/pages', generateId: bodyId }),
    schema: pageSchema,
  }),
};
