// Test hook (contracts/scene-page.md): only in development, or when Playwright sets
// `window.__sceneTest` before the page loads. Never active on the published site.

export interface SceneTestHook {
  ready: Promise<void>;
  screenPosition(key: string): { x: number; y: number } | null;
  quality(): 'high' | 'medium' | 'low';
  frames(): number;
  highlighted(): string | null;
  ambiance(): 'day' | 'night';
}

declare global {
  interface Window {
    __scene?: SceneTestHook;
    __sceneTest?: boolean;
  }
}

export const testHookEnabled = () => import.meta.env.DEV || window.__sceneTest === true;

export function installTestHook(hook: SceneTestHook) {
  if (testHookEnabled()) window.__scene = hook;
}
