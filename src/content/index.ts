// Content access layer: loads the collections once, validates them (the build fails on
// error), drops drafts, sorts, resolves images and computes reverse relations.
import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Education, Experience, ImageT, Lang, Profile, Project, Taxonomy } from './schemas';
import { validateContent, type ElementCollection } from './validate';

const imageFiles = import.meta.glob<ImageMetadata>('/content/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

const imagePath = (collection: ElementCollection | 'profile', folder: string, src: string) => {
  const rel = src.replace(/^\.\//, '');
  return collection === 'profile' ? `/content/${rel}` : `/content/${collection}/${folder}/${rel}`;
};

export interface ResolvedImage {
  image: ImageMetadata;
  alt: { fr: string; en: string };
}

const resolveImage = (
  collection: ElementCollection | 'profile',
  folder: string,
  img: ImageT,
): ResolvedImage => ({
  image: imageFiles[imagePath(collection, folder, img.src)]!,
  alt: img.alt ?? { fr: '', en: '' },
});

type BodyEntry =
  | CollectionEntry<'projectBodies'>
  | CollectionEntry<'educationBodies'>
  | CollectionEntry<'experienceBodies'>;
export type Bodies = Record<Lang, BodyEntry>;

export interface ProjectItem extends Omit<Project, 'cover' | 'gallery'> {
  cover?: ResolvedImage;
  gallery: ResolvedImage[];
  bodies: Bodies;
}
export interface EducationItem extends Education {
  bodies: Bodies;
  projects: string[];
}
export interface ExperienceItem extends Experience {
  bodies: Bodies;
  projects: string[];
}
export interface Site {
  profile: Omit<Profile, 'photo'> & { photo: ResolvedImage };
  categories: Taxonomy[];
  technologies: Taxonomy[];
  projects: ProjectItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  pages: Record<'home' | 'career' | 'contact', Record<Lang, CollectionEntry<'pages'>>>;
}

const byStartDesc = (a: { period: { start: string } }, b: { period: { start: string } }) =>
  b.period.start.localeCompare(a.period.start);

/** Projects: `order` ascending first, then most recent first (data-model.md). */
type Sortable = { order?: number | undefined; period: { start: string } };
export const compareProjects = (a: Sortable, b: Sortable): number => {
  if (a.order !== undefined || b.order !== undefined) {
    return (
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      byStartDesc(a, b)
    );
  }
  return byStartDesc(a, b);
};

const bodiesOf = <T extends BodyEntry>(entries: T[]) => {
  const map = new Map<string, T>();
  for (const e of entries) map.set(e.id, e);
  return map;
};

let sitePromise: Promise<Site> | undefined;

export function getSite(): Promise<Site> {
  sitePromise ??= loadSite();
  return sitePromise;
}

async function loadSite(): Promise<Site> {
  const [
    profileEntries,
    categories,
    technologies,
    projects,
    projectBodies,
    education,
    educationBodies,
    experience,
    experienceBodies,
    pages,
  ] = await Promise.all([
    getCollection('profile'),
    getCollection('categories'),
    getCollection('technologies'),
    getCollection('projects'),
    getCollection('projectBodies'),
    getCollection('education'),
    getCollection('educationBodies'),
    getCollection('experience'),
    getCollection('experienceBodies'),
    getCollection('pages'),
  ]);

  const profile = profileEntries[0]?.data;
  if (!profile) throw new Error('content/profile.yaml : fichier manquant');

  const bodyMaps = {
    projects: bodiesOf(projectBodies),
    education: bodiesOf(educationBodies),
    experience: bodiesOf(experienceBodies),
  };
  const bodies = new Set<string>();
  for (const [collection, map] of Object.entries(bodyMaps)) {
    for (const [id, entry] of map) if (entry.body?.trim()) bodies.add(`${collection}/${id}`);
  }

  const { errors, warnings } = validateContent({
    projects: projects.map((e) => ({ folder: e.id, data: e.data })),
    education: education.map((e) => ({ folder: e.id, data: e.data })),
    experience: experience.map((e) => ({ folder: e.id, data: e.data })),
    categories: categories.map((e) => e.data),
    technologies: technologies.map((e) => e.data),
    bodies,
    imageExists: (collection, folder, src) => imagePath(collection, folder, src) in imageFiles,
    profilePhoto: profile.photo,
  });
  for (const w of warnings) console.warn(`[contenu] ${w}`);
  if (errors.length) {
    throw new Error(`Contenu invalide (${errors.length} erreur(s)) :\n- ${errors.join('\n- ')}`);
  }

  const pick = <T extends BodyEntry>(map: Map<string, T>, id: string): Bodies => ({
    fr: map.get(`${id}/fr`)!,
    en: map.get(`${id}/en`)!,
  });

  const published = <T extends { data: { status: string } }>(list: T[]) =>
    list.filter((e) => e.data.status === 'published');

  const publishedEducation = new Set(published(education).map((e) => e.id));
  const publishedExperience = new Set(published(experience).map((e) => e.id));

  const projectItems: ProjectItem[] = published(projects)
    .map(({ id, data }) => ({
      ...data,
      // References to drafts are ignored (validation warned about them).
      experience: data.experience.filter((ref) => publishedExperience.has(ref)),
      education: data.education.filter((ref) => publishedEducation.has(ref)),
      cover: data.cover ? resolveImage('projects', id, data.cover) : undefined,
      gallery: data.gallery.map((img) => resolveImage('projects', id, img)),
      bodies: pick(bodyMaps.projects, id),
    }))
    .sort(compareProjects);

  const projectsLinkedTo = (field: 'experience' | 'education', id: string) =>
    projectItems.filter((p) => p[field].includes(id)).map((p) => p.id);

  const pageMap = {} as Site['pages'];
  for (const entry of pages) {
    const [page, lang] = entry.id.split('/') as ['home' | 'career' | 'contact', Lang];
    (pageMap[page] ??= {} as Record<Lang, CollectionEntry<'pages'>>)[lang] = entry;
  }

  return {
    profile: { ...profile, photo: resolveImage('profile', '', profile.photo) },
    categories: categories.map((e) => e.data),
    technologies: technologies.map((e) => e.data),
    projects: projectItems,
    education: published(education)
      .map(({ id, data }) => ({
        ...data,
        bodies: pick(bodyMaps.education, id),
        projects: projectsLinkedTo('education', id),
      }))
      .sort(byStartDesc),
    experience: published(experience)
      .map(({ id, data }) => ({
        ...data,
        bodies: pick(bodyMaps.experience, id),
        projects: projectsLinkedTo('experience', id),
      }))
      .sort(byStartDesc),
    pages: pageMap,
  };
}

/** Lookup helpers. */
export const findById = <T extends { id: string }>(list: T[], id: string): T | undefined =>
  list.find((item) => item.id === id);

export const labelOf = (list: Taxonomy[], id: string, lang: Lang): string =>
  findById(list, id)?.label[lang] ?? id;
