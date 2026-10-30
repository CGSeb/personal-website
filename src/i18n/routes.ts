// Public URLs per language (contracts/routes.md).
import type { Lang } from '../content/schemas';

export type { Lang };
export const LANGS: readonly Lang[] = ['fr', 'en'];
export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

/** Translated path segments. */
export const SEGMENTS = {
  projects: { fr: 'projets', en: 'projects' },
  category: { fr: 'categorie', en: 'category' },
  career: { fr: 'parcours', en: 'career' },
  education: { fr: 'diplomes', en: 'education' },
  experience: { fr: 'experiences', en: 'experience' },
  contact: { fr: 'contact', en: 'contact' },
  scene: { fr: 'explorer', en: 'explore' },
} as const satisfies Record<string, Record<Lang, string>>;

/**
 * Sections whose pages exist; navigation only links to these.
 */
export const SECTIONS = { career: true, contact: true };

export type PageType =
  | 'home'
  | 'projects'
  | 'category'
  | 'project'
  | 'career'
  | 'education'
  | 'experience'
  | 'contact'
  | 'scene';

interface Sluggable {
  id: string;
  slug?: { fr?: string; en?: string } | undefined;
}

/** Slug of an element in a language: its localized slug, else its id. */
export const slugFor = (element: Sluggable, lang: Lang): string =>
  element.slug?.[lang] ?? element.id;

/** Absolute path of a page. `slug` is required for category, project, education and experience. */
export function urlFor(type: PageType, lang: Lang, slug?: string): string {
  const s = (key: keyof typeof SEGMENTS) => SEGMENTS[key][lang];
  const need = () => {
    if (!slug) throw new Error(`urlFor(${type}, ${lang}) : slug manquant`);
    return slug;
  };
  switch (type) {
    case 'home':
      return `/${lang}/`;
    case 'projects':
      return `/${lang}/${s('projects')}/`;
    case 'category':
      return `/${lang}/${s('projects')}/${s('category')}/${need()}/`;
    case 'project':
      return `/${lang}/${s('projects')}/${need()}/`;
    case 'career':
      return `/${lang}/${s('career')}/`;
    case 'education':
      return `/${lang}/${s('career')}/${s('education')}/${need()}/`;
    case 'experience':
      return `/${lang}/${s('career')}/${s('experience')}/${need()}/`;
    case 'contact':
      return `/${lang}/${s('contact')}/`;
    case 'scene':
      return `/${lang}/${s('scene')}/`;
  }
}

/** Same page in the other language. Pass the element for element pages, the category id for categories. */
export function alternateOf(type: PageType, lang: Lang, target?: Sluggable | string): string {
  const other = otherLang(lang);
  if (target === undefined) return urlFor(type, other);
  return urlFor(type, other, typeof target === 'string' ? target : slugFor(target, other));
}
