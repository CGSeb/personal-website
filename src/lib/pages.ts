// Every public HTML page, as pairs of the same page in French and English. Used by the
// sitemap and the llms.txt files so they cannot drift from the routes.
import type { Site } from '../content';
import { slugFor, urlFor, type Lang } from '../i18n/routes';

export type PagePair = Record<Lang, string>;

const pair = (fn: (lang: Lang) => string): PagePair => ({ fr: fn('fr'), en: fn('en') });

export function allPages(site: Site): PagePair[] {
  const usedCategories = site.categories.filter((c) =>
    site.projects.some((p) => p.categories.includes(c.id)),
  );
  return [
    pair((l) => urlFor('home', l)),
    pair((l) => urlFor('projects', l)),
    ...usedCategories.map((c) => pair((l) => urlFor('category', l, c.id))),
    ...site.projects.map((p) => pair((l) => urlFor('project', l, slugFor(p, l)))),
    pair((l) => urlFor('career', l)),
    pair((l) => urlFor('contact', l)),
    ...site.experience.map((e) => pair((l) => urlFor('experience', l, slugFor(e, l)))),
    ...site.education.map((e) => pair((l) => urlFor('education', l, slugFor(e, l)))),
  ];
}
