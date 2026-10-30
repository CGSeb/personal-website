// Cross-checks that a schema alone cannot express (data-model.md, rules 1-7). Pure function:
// the build calls it with the loaded collections, unit tests with fixtures.
import type { Education, Experience, Lang, Project, Taxonomy } from './schemas';
import { LANGS } from './schemas';

export type ElementCollection = 'projects' | 'education' | 'experience';

/** A project whose images are paths (unit tests) or already resolved by Astro (build). */
type ProjectLike = Omit<Project, 'cover' | 'gallery'> & {
  cover?: { src: unknown } | undefined;
  gallery: { src: unknown }[];
};

export interface ContentInput {
  projects: { folder: string; data: ProjectLike }[];
  education: { folder: string; data: Education }[];
  experience: { folder: string; data: Experience }[];
  categories: Taxonomy[];
  technologies: Taxonomy[];
  /** Keys `<collection>/<id>/<lang>` of long descriptions that exist and are not blank. */
  bodies: Set<string>;
  /**
   * Whether an image path (relative to its element folder) resolves to a file. Unit tests pass
   * it; the build leaves it out because Astro's `image()` already fails on a missing file.
   */
  imageExists?: (collection: ElementCollection | 'profile', folder: string, src: string) => boolean;
  profilePhoto?: { src: unknown } | undefined;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

/** Path segments a slug may not use, because static routes already take them. */
export const RESERVED_SLUGS = ['categorie', 'category'];

const where = (collection: string, id: string, file = 'meta.yaml') =>
  `content/${collection}/${id}/${file}`;

export function validateContent(input: ContentInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const collections = {
    projects: input.projects,
    education: input.education,
    experience: input.experience,
  } as const;

  const statusOf = new Map<string, string>();
  for (const [collection, entries] of Object.entries(collections)) {
    const seen = new Set<string>();
    const slugs: Record<Lang, Set<string>> = { fr: new Set(), en: new Set() };
    for (const { folder, data } of entries) {
      // Rule 1: id equals folder name, unique in its collection.
      if (data.id !== folder) {
        errors.push(
          `${where(collection, folder)} : id — « ${data.id} » doit être égal au nom du dossier « ${folder} »`,
        );
      }
      if (seen.has(data.id)) {
        errors.push(
          `${where(collection, folder)} : id — « ${data.id} » est déjà utilisé dans ${collection}`,
        );
      }
      seen.add(data.id);
      statusOf.set(`${collection}/${data.id}`, data.status);

      for (const lang of LANGS) {
        // Rule 2: both long descriptions exist.
        if (!input.bodies.has(`${collection}/${folder}/${lang}`)) {
          errors.push(
            `${where(collection, folder, `${lang}.md`)} : description — fichier manquant ou vide`,
          );
        }
        // Rule 5: slugs unique per language.
        const slug = data.slug?.[lang] ?? data.id;
        if (RESERVED_SLUGS.includes(slug)) {
          errors.push(`${where(collection, folder)} : slug.${lang} — « ${slug} » est réservé`);
        }
        if (slugs[lang].has(slug)) {
          errors.push(`${where(collection, folder)} : slug.${lang} — « ${slug} » est déjà utilisé`);
        }
        slugs[lang].add(slug);
      }
    }
  }

  const categoryIds = new Set(input.categories.map((c) => c.id));
  const technologyIds = new Set(input.technologies.map((t) => t.id));

  const checkRefs = (
    collection: string,
    folder: string,
    field: string,
    ids: string[],
    known: Set<string> | ElementCollection,
    published: boolean,
  ) => {
    ids.forEach((ref, i) => {
      if (typeof known === 'string') {
        const status = statusOf.get(`${known}/${ref}`);
        if (status === undefined) {
          errors.push(
            `${where(collection, folder)} : ${field}[${i}] — « ${ref} » n'existe pas dans ${known}`,
          );
        } else if (published && status === 'draft') {
          // Rule 4: published element pointing to a draft — warning, reference ignored.
          warnings.push(
            `${where(collection, folder)} : ${field}[${i}] — « ${ref} » est un brouillon, lien ignoré`,
          );
        }
      } else if (!known.has(ref)) {
        errors.push(`${where(collection, folder)} : ${field}[${i}] — « ${ref} » n'existe pas`);
      }
    });
  };

  const checkImage = (
    collection: ElementCollection,
    folder: string,
    field: string,
    img: { src: unknown },
  ) => {
    if (input.imageExists && !input.imageExists(collection, folder, String(img.src))) {
      errors.push(
        `${where(collection, folder)} : ${field}.src — fichier « ${img.src} » introuvable`,
      );
    }
  };

  // Rule 3 and 6: references and images.
  for (const { folder, data } of input.projects) {
    const published = data.status === 'published';
    checkRefs('projects', folder, 'categories', data.categories, categoryIds, published);
    checkRefs('projects', folder, 'technologies', data.technologies, technologyIds, published);
    checkRefs('projects', folder, 'experience', data.experience, 'experience', published);
    checkRefs('projects', folder, 'education', data.education, 'education', published);
    if (data.cover) checkImage('projects', folder, 'cover', data.cover);
    data.gallery.forEach((img, i) => checkImage('projects', folder, `gallery[${i}]`, img));
  }
  for (const { folder, data } of input.experience) {
    checkRefs('experience', folder, 'technologies', data.technologies, technologyIds, false);
  }
  const photo = input.profilePhoto;
  if (photo && input.imageExists && !input.imageExists('profile', '', String(photo.src))) {
    errors.push(`content/profile.yaml : photo.src — fichier « ${String(photo.src)} » introuvable`);
  }

  return { errors, warnings };
}
