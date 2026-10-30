// getStaticPaths helpers shared by the French and English page files.
import { getSite } from '../content';
import { slugFor, type Lang } from '../i18n/routes';

export async function projectPaths(lang: Lang) {
  const { projects } = await getSite();
  return projects.map((project) => ({
    params: { slug: slugFor(project, lang) },
    props: { id: project.id },
  }));
}

/** One page per category that has at least one published project. */
export async function categoryPaths() {
  const { projects, categories } = await getSite();
  return categories
    .filter((c) => projects.some((p) => p.categories.includes(c.id)))
    .map((c) => ({ params: { cat: c.id }, props: { id: c.id } }));
}
