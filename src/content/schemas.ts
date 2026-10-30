// Content schemas (data-model.md). Pure Zod so they can be used by Astro collections
// and by unit tests alike.
import { z } from 'zod';

export const LANGS = ['fr', 'en'] as const;

const nonBlank = z.string().refine((s) => s.trim().length > 0, 'texte vide');

export const Id = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant kebab-case attendu (a-z, 0-9, tirets)');

export const LocalizedText = z.object({ fr: nonBlank, en: nonBlank }, 'texte FR/EN attendu');

const localizedTextMax = (max: number) =>
  z.object({
    fr: nonBlank.pipe(z.string().max(max, `${max} caractères au plus`)),
    en: nonBlank.pipe(z.string().max(max, `${max} caractères au plus`)),
  });

const localizedTextRange = (min: number, max: number) =>
  z.object({
    fr: nonBlank.pipe(
      z.string().min(min, `${min} caractères au moins`).max(max, `${max} caractères au plus`),
    ),
    en: nonBlank.pipe(
      z.string().min(min, `${min} caractères au moins`).max(max, `${max} caractères au plus`),
    ),
  });

export const LocalizedSlug = z.object({ fr: Id.optional(), en: Id.optional() });

export const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'date AAAA-MM attendue');

export const Period = z
  .object({ start: YearMonth, end: YearMonth.optional() })
  .refine((p) => !p.end || p.end >= p.start, {
    message: 'la fin doit être après le début',
    path: ['end'],
  });

/**
 * An image with its alternative text. `src` is a path checked by extension in unit tests, and
 * Astro's `image()` in the collections, which resolves the file next to the entry and fails the
 * build when it is missing.
 */
export const imageSchema = <S extends z.ZodType>(src: S) =>
  z
    .object({
      src,
      alt: LocalizedText.optional(),
      decorative: z.boolean().optional(),
    })
    .refine((img) => img.decorative === true || img.alt !== undefined, {
      message: 'texte alternatif FR/EN obligatoire (ou decorative: true)',
      path: ['alt'],
    });

export const Image = imageSchema(
  z.string().regex(/\.(jpe?g|png|webp|avif)$/i, 'image jpg, png, webp ou avif attendue'),
);

export const Link = z.object({
  kind: z.enum(['demo', 'code', 'video', 'article', 'other']),
  url: z.url({ protocol: /^https$/, error: 'URL https absolue attendue' }),
  label: LocalizedText.optional(),
});

export const Status = z.enum(['published', 'draft']).default('published');

const buildProfile = <I extends z.ZodType>(Img: I) =>
  z.object({
    name: nonBlank,
    headline: LocalizedText,
    summary: localizedTextMax(300),
    photo: Img,
    location: LocalizedText.optional(),
    languages: z
      .array(z.object({ code: z.string().regex(/^[a-z]{2}$/), level: LocalizedText }))
      .optional(),
    email: z.email('adresse e-mail invalide'),
    profiles: z
      .array(
        z.object({
          network: z.enum(['linkedin', 'github', 'youtube', 'x', 'mastodon', 'other']),
          url: z.url({ protocol: /^https$/ }),
          label: z.string().optional(),
        }),
      )
      .optional(),
    jobTitle: LocalizedText.optional(),
  });

export const taxonomySchema = z.object({ id: Id, label: LocalizedText });

const buildProject = <I extends z.ZodType>(Img: I) =>
  z.object({
    id: Id,
    title: localizedTextMax(80),
    summary: localizedTextRange(50, 160),
    role: LocalizedText,
    period: Period,
    categories: z.array(Id).min(1, 'au moins une catégorie'),
    technologies: z.array(Id).default([]),
    cover: Img.optional(),
    gallery: z.array(Img).default([]),
    links: z.array(Link).default([]),
    experience: z.array(Id).default([]),
    education: z.array(Id).default([]),
    featured: z.boolean().default(false),
    order: z.number().int().optional(),
    slug: LocalizedSlug.optional(),
    status: Status,
    kind: z.enum(['software', 'creative']).default('software'),
  });

export const profileSchema = buildProfile(Image);
export const projectSchema = buildProject(Image);

/** Profile and project schemas whose image `src` is Astro's `image()` (collections). */
export const withImageSource = <S extends z.ZodType>(src: S) => {
  const Img = imageSchema(src);
  return { profile: buildProfile(Img), project: buildProject(Img) };
};

export const educationSchema = z.object({
  id: Id,
  title: LocalizedText,
  institution: nonBlank,
  institutionUrl: z.url({ protocol: /^https$/ }).optional(),
  location: LocalizedText,
  period: Period,
  obtained: z.boolean().optional(),
  level: LocalizedText.optional(),
  skills: z.array(LocalizedText).default([]),
  slug: LocalizedSlug.optional(),
  status: Status,
});

export const experienceSchema = z.object({
  id: Id,
  position: LocalizedText,
  organization: nonBlank,
  organizationUrl: z.url({ protocol: /^https$/ }).optional(),
  location: LocalizedText,
  type: z.enum(['employment', 'freelance', 'internship', 'apprenticeship', 'volunteer']),
  period: Period,
  technologies: z.array(Id).default([]),
  slug: LocalizedSlug.optional(),
  status: Status,
});

export const pageSchema = z.object({
  title: nonBlank,
  description: z.string().min(50, '50 caractères au moins').max(160, '160 caractères au plus'),
});

/** Frontmatter of an element's long description (fr.md / en.md): none expected. */
export const bodySchema = z.object({}).loose();

export type Lang = (typeof LANGS)[number];
export type LocalizedTextT = z.infer<typeof LocalizedText>;
export type ImageT = z.infer<typeof Image>;
export type LinkT = z.infer<typeof Link>;
export type PeriodT = z.infer<typeof Period>;
export type Profile = z.infer<typeof profileSchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;
export type Project = z.infer<typeof projectSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;

/** Formats a Zod error as `<file> : <field> — <problem>` lines (FR-004). */
export function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.length ? issue.path.join('.') : '(racine)';
    return `${file} : ${field} — ${issue.message}`;
  });
}
