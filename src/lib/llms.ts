// llms.txt (llmstxt.org) and llms-full.txt, generated from the content source (FR-019).
// French sections first, then English; every link is absolute.
import type { Lang, LocalizedTextT, PeriodT } from '../content/schemas';
import { formatYearMonth } from '../i18n/ui';

interface Item {
  title: LocalizedTextT;
  urls: Record<Lang, string>;
  /** Long description in Markdown. */
  text: Record<Lang, string>;
}

export interface LlmsInput {
  site: URL;
  profile: { name: string; headline: LocalizedTextT; summary: LocalizedTextT };
  projects: (Item & { summary: LocalizedTextT })[];
  experience: (Item & { organization: string; period: PeriodT })[];
  education: (Item & { organization: string; period: PeriodT })[];
}

const HEADINGS: Record<Lang, { projects: string; experience: string; education: string }> = {
  fr: { projects: 'Projets', experience: 'Expériences', education: 'Formation' },
  en: { projects: 'Projects', experience: 'Experience', education: 'Education' },
};
const SINCE: Record<Lang, string> = { fr: 'depuis', en: 'since' };

const abs = (site: URL, path: string) => new URL(path, site).href;

const period = (lang: Lang, p: PeriodT) =>
  p.end
    ? `${formatYearMonth(lang, p.start)} – ${formatYearMonth(lang, p.end)}`
    : `${SINCE[lang]} ${formatYearMonth(lang, p.start)}`;

const careerLabel = (lang: Lang, item: { title: LocalizedTextT; organization: string }) =>
  `${item.title[lang]} — ${item.organization}`;

/** Shift Markdown headings so an element's description nests under its own H3. */
const demote = (markdown: string, levels: number) =>
  markdown.replace(
    /^(#{1,6}) /gm,
    (_, hashes: string) => `${'#'.repeat(Math.min(6, hashes.length + levels))} `,
  );

export function buildLlms(input: LlmsInput): string {
  const { site, profile } = input;
  const out = [
    `# ${profile.name}`,
    '',
    `> ${profile.headline.fr} / ${profile.headline.en}`,
    '',
    profile.summary.fr,
    '',
    profile.summary.en,
  ];
  for (const lang of ['fr', 'en'] as const) {
    const h = HEADINGS[lang];
    out.push('', `## ${h.projects}`, '');
    for (const p of input.projects)
      out.push(`- [${p.title[lang]}](${abs(site, p.urls[lang])}): ${p.summary[lang]}`);
    out.push('', `## ${h.experience}`, '');
    for (const e of input.experience)
      out.push(
        `- [${careerLabel(lang, e)}](${abs(site, e.urls[lang])}): ${period(lang, e.period)}`,
      );
    out.push('', `## ${h.education}`, '');
    for (const e of input.education)
      out.push(
        `- [${careerLabel(lang, e)}](${abs(site, e.urls[lang])}): ${period(lang, e.period)}`,
      );
  }
  out.push(
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${abs(site, '/llms-full.txt')}): every description in full, French and English`,
    `- [portfolio.json](${abs(site, '/data/portfolio.json')}): structured export of the content`,
    '',
  );
  return out.join('\n');
}

export function buildLlmsFull(input: LlmsInput): string {
  const { site, profile } = input;
  const out = [`# ${profile.name}`, '', `> ${profile.headline.fr} / ${profile.headline.en}`];
  for (const lang of ['fr', 'en'] as const) {
    const h = HEADINGS[lang];
    out.push('', profile.summary[lang], '', `## ${h.projects}`);
    for (const p of input.projects) {
      out.push(
        '',
        `### ${p.title[lang]}`,
        '',
        `${abs(site, p.urls[lang])}`,
        '',
        p.summary[lang],
        '',
        demote(p.text[lang].trim(), 2),
      );
    }
    for (const [key, list] of [
      ['experience', input.experience],
      ['education', input.education],
    ] as const) {
      out.push('', `## ${h[key]}`);
      for (const e of list) {
        out.push(
          '',
          `### ${careerLabel(lang, e)}`,
          '',
          `${abs(site, e.urls[lang])} · ${period(lang, e.period)}`,
          '',
          demote(e.text[lang].trim(), 2),
        );
      }
    }
  }
  out.push('');
  return out.join('\n');
}
