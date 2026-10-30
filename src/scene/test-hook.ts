// Test hook (contracts/scene-page.md): only in development, or when Playwright sets
// `data-scene-test` on <html> before the page loads. Never active on the published site.

export interface SceneTestHook {
  ready: Promise<void>;
  screenPosition(key: string): { x: number; y: number } | null;
  quality(): 'high' | 'medium' | 'low';
  frames(): number;
}

declare global {
  interface Window {
    __scene?: SceneTestHook;
  }
}

export const testHookEnabled = () =>
  import.meta.env.DEV || document.documentElement.dataset.sceneTest !== undefined;

export function installTestHook(hook: SceneTestHook) {
  if (testHookEnabled()) window.__scene = hook;
}
