// Page data handed to the client code by SceneView.astro (manifest and interface labels).
import type { Lang } from '../content/schemas';
import type { ItemType, SceneItem } from './layout';

export interface SceneLabels {
  canvas: string;
  opened: string;
  loading: string;
  fallbackWebgl: string;
  fallbackError: string;
  retry: string;
  slow: string;
  stay: string;
  choiceTitle: string;
  choiceText: string;
  choiceContinue: string;
  written: string;
  writtenHref: string;
  overflow: Record<ItemType, string>;
}

export interface PageData {
  lang: Lang;
  items: SceneItem[];
  labels: SceneLabels;
  /** Model files present in public/models/ (e.g. `room.glb`, `featured/<id>.glb`). */
  models: string[];
}

const json = <T>(id: string): T => JSON.parse(document.getElementById(id)!.textContent!) as T;

export function readPageData(): PageData {
  const page = document.querySelector<HTMLElement>('.scene-page')!;
  const lang = (page.dataset.lang ?? 'fr') as Lang;
  return {
    lang,
    items: json('scene-manifest'),
    labels: json('scene-labels'),
    models: json('scene-models'),
  };
}
