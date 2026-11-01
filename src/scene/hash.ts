// The open item lives in the URL fragment: `#projet/lesson-folk` (fr), `#project/lesson-folk`
// (en) — contracts/scene-page.md. Pure helpers, unit tested.
import type { Lang } from '../content/schemas';
import type { ItemType } from './layout';

const TYPE_SEGMENTS: Record<ItemType, Record<Lang, string>> = {
  project: { fr: 'projet', en: 'project' },
  education: { fr: 'diplome', en: 'education' },
  experience: { fr: 'experience', en: 'experience' },
};

export interface HashTarget {
  type: ItemType;
  id: string;
}

/** Reads a fragment in either language; anything else gives null. */
export function parseHash(hash: string): HashTarget | null {
  const match = /^#?([a-z]+)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(hash);
  if (!match) return null;
  const [, segment, id] = match;
  for (const [type, names] of Object.entries(TYPE_SEGMENTS)) {
    if (names.fr === segment || names.en === segment) return { type: type as ItemType, id: id! };
  }
  return null;
}

export const buildHash = ({ type, id }: HashTarget, lang: Lang): string =>
  `#${TYPE_SEGMENTS[type][lang]}/${id}`;

// The figure's welcome bubble has its own fragment, not an item's (specs/004, contracts/avatar.md).
const WELCOME_HASHES: Record<Lang, string> = { fr: '#bienvenue', en: '#welcome' };

export const welcomeHash = (lang: Lang): string => WELCOME_HASHES[lang];

/** True for the welcome fragment of either language. */
export const isWelcomeHash = (hash: string): boolean =>
  Object.values(WELCOME_HASHES).includes(hash);

/** Same item, segment in the other language; unknown fragments become empty. */
export function translateHash(hash: string, to: Lang): string {
  if (isWelcomeHash(hash)) return welcomeHash(to);
  const target = parseHash(hash);
  return target ? buildHash(target, to) : '';
}
