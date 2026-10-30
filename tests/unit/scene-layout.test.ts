import { describe, expect, it } from 'vitest';
import {
  layout,
  parseSlot,
  type ItemType,
  type SceneItem,
  type Slot,
} from '../../src/scene/layout';

const item = (type: ItemType, id: string, order: number, featured = false): SceneItem => ({
  key: `${type}/${id}`,
  type,
  id,
  label: id,
  order,
  featured,
  image: null,
  badge: '',
  href: `/fr/${id}/`,
  panelId: `panel-${type}-${id}`,
});

const slots = (names: string[]): Slot[] => names.map((n) => parseSlot(n)!);
const room = slots([
  'slot.project.02',
  'slot.project.01',
  'slot.project.03',
  'slot.education.01',
  'slot.education.02',
  'slot.experience.01',
  'featured.star',
]);

describe('parseSlot', () => {
  it('reads slot and featured names, ignores the rest', () => {
    expect(parseSlot('slot.project.07')).toEqual({
      name: 'slot.project.07',
      kind: 'project',
      index: 7,
    });
    expect(parseSlot('featured.lesson-folk')).toMatchObject({
      kind: 'featured',
      featuredId: 'lesson-folk',
    });
    expect(parseSlot('camera.home')).toBeNull();
    expect(parseSlot('slot.unknown.01')).toBeNull();
  });
});

describe('layout', () => {
  it('puts a featured project in its reserved slot with its dedicated model (rule 1)', () => {
    const result = layout([item('project', 'star', 5, true)], room);
    expect(result).toEqual([
      { key: 'project/star', slot: 'featured.star', model: 'featured:star' },
    ]);
  });

  it('keeps the reserved slot with a generic model when the dedicated file is missing (rule 1)', () => {
    const result = layout([item('project', 'star', 0, true)], room, () => false);
    expect(result[0]).toMatchObject({ slot: 'featured.star', model: 'generic-project' });
  });

  it('fills project slots by ascending index in site order (rule 2)', () => {
    const result = layout([item('project', 'b', 1), item('project', 'a', 0)], room);
    expect(result.map((p) => [p.key, p.slot])).toEqual([
      ['project/a', 'slot.project.01'],
      ['project/b', 'slot.project.02'],
    ]);
  });

  it('turns the last slot into an overflow box when items outnumber slots (rule 3)', () => {
    const projects = ['a', 'b', 'c', 'd', 'e'].map((id, i) => item('project', id, i));
    const result = layout(projects, room);
    expect(result).toEqual([
      { key: 'project/a', slot: 'slot.project.01', model: 'generic-project' },
      { key: 'project/b', slot: 'slot.project.02', model: 'generic-project' },
      {
        key: 'overflow/project',
        slot: 'slot.project.03',
        model: 'overflow',
        items: ['project/c', 'project/d', 'project/e'],
      },
    ]);
  });

  it('places education and experience in order, with the same overflow rule (rule 4)', () => {
    const result = layout(
      [
        item('education', 'old', 2),
        item('education', 'new', 0),
        item('education', 'mid', 1),
        item('experience', 'job', 0),
      ],
      room,
    );
    expect(result).toEqual([
      { key: 'education/new', slot: 'slot.education.01', model: 'generic-education' },
      {
        key: 'overflow/education',
        slot: 'slot.education.02',
        model: 'overflow',
        items: ['education/mid', 'education/old'],
      },
      { key: 'experience/job', slot: 'slot.experience.01', model: 'generic-experience' },
    ]);
  });

  it('leaves unused slots empty and handles no items (rule 5)', () => {
    expect(layout([], room)).toEqual([]);
    expect(layout([item('project', 'a', 0)], room)).toHaveLength(1);
  });

  it('is deterministic (rule 6)', () => {
    const items = ['a', 'b', 'c', 'd'].map((id, i) => item('project', id, i));
    expect(layout(items, room)).toEqual(layout([...items].reverse(), [...room].reverse()));
  });
});
