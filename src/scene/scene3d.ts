// Builds the 3D scene once the page content is shown: room, placed objects, picking, panels
// anchoring, recenter, view restore and fragment (US1, US2), day / night with the theme
// (spec 003). Imported dynamically by boot.ts.
import * as THREE from 'three';
import { ambianceFor, blend, settingsFor, type Ambiance, type AmbianceSettings } from './ambiance';
import type { PageData } from './labels';
import { layout } from './layout';
import { placeObjects, type PlacedObject } from './objects';
import type { Panels } from './panels';
import { createLighting } from './lighting';
import { experienceString } from './timeline';
import { attachPicking } from './picking';
import { createStage, HOME_ZOOM, type CameraView } from './renderer';
import { QUALITY, QualityGovernor, type QualityLevel } from './quality';
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
  quality(): QualityLevel;
  /** Item whose object is highlighted (hover or list focus). */
  highlighted(): string | null;
  ambiance(): Ambiance;
  /** True while the day / night fade runs. */
  fading(): boolean;
  /** Names of the room's named nodes (slots, markers, baked mesh). */
  roomNodes(): string[];
}

export interface SceneOptions {
  /** Called once when the scene stays too slow at the lowest quality. */
  onSlow(): void;
}

/** Effective theme of the page: the visitor's choice (ThemeScript.astro), else the system. */
const pageTheme = (): 'light' | 'dark' => {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** `--duration-theme` in ms (`0s` under reduced motion). */
const themeDuration = (): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--duration-theme');
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.trim().endsWith('ms') ? value : value * 1000;
};

const QUALITY_KEY = 'scene.quality';
const readQuality = (): QualityLevel | null => {
  try {
    const value = sessionStorage.getItem(QUALITY_KEY);
    return value && value in QUALITY ? (value as QualityLevel) : null;
  } catch {
    return null;
  }
};

export async function createScene(
  data: PageData,
  panels: Panels,
  options: SceneOptions,
): Promise<SceneHandle> {
  const container = document.getElementById('scene')!;
  const wrap = container.parentElement!;
  const tooltip = wrap.querySelector<HTMLElement>('.scene-tooltip')!;
  const recenter = wrap.querySelector<HTMLButtonElement>('[data-recenter]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  // Adaptive quality (FR-022): start lower on touch screens, never above a level kept earlier
  // in the session, and step down while the scene stays too slow.
  const initialQuality: QualityLevel = readQuality() ?? (coarse ? 'medium' : 'high');
  const governor = new QualityGovernor({ level: initialQuality, minFps: coarse ? 30 : 50 });

  const room = await loadRoom(data.models);
  const stage = createStage(container, {
    home: room.home,
    bounds: room.bounds,
    reducedMotion,
    pixelRatio: QUALITY[initialQuality].pixelRatio,
  });
  stage.scene.add(room.group);

  // Day / night (FR-016, FR-022): follows the theme, fades unless motion is reduced; view,
  // panel and quality are untouched.
  const lighting = createLighting(stage.scene, room);
  let ambiance: Ambiance = ambianceFor(pageTheme());
  let shown: AmbianceSettings = settingsFor(ambiance, initialQuality);
  lighting.apply(shown);
  let fade = 0;
  const switchTo = (next: Ambiance, level: QualityLevel) => {
    ambiance = next;
    cancelAnimationFrame(fade);
    const from = shown;
    const to = settingsFor(next, level);
    const duration = reducedMotion ? 0 : themeDuration();
    const start = performance.now();
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      shown = blend(from, to, t);
      lighting.apply(shown);
      stage.requestRender();
      fade = t < 1 ? requestAnimationFrame(step) : 0;
    };
    if (duration > 0) fade = requestAnimationFrame(step);
    else step(start);
  };
  document.addEventListener('themechange', (event) => {
    stage.refreshBackground();
    const theme = (event as CustomEvent<{ theme: 'light' | 'dark' }>).detail.theme;
    switchTo(ambianceFor(theme), governor.level);
  });

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
    lighting.adopt(object.root);
    byKey.set(object.key, object);
  }
  // Experience cards joined by a red string, oldest to newest (spec 003).
  const timeline = experienceString(
    data.items
      .filter((i) => i.type === 'experience')
      .sort((a, b) => b.order - a.order)
      .flatMap((i) => byKey.get(i.key)?.root ?? []),
  );
  if (timeline) stage.scene.add(timeline);
  lighting.apply(shown);
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

  const bringIntoView = (key: string) => {
    const object = objectFor(key);
    const at = screenPosition(key);
    if (object && at && !isVisible(at)) {
      stage.moveTo(object.hit.getWorldPosition(new THREE.Vector3()));
    }
  };
  // Bring an item into view when it is opened from the list or the fragment.
  panels.events.onChange = (key) => {
    tooltip.hidden = true;
    refreshStates();
    if (key) bringIntoView(key);
  };
  // US5: focusing or hovering a list entry highlights its object (or its overflow box).
  panels.events.onPreview = (key) => {
    hovered = key ? (objectFor(key)?.key ?? null) : null;
    refreshStates();
    if (key) bringIntoView(key);
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
  stage.onRender((requestedAt) => {
    const action = governor.frame(performance.now(), requestedAt);
    if (action.type === 'down') {
      stage.setPixelRatio(QUALITY[action.level].pixelRatio);
      shown = settingsFor(ambiance, action.level);
      lighting.apply(shown);
      try {
        sessionStorage.setItem(QUALITY_KEY, action.level);
      } catch {
        // Private browsing: the level is measured again next time.
      }
    } else if (action.type === 'propose-written') {
      options.onSlow();
    }
  });

  return {
    screenPosition,
    frames: stage.frames,
    quality: () => governor.level,
    highlighted: () => hovered,
    ambiance: () => ambiance,
    fading: () => fade !== 0,
    roomNodes: () => {
      const names: string[] = [];
      // three.js strips the dots from glTF names; the original stays in userData.
      room.group.traverse((object) => {
        const name = (object.userData.name as string | undefined) ?? object.name;
        if (name) names.push(name);
      });
      return names;
    },
  };
}
