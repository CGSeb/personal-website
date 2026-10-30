// Builds the 3D scene once the page content is shown: room, placed objects, picking, panels
// anchoring, recenter, view restore and fragment (US1, US2). Imported dynamically by boot.ts.
import * as THREE from 'three';
import type { PageData } from './labels';
import { layout } from './layout';
import { placeObjects, type PlacedObject } from './objects';
import type { Panels } from './panels';
import { attachPicking } from './picking';
import { createStage, HOME_ZOOM, type CameraView } from './renderer';
import { loadRoom } from './room';

const VIEW_KEY = 'scene.camera';

const readView = (): CameraView | null => {
  try {
    const raw = sessionStorage.getItem(VIEW_KEY);
    return raw ? (JSON.parse(raw) as CameraView) : null;
  } catch {
    return null;
  }
};
const saveView = (view: CameraView) => {
  try {
    sessionStorage.setItem(VIEW_KEY, JSON.stringify(view));
  } catch {
    // Private browsing: the view is simply not restored.
  }
};

export interface SceneHandle {
  screenPosition(key: string): { x: number; y: number } | null;
  frames(): number;
}

export async function createScene(data: PageData, panels: Panels): Promise<SceneHandle> {
  const container = document.getElementById('scene')!;
  const wrap = container.parentElement!;
  const tooltip = wrap.querySelector<HTMLElement>('.scene-tooltip')!;
  const recenter = wrap.querySelector<HTMLButtonElement>('[data-recenter]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const room = await loadRoom(data.models);
  const stage = createStage(container, {
    home: room.home,
    bounds: room.bounds,
    reducedMotion,
    pixelRatio: coarse ? 1.5 : 2,
  });
  stage.scene.add(room.group);

  const placements = layout(data.items, room.slots, (id) =>
    data.models.includes(`featured/${id}.glb`),
  );
  const objects = await placeObjects(
    placements,
    room.slots,
    data.items,
    stage.requestRender,
    data.models,
  );
  const byKey = new Map<string, PlacedObject>();
  for (const object of objects) {
    stage.scene.add(object.root, object.hit);
    byKey.set(object.key, object);
  }
  // Items inside an overflow box are reached through that box.
  const container_ = new Map<string, string>();
  for (const p of placements) {
    if (p.items) {
      panels.setOverflow(p.key, p.items);
      for (const key of p.items) container_.set(key, p.key);
    }
  }
  const objectFor = (key: string) => byKey.get(key) ?? byKey.get(container_.get(key) ?? '');

  const screenPosition = (key: string) => {
    const object = objectFor(key);
    if (!object) return null;
    return stage.toScreen(object.hit.getWorldPosition(new THREE.Vector3()));
  };
  const isVisible = (p: { x: number; y: number }) =>
    p.x > 24 && p.y > 24 && p.x < container.clientWidth - 24 && p.y < container.clientHeight - 24;

  // States: one selected (open panel), one highlighted (hover).
  let hovered: string | null = null;
  const refreshStates = () => {
    const selected = panels.current ? objectFor(panels.current)?.key : null;
    for (const o of objects)
      o.setState(o.key === selected ? 'selected' : o.key === hovered ? 'highlighted' : 'idle');
    stage.requestRender();
  };

  attachPicking(stage.renderer.domElement, stage.camera, objects, {
    onHover(key, at) {
      if (key !== hovered) {
        hovered = key;
        refreshStates();
      }
      const label = key
        ? (panels.item(key)?.label ?? data.labels.overflow[key.split('/')[1] as 'project'])
        : '';
      tooltip.hidden = !key;
      if (key) {
        tooltip.textContent = label;
        tooltip.style.left = `${at.x}px`;
        tooltip.style.top = `${at.y}px`;
      }
    },
    onSelect(key) {
      if (key) panels.open(key, screenPosition(key), stage.renderer.domElement);
      else panels.close();
    },
  });

  // Bring an item into view when it is opened from the list or the fragment.
  panels.events.onChange = (key) => {
    tooltip.hidden = true;
    refreshStates();
    if (!key) return;
    const object = objectFor(key);
    const at = screenPosition(key);
    if (object && at && !isVisible(at)) {
      stage.moveTo(object.hit.getWorldPosition(new THREE.Vector3()));
    }
  };
  stage.onRender(() => {
    if (panels.current) panels.reposition(screenPosition(panels.current));
  });

  // US2: restore the view after a visit to the written site, and keep it up to date.
  const saved = readView();
  if (saved) stage.setView(saved);
  let saveTimer = 0;
  stage.controls.addEventListener('change', () => {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveView(stage.view()), 300);
  });

  recenter.hidden = false;
  recenter.addEventListener('click', () => stage.moveTo(room.home, HOME_ZOOM));

  container.querySelector('.scene-status')?.remove();
  container.setAttribute('aria-busy', 'false');
  container.setAttribute('role', 'application');
  container.setAttribute('aria-label', data.labels.canvas);
  stage.requestRender();

  panels.openFromHash(screenPosition);
  return { screenPosition, frames: stage.frames };
}
