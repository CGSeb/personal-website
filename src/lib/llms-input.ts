// Maps the loaded content to the plain input of the llms.txt builders.
import type { Site } from '../content';
import { slugFor, urlFor } from '../i18n/routes';
import type { LlmsInput } from './llms';

export function llmsInput(site: Site, base: URL): LlmsInput {
  const text = (bodies: { fr: { body?: string }; en: { body?: string } }) => ({
    fr: bodies.fr.body ?? '',
    en: bodies.en.body ?? '',
  });
  return {
    site: base,
    profile: site.profile,
    projects: site.projects.map((p) => ({
      title: p.title,
      summary: p.summary,
      urls: {
        fr: urlFor('project', 'fr', slugFor(p, 'fr')),
        en: urlFor('project', 'en', slugFor(p, 'en')),
      },
      text: text(p.bodies),
    })),
    experience: site.experience.map((e) => ({
      title: e.position,
      organization: e.organization,
      period: e.period,
      urls: {
        fr: urlFor('experience', 'fr', slugFor(e, 'fr')),
        en: urlFor('experience', 'en', slugFor(e, 'en')),
      },
      text: text(e.bodies),
    })),
    education: site.education.map((e) => ({
      title: e.title,
      organization: e.institution,
      period: e.period,
      urls: {
        fr: urlFor('education', 'fr', slugFor(e, 'fr')),
        en: urlFor('education', 'en', slugFor(e, 'en')),
      },
      text: text(e.bodies),
    })),
  };
}
