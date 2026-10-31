// Builds /data/portfolio.json (contracts/portfolio-export.md, FR-006). Pure: images are of any
// type `I` and turned into URLs by `imageUrl`, so unit tests can pass plain paths.
import type {
  Education,
  Experience,
  LocalizedTextT,
  Profile,
  Project,
  Taxonomy,
} from '../content/schemas';
import { slugFor, urlFor, type PageType } from '../i18n/routes';
import { buildHash } from '../scene/hash';
import type { ItemType } from '../scene/layout';

export const SCHEMA_VERSION = 1;

interface Img<I> {
  image: I;
  alt: LocalizedTextT;
}

export interface ExportSite<I> {
  profile: Pick<Profile, 'name' | 'headline' | 'summary' | 'profiles'> & { photo: Img<I> };
  categories: Taxonomy[];
  technologies: Taxonomy[];
  /** Published projects, already sorted. */
  projects: (Omit<Project, 'cover' | 'gallery'> & {
    cover?: Img<I> | undefined;
    gallery: Img<I>[];
  })[];
  /** Published diplomas and experiences, with the ids of their published projects. */
  education: (Education & { projects: string[] })[];
  experience: (Experience & { projects: string[] })[];
}

export interface ExportOptions<I> {
  baseUrl: string;
  generatedAt: string;
  imageUrl: (image: I) => string;
}

const urls = (
  type: PageType,
  element: { id: string; slug?: { fr?: string; en?: string } | undefined },
) => ({
  fr: urlFor(type, 'fr', slugFor(element, 'fr')),
  en: urlFor(type, 'en', slugFor(element, 'en')),
});

/** The scene with the element's panel open (contracts/export-additions.md). */
const scene = (type: ItemType, id: string) => ({
  fr: urlFor('scene', 'fr') + buildHash({ type, id }, 'fr'),
  en: urlFor('scene', 'en') + buildHash({ type, id }, 'en'),
});

const period = (p: { start: string; end?: string | undefined }) => ({
  start: p.start,
  end: p.end ?? null,
});

export function buildExport<I>(
  site: ExportSite<I>,
  { baseUrl, generatedAt, imageUrl }: ExportOptions<I>,
) {
  const image = (img: Img<I>) => ({ url: imageUrl(img.image), alt: img.alt });
  // Decorative gallery images have an empty alternative text: exported as null.
  const galleryImage = (img: Img<I>) => ({
    url: imageUrl(img.image),
    alt: img.alt.fr && img.alt.en ? img.alt : null,
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    site: { baseUrl, languages: ['fr', 'en'] },
    profile: {
      name: site.profile.name,
      headline: site.profile.headline,
      summary: site.profile.summary,
      photo: image(site.profile.photo),
      // The e-mail is left out on purpose: the export is public and easy to harvest.
      profiles: (site.profile.profiles ?? []).map((p) => ({ network: p.network, url: p.url })),
    },
    categories: site.categories.map((c) => ({ id: c.id, label: c.label })),
    technologies: site.technologies.map((t) => ({ id: t.id, label: t.label })),
    projects: site.projects.map((p, index) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      role: p.role,
      kind: p.kind,
      period: period(p.period),
      categories: p.categories,
      technologies: p.technologies,
      cover: p.cover ? image(p.cover) : null,
      gallery: p.gallery.map(galleryImage),
      links: p.links.map((l) => ({ kind: l.kind, url: l.url, label: l.label ?? null })),
      experience: p.experience,
      education: p.education,
      featured: p.featured,
      // Position in the site's own order (explicit `order`, then most recent first).
      order: index,
      urls: urls('project', p),
      scene: scene('project', p.id),
    })),
    education: site.education.map((e) => ({
      id: e.id,
      title: e.title,
      institution: e.institution,
      institutionUrl: e.institutionUrl ?? null,
      location: e.location,
      period: period(e.period),
      obtained: e.obtained ?? false,
      level: e.level ?? null,
      skills: e.skills,
      projects: e.projects,
      urls: urls('education', e),
      scene: scene('education', e.id),
    })),
    experience: site.experience.map((e) => ({
      id: e.id,
      position: e.position,
      organization: e.organization,
      organizationUrl: e.organizationUrl ?? null,
      location: e.location,
      type: e.type,
      period: period(e.period),
      technologies: e.technologies,
      projects: e.projects,
      urls: urls('experience', e),
      scene: scene('experience', e.id),
    })),
  };
}
