// Groups career entries by organization, so several roles in the same company (a promotion,
// a return) read as one block. Input must already be sorted by start date, most recent first.
import type { PeriodT } from '../content/schemas';

export interface CareerGroup<T> {
  organization: string;
  /** Roles of the group, most recent first. */
  items: T[];
  /** From the earliest start to the latest end; open-ended when a role is ongoing. */
  period: PeriodT;
}

export function groupByOrganization<T extends { organization: string; period: PeriodT }>(
  items: T[],
): CareerGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.organization);
    if (list) list.push(item);
    else groups.set(item.organization, [item]);
  }
  return [...groups].map(([organization, roles]) => {
    const start = roles.reduce(
      (min, r) => (r.period.start < min ? r.period.start : min),
      '9999-12',
    );
    const ongoing = roles.some((r) => !r.period.end);
    const end = ongoing
      ? undefined
      : roles.reduce((max, r) => (r.period.end! > max ? r.period.end! : max), '0000-01');
    return { organization, items: roles, period: end ? { start, end } : { start } };
  });
}

/** Whole years between a `YYYY-MM` start and now. */
export function yearsSince(start: string, now: Date = new Date()): number {
  const [year, month] = start.split('-').map(Number) as [number, number];
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, Math.floor(months / 12));
}

/** First paragraph of a Markdown body as plain text (emphasis and links removed). */
export function firstParagraph(markdown: string): string {
  const block = markdown.trim().split(/\r?\n\s*\r?\n/)[0] ?? '';
  return block
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
