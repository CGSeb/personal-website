// Entry of the scene page: panels and list work at once; the 3D is imported afterwards, or a
// fallback message is shown (contracts/scene-page.md). Loaded by SceneView.astro.
import { readPageData, type PageData } from './labels';
import { Panels } from './panels';
import { installTestHook } from './test-hook';

const webglAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Replaces the loading status by a message with a link to the written version. */
function showMessage(data: PageData, text: string, retry?: () => void) {
  const container = document.getElementById('scene')!;
  container.setAttribute('aria-busy', 'false');
  const box = document.createElement('div');
  box.className = 'scene-status';
  box.setAttribute('role', 'status');
  const message = document.createElement('p');
  message.textContent = text;
  const actions = document.createElement('p');
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-retry';
    button.textContent = data.labels.retry;
    button.addEventListener('click', () => {
      box.remove();
      retry();
    });
    actions.append(button, ' ');
  }
  const link = document.createElement('a');
  link.href = data.labels.writtenHref;
  link.textContent = data.labels.written;
  actions.append(link);
  box.append(message, actions);
  container.replaceChildren(box);
}

export async function start() {
  const data = readPageData();
  const panels = new Panels(data.lang, data.items, data.labels);

  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));
  let handle: {
    screenPosition(key: string): { x: number; y: number } | null;
    frames(): number;
  } | null = null;
  installTestHook({
    ready,
    screenPosition: (key) => handle?.screenPosition(key) ?? null,
    quality: () => 'high',
    frames: () => handle?.frames() ?? 0,
  });

  if (!webglAvailable()) {
    showMessage(data, data.labels.fallbackWebgl);
    panels.openFromHash();
    return;
  }

  const load = async () => {
    try {
      const { createScene } = await import('./scene3d');
      handle = await createScene(data, panels);
      resolveReady();
    } catch (error) {
      console.error(error);
      showMessage(data, data.labels.fallbackError, () => void load());
      panels.openFromHash();
    }
  };
  await load();
}
