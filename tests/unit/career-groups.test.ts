import { describe, expect, it } from 'vitest';
import { firstParagraph, groupByOrganization, yearsSince } from '../../src/lib/career-groups';

const job = (organization: string, start: string, end?: string) => ({
  organization,
  period: end ? { start, end } : { start },
});

describe('groupByOrganization', () => {
  it('stacks roles of the same organization, ordered by their latest role', () => {
    const groups = groupByOrganization([
      job('A', '2026-07'),
      job('B', '2025-02', '2026-06'),
      job('A', '2021-01', '2024-05'),
    ]);
    expect(groups.map((g) => g.organization)).toEqual(['A', 'B']);
    expect(groups[0]!.items).toHaveLength(2);
  });

  it('spans from the earliest start, and stays open while a role is ongoing', () => {
    const [group] = groupByOrganization([job('A', '2026-07'), job('A', '2021-01', '2024-05')]);
    expect(group!.period).toEqual({ start: '2021-01' });
  });

  it('ends at the latest end when every role is over', () => {
    const [group] = groupByOrganization([
      job('A', '2022-01', '2023-01'),
      job('A', '2019-01', '2020-06'),
    ]);
    expect(group!.period).toEqual({ start: '2019-01', end: '2023-01' });
  });
});

describe('yearsSince', () => {
  it('counts whole years', () => {
    expect(yearsSince('2017-09', new Date(2026, 10, 1))).toBe(9);
    expect(yearsSince('2017-09', new Date(2026, 7, 1))).toBe(8);
  });
});

describe('firstParagraph', () => {
  it('keeps the first paragraph as plain text', () => {
    const md = 'Un **texte** avec [lien](https://x.fr)\nsur deux lignes.\n\n- puce';
    expect(firstParagraph(md)).toBe('Un texte avec lien sur deux lignes.');
  });
});
