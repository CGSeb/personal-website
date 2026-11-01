// The figure's welcome bubble (contracts/avatar.md): an HTML element of SceneView.astro, held
// above the head, with its state in the fragment so it survives a change of language.
import type { Lang } from '../i18n/routes';
import { isWelcomeHash, welcomeHash } from './hash';
import { syncLanguageSwitcher } from './panels';

export class Bubble {
  private readonly element = document.querySelector<HTMLElement>('[data-avatar-bubble]')!;
  private readonly wrap = document.querySelector<HTMLElement>('.scene-wrap')!;
  private returnFocus: HTMLElement | null = null;

  constructor(
    private readonly lang: Lang,
    private readonly onChange: (open: boolean) => void,
  ) {
    this.element.querySelector('.close')!.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    // As for the panels: the list and the canvas handle their own clicks, and language and theme
    // change around the open bubble.
    document.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          '.scene-bubble, .scene-list, #scene canvas, [data-recenter], .language-switcher, [data-theme-toggle]',
        )
      )
        return;
      this.close();
    });
  }

  get isOpen(): boolean {
    return !this.element.hidden;
  }

  open(from?: HTMLElement | null) {
    if (this.isOpen) return;
    this.returnFocus = from ?? (document.activeElement as HTMLElement | null);
    this.element.hidden = false;
    this.element.focus({ preventScroll: true });
    history.replaceState(null, '', welcomeHash(this.lang));
    syncLanguageSwitcher(this.lang);
    this.onChange(true);
  }

  /** `keepFocus`: a panel that takes over has already moved the focus and set its own fragment. */
  close({ keepFocus = false } = {}) {
    if (!this.isOpen) return;
    this.element.hidden = true;
    if (isWelcomeHash(location.hash)) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    syncLanguageSwitcher(this.lang);
    this.onChange(false);
    if (!keepFocus) this.returnFocus?.focus({ preventScroll: true });
    this.returnFocus = null;
  }

  toggle(from?: HTMLElement | null) {
    if (this.isOpen) this.close();
    else this.open(from);
  }

  /** Follows the head; called after each frame while open. */
  reposition(anchor: { x: number; y: number }) {
    if (!this.isOpen) return;
    const { offsetWidth: width, offsetHeight: height } = this.element;
    const { clientWidth, clientHeight } = this.wrap;
    const { left, top } = bubblePosition(
      anchor,
      { width, height },
      { width: clientWidth, height: clientHeight },
    );
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    // The tail stays on the head when the bubble is held back by an edge, within the round corners.
    const tail = Math.max(16, Math.min(anchor.x - left, width - 16));
    this.element.style.setProperty('--tail-x', `${tail}px`);
  }
}

/** Above the anchor, centred, kept inside the scene. Pure. */
export function bubblePosition(
  anchor: { x: number; y: number },
  bubble: { width: number; height: number },
  scene: { width: number; height: number },
  margin = 8,
): { left: number; top: number } {
  // The upper bound comes second: a bubble too large for the scene stays on its top left margin.
  const clamp = (value: number, max: number) => Math.max(margin, Math.min(value, max));
  return {
    left: clamp(anchor.x - bubble.width / 2, scene.width - bubble.width - margin),
    top: clamp(anchor.y - bubble.height - margin, scene.height - bubble.height - margin),
  };
}
