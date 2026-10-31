// Light / dark theme preference (specs/003-visual-design-pass/contracts/theme.md). Pure: the
// browser parts (storage, data-theme, events) live in ThemeToggle.astro.

export type Preference = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

/** Key of the visitor's choice in localStorage; absent means "follow the system". */
export const THEME_KEY = 'theme';

export const effectiveTheme = (pref: Preference, systemDark: boolean): Theme =>
  pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;

const CYCLE: Record<Preference, Preference> = { system: 'light', light: 'dark', dark: 'system' };

/** Button cycle: system -> light -> dark -> system. */
export const nextPreference = (pref: Preference): Preference => CYCLE[pref];

/** Stored value -> preference; anything unknown counts as no choice. */
export const parsePreference = (raw: string | null): Preference =>
  raw === 'light' || raw === 'dark' ? raw : 'system';
