// Automatic placement of content items in the room's named slots (data-model.md, rules 1-6).
// Pure: no Three.js, so it is unit tested and shared by the build and the browser.

export type ItemType = 'project' | 'education' | 'experience';

/** One published item as the scene needs it (manifest of the page). */
export interface SceneItem {
  key: string; // `<type>/<id>`
  type: ItemType;
  id: string;
  label: string;
  order: number;
  featured: boolean;
  image: string | null;
  badge: string;
  href: string;
  panelId: string;
}

export interface Slot {
  name: string;
  kind: ItemType | 'featured';
  index: number;
  featuredId?: string;
}

export type PlacementModel =
  | 'generic-project'
  | 'generic-education'
  | 'generic-experience'
  | `featured:${string}`
  | 'overflow';

export interface Placement {
  /** Item key, or `overflow/<type>` for the "more …" box. */
  key: string;
  slot: string;
  model: PlacementModel;
  /** Overflow box only: keys of the items it lists. */
  items?: string[];
}

const SLOT_NAME = /^slot\.(project|education|experience)\.(\d+)$/;
const FEATURED_NAME = /^featured\.([a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** Reads a slot from an empty's name (contracts/scene-model.md); other names give null. */
export function parseSlot(name: string): Slot | null {
  const slot = SLOT_NAME.exec(name);
  if (slot) return { name, kind: slot[1] as ItemType, index: Number(slot[2]) };
  const featured = FEATURED_NAME.exec(name);
  if (featured) return { name, kind: 'featured', index: 0, featuredId: featured[1]! };
  return null;
}

const byOrder = (a: SceneItem, b: SceneItem) => a.order - b.order;

/** Fills the slots of one type in index order; extra items go into an overflow box. */
function fill(type: ItemType, items: SceneItem[], slots: Slot[]): Placement[] {
  const free = slots.filter((s) => s.kind === type).sort((a, b) => a.index - b.index);
  const model = `generic-${type}` as PlacementModel;
  if (items.length <= free.length) {
    return items.map((item, i) => ({ key: item.key, slot: free[i]!.name, model }));
  }
  if (free.length === 0) return [];
  // Rule 3: the last slot becomes the overflow box and its item joins the rest.
  const shown = items.slice(0, free.length - 1);
  const rest = items.slice(free.length - 1);
  return [
    ...shown.map((item, i) => ({ key: item.key, slot: free[i]!.name, model })),
    {
      key: `overflow/${type}`,
      slot: free[free.length - 1]!.name,
      model: 'overflow' as const,
      items: rest.map((item) => item.key),
    },
  ];
}

/**
 * Places every item in a slot. `hasFeaturedModel(id)` tells whether a dedicated model file
 * exists; without one a featured project keeps its reserved slot with the generic model.
 */
export function layout(
  items: SceneItem[],
  slots: Slot[],
  hasFeaturedModel: (id: string) => boolean = () => true,
): Placement[] {
  const featuredSlots = new Map(
    slots.filter((s) => s.kind === 'featured').map((s) => [s.featuredId!, s]),
  );
  const projects = items.filter((i) => i.type === 'project').sort(byOrder);

  // Rule 1: featured projects with a reserved slot.
  const reserved: Placement[] = [];
  const others: SceneItem[] = [];
  for (const project of projects) {
    const slot = project.featured ? featuredSlots.get(project.id) : undefined;
    if (slot) {
      reserved.push({
        key: project.key,
        slot: slot.name,
        model: hasFeaturedModel(project.id) ? `featured:${project.id}` : 'generic-project',
      });
    } else {
      others.push(project);
    }
  }

  return [
    ...reserved,
    // Rules 2 and 3: the other projects in site order.
    ...fill('project', others, slots),
    // Rule 4: education and experience, most recent first (their `order`).
    ...fill('education', items.filter((i) => i.type === 'education').sort(byOrder), slots),
    ...fill('experience', items.filter((i) => i.type === 'experience').sort(byOrder), slots),
  ];
}
