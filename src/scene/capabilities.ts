// Which path the scene page takes (US4): the 3D, a choice screen first, or the fallback.
// `decide()` is pure and unit tested; `detect()` reads the browser.

export type ScenePath = '3d' | 'choice' | 'fallback';
export type StoredChoice = '3d' | 'written' | null;

export interface Capabilities {
  webgl: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Choice made earlier in the session on the choice screen. */
  stored: StoredChoice;
}

export function decide(c: Capabilities): ScenePath {
  if (!c.webgl) return 'fallback';
  if (c.stored === '3d') return '3d';
  // Reduced motion or data saving: ask first (FR-023). A visitor who chose the written
  // version and comes back to the scene is asked again.
  if (c.reducedMotion || c.saveData || c.stored === 'written') return 'choice';
  return '3d';
}

const CHOICE_KEY = 'scene.choice';

export function storeChoice(choice: Exclude<StoredChoice, null>) {
  try {
    sessionStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // Private browsing: the question is simply asked again.
  }
}

function storedChoice(): StoredChoice {
  try {
    const value = sessionStorage.getItem(CHOICE_KEY);
    return value === '3d' || value === 'written' ? value : null;
  } catch {
    return null;
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function detect(): Capabilities {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return {
    webgl: webglAvailable(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: connection?.saveData === true,
    stored: storedChoice(),
  };
}
