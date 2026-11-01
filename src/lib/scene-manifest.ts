// Builds the scene manifest (data-model.md, `SceneItem`) from the published content, for one
// language. Pure: covers are any type `I`, turned into URLs by `imageUrl`.
import type { Lang, LocalizedTextT, PeriodT } from '../content/schemas';
import { slugFor, urlFor } from '../i18n/routes';
import type { SceneItem } from '../scene/layout';

type Slug = { fr?: string; en?: string } | undefined;

export interface ManifestSite<I> {
  /** Published projects in site order. */
  projects: {
    id: string;
    title: LocalizedTextT;
    period: PeriodT;
    featured: boolean;
    slug?: Slug;
    cover?: { image: I } | undefined;
  }[];
  /** Published diplomas and experiences, most recent first. */
  education: {
    id: string;
    title: LocalizedTextT;
    institution: string;
    level?: LocalizedTextT | undefined;
    period: PeriodT;
    slug?: Slug;
  }[];
  experience: {
    id: string;
    position: LocalizedTextT;
    organization: string;
    period: PeriodT;
    slug?: Slug;
  }[];
}

const BADGE_MAX = 40;
const year = (ym: string) => ym.slice(0, 4);
const years = ({ start, end }: { start: string; end?: string }) =>
  end && year(end) !== year(start) ? `${year(start)}–${year(end)}` : year(start);
const badge = (text: string) =>
  text.length <= BADGE_MAX ? text : `${text.slice(0, BADGE_MAX - 1).trimEnd()}…`;

export function buildManifest<I>(
  site: ManifestSite<I>,
  lang: Lang,
  imageUrl: (image: I) => string,
): SceneItem[] {
  return [
    ...site.projects.map((p, order) => ({
      key: `project/${p.id}`,
      type: 'project' as const,
      id: p.id,
      label: p.title[lang],
      order,
      featured: p.featured,
      image: p.cover ? imageUrl(p.cover.image) : null,
      badge: badge(year(p.period.start)),
      href: urlFor('project', lang, slugFor(p, lang)),
      panelId: `panel-project-${p.id}`,
    })),
    ...site.education.map((e, order) => ({
      key: `education/${e.id}`,
      type: 'education' as const,
      id: e.id,
      label: e.title[lang],
      order,
      featured: false,
      image: null,
      badge: badge(
        [e.level?.[lang], year(e.period.end ?? e.period.start)].filter(Boolean).join(' · '),
      ),
      href: urlFor('education', lang, slugFor(e, lang)),
      panelId: `panel-education-${e.id}`,
    })),
    ...site.experience.map((e, order) => ({
      key: `experience/${e.id}`,
      type: 'experience' as const,
      id: e.id,
      label: `${e.position[lang]} — ${e.organization}`,
      order,
      featured: false,
      image: null,
      badge: badge(`${e.organization} · ${years(e.period)}`),
      href: urlFor('experience', lang, slugFor(e, lang)),
      panelId: `panel-experience-${e.id}`,
    })),
  ];
}
