// Entry of the scene page: panels and list work at once; then, depending on the browser, the
// 3D is imported, a choice screen is shown first, or a fallback message (US4,
// contracts/scene-page.md). Loaded by SceneView.astro.
import { decide, detect, storeChoice } from './capabilities';
import { readPageData, type PageData } from './labels';
import { Panels } from './panels';
import type { QualityLevel } from './quality';
import type { SceneHandle } from './scene3d';
import { installTestHook } from './test-hook';

interface Action {
  label: string;
  onClick?: () => void;
  href?: string;
}

/** Replaces the scene area by a message and its actions; the written version is always offered. */
function showMessage(data: PageData, text: string, actions: Action[] = [], title?: string) {
  const container = document.getElementById('scene')!;
  container.setAttribute('aria-busy', 'false');
  const box = document.createElement('div');
  box.className = 'scene-status';
  box.setAttribute('role', 'status');
  const inner = document.createElement('div');
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    inner.append(heading);
  }
  const message = document.createElement('p');
  message.textContent = text;
  const buttons = document.createElement('p');
  buttons.className = 'scene-actions';
  for (const action of [
    ...actions,
    { label: data.labels.written, href: data.labels.writtenHref },
  ]) {
    const element = action.href ? document.createElement('a') : document.createElement('button');
    element.textContent = action.label;
    if (element instanceof HTMLAnchorElement) element.href = action.href!;
    else element.type = 'button';
    if (action.onClick) element.addEventListener('click', action.onClick);
    buttons.append(element);
  }
  inner.append(message, buttons);
  box.append(inner);
  container.replaceChildren(box);
  return box;
}

/** A dismissible notice over the running scene (too slow). */
function showNotice(data: PageData) {
  const wrap = document.querySelector<HTMLElement>('.scene-wrap')!;
  const notice = document.createElement('div');
  notice.className = 'scene-notice';
  notice.setAttribute('role', 'status');
  const text = document.createElement('p');
  text.textContent = data.labels.slow;
  const link = document.createElement('a');
  link.href = data.labels.writtenHref;
  link.textContent = data.labels.written;
  const stay = document.createElement('button');
  stay.type = 'button';
  stay.textContent = data.labels.stay;
  stay.addEventListener('click', () => notice.remove());
  const actions = document.createElement('p');
  actions.className = 'scene-actions';
  actions.append(link, stay);
  notice.append(text, actions);
  wrap.append(notice);
}

export async function start() {
  const data = readPageData();
  const panels = new Panels(data.lang, data.items, data.labels);

  // Rejected when the scene falls back, so tests fail at once with the reason instead of
  // waiting for a time-out.
  let resolveReady!: () => void;
  let rejectReady!: (reason: Error) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  ready.catch(() => {}); // nobody may be listening outside tests
  let handle: SceneHandle | null = null;
  installTestHook({
    ready,
    screenPosition: (key) => handle?.screenPosition(key) ?? null,
    quality: (): QualityLevel => handle?.quality() ?? 'high',
    frames: () => handle?.frames() ?? 0,
    highlighted: () => handle?.highlighted() ?? null,
    ambiance: () => handle?.ambiance() ?? 'day',
  });

  const load = async () => {
    const container = document.getElementById('scene')!;
    container.setAttribute('aria-busy', 'true');
    try {
      const { createScene } = await import('./scene3d');
      handle = await createScene(data, panels, { onSlow: () => showNotice(data) });
      resolveReady();
    } catch (error) {
      console.error(error);
      showMessage(data, data.labels.fallbackError, [
        { label: data.labels.retry, onClick: () => void load() },
      ]);
      panels.openFromHash();
      rejectReady(new Error(`scene failed to load: ${String(error)}`));
    }
  };

  switch (decide(detect())) {
    case 'fallback':
      showMessage(data, data.labels.fallbackWebgl);
      panels.openFromHash();
      rejectReady(new Error('scene fallback: WebGL is not available'));
      return;
    case 'choice':
      panels.openFromHash();
      showMessage(
        data,
        data.labels.choiceText,
        [
          {
            label: data.labels.choiceContinue,
            onClick: () => {
              storeChoice('3d');
              void load();
            },
          },
        ],
        data.labels.choiceTitle,
      );
      // "Written version" remembers the choice before leaving.
      document
        .querySelector<HTMLAnchorElement>('.scene-status .scene-actions a')
        ?.addEventListener('click', () => storeChoice('written'));
      return;
    case '3d':
      await load();
  }
}
