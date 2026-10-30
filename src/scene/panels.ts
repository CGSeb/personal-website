// In-scene panels (FR-008, FR-013): shows the HTML article of an item, keeps the fragment, the
// list and the language switcher in sync, and manages focus. Works with or without the 3D.
import { otherLang, type Lang } from '../i18n/routes';
import { buildHash, parseHash, translateHash } from './hash';
import type { ItemType, SceneItem } from './layout';
import type { SceneLabels } from './labels';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface PanelEvents {
  /** The open item changed (null when closed). */
  onChange?: (key: string | null) => void;
  /** A list entry is focused or hovered (null when it no longer is): highlight its object. */
  onPreview?: (key: string | null) => void;
}

export class Panels {
  private openKey: string | null = null;
  private returnFocus: HTMLElement | null = null;
  private readonly wrap = document.querySelector<HTMLElement>('.scene-wrap')!;
  private readonly announce = document.querySelector<HTMLElement>('[data-announce]')!;
  private readonly overflowPanel = document.getElementById('panel-overflow')!;
  private overflowItems = new Map<string, string[]>();
  events: PanelEvents = {};

  constructor(
    private readonly lang: Lang,
    private readonly items: SceneItem[],
    private readonly labels: SceneLabels,
  ) {
    this.enhanceList();
    this.wrap.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-close]')) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openKey) this.close();
    });
    // Click outside an open panel (and outside the list and the canvas, which handle their own) closes it.
    // Not the language switcher: closing would drop the open item from its link before it is followed.
    document.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement;
      if (
        !this.openKey ||
        target.closest(
          '.scene-panel, .scene-list, #scene canvas, [data-recenter], .language-switcher',
        )
      )
        return;
      this.close();
    });
    window.addEventListener('hashchange', () => this.openFromHash());
    this.enableSwipeToClose();
  }

  /** Bottom sheet on phones: a downward swipe from the top of its content closes it (US3). */
  private enableSwipeToClose() {
    let start: { y: number; panel: HTMLElement } | null = null;
    this.wrap.addEventListener(
      'touchstart',
      (e) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>('.scene-panel');
        start = panel && panel.scrollTop === 0 ? { y: e.touches[0]!.clientY, panel } : null;
      },
      { passive: true },
    );
    this.wrap.addEventListener('touchend', (e) => {
      if (start && e.changedTouches[0]!.clientY - start.y > 80) this.close();
      start = null;
    });
  }

  get current(): string | null {
    return this.openKey;
  }

  item(key: string): SceneItem | undefined {
    return this.items.find((i) => i.key === key);
  }

  /** Overflow boxes: which items each one lists. */
  setOverflow(key: string, items: string[]) {
    this.overflowItems.set(key, items);
  }

  /** Turns the list links into buttons that open panels (the href stays as data). */
  private enhanceList() {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('.scene-list a[data-key]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.key = link.dataset.key!;
      button.textContent = link.textContent;
      button.addEventListener('click', () => this.open(button.dataset.key!, null, button));
      // US5: the keyboard and the mouse on the list show where the item is in the scene.
      const preview = () => this.events.onPreview?.(button.dataset.key!);
      const leave = () => this.events.onPreview?.(null);
      button.addEventListener('focus', preview);
      button.addEventListener('mouseenter', preview);
      button.addEventListener('blur', leave);
      button.addEventListener('mouseleave', leave);
      link.replaceWith(button);
    }
  }

  listButton(key: string): HTMLButtonElement | null {
    return document.querySelector<HTMLButtonElement>(`.scene-list button[data-key="${key}"]`);
  }

  open(key: string, anchor: ScreenPoint | null, from?: HTMLElement | null) {
    const panel = this.panelFor(key);
    if (!panel) return;
    this.hideAll();
    this.openKey = key;
    this.returnFocus = from ?? (document.activeElement as HTMLElement | null);
    panel.hidden = false;
    this.place(panel, anchor);
    panel.setAttribute('role', 'dialog');
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });

    if (!key.startsWith('overflow/')) {
      const [type, id] = key.split('/') as [ItemType, string];
      history.replaceState(null, '', buildHash({ type, id }, this.lang));
      this.announce.textContent = this.labels.opened.replace(
        '{label}',
        this.item(key)?.label ?? '',
      );
    }
    for (const b of document.querySelectorAll('.scene-list button[aria-current]'))
      b.removeAttribute('aria-current');
    this.listButton(key)?.setAttribute('aria-current', 'true');
    this.syncLanguageSwitcher();
    this.events.onChange?.(key);
  }

  close() {
    if (!this.openKey) return;
    this.hideAll();
    this.openKey = null;
    history.replaceState(null, '', location.pathname + location.search);
    for (const b of document.querySelectorAll('.scene-list button[aria-current]'))
      b.removeAttribute('aria-current');
    this.syncLanguageSwitcher();
    this.events.onChange?.(null);
    this.returnFocus?.focus({ preventScroll: true });
    this.returnFocus = null;
  }

  /** Opens the item named by the fragment, if any. Returns its key. */
  openFromHash(anchor: (key: string) => ScreenPoint | null = () => null): string | null {
    const target = parseHash(location.hash);
    if (!target) return null;
    const key = `${target.type}/${target.id}`;
    if (!this.item(key)) return null;
    if (this.openKey !== key) this.open(key, anchor(key));
    return key;
  }

  /** Moves an open panel next to its object again (camera moved, window resized). */
  reposition(anchor: ScreenPoint | null) {
    if (!this.openKey) return;
    const panel = this.panelFor(this.openKey);
    if (panel) this.place(panel, anchor);
  }

  private panelFor(key: string): HTMLElement | null {
    if (key.startsWith('overflow/')) return this.fillOverflow(key);
    const item = this.item(key);
    return item ? document.getElementById(item.panelId) : null;
  }

  private fillOverflow(key: string): HTMLElement {
    const type = key.split('/')[1] as ItemType;
    this.overflowPanel.querySelector('h2')!.textContent = this.labels.overflow[type];
    const list = this.overflowPanel.querySelector('ul')!;
    list.replaceChildren(
      ...(this.overflowItems.get(key) ?? []).map((itemKey) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = this.item(itemKey)?.label ?? itemKey;
        button.addEventListener('click', () => this.open(itemKey, null, this.returnFocus));
        li.append(button);
        return li;
      }),
    );
    return this.overflowPanel;
  }

  private hideAll() {
    for (const panel of this.wrap.querySelectorAll<HTMLElement>('.scene-panel'))
      panel.hidden = true;
  }

  /** Next to the anchor on wide screens (CSS turns it into a bottom sheet on phones). */
  private place(panel: HTMLElement, anchor: ScreenPoint | null) {
    const box = this.wrap.getBoundingClientRect();
    const margin = 12;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    let left = margin;
    let top = margin;
    if (anchor) {
      left = anchor.x + 24;
      if (left + width > box.width - margin) left = anchor.x - 24 - width;
      top = anchor.y - height / 2;
    }
    panel.style.left = `${Math.max(margin, Math.min(left, box.width - width - margin))}px`;
    panel.style.top = `${Math.max(margin, Math.min(top, box.height - height - margin))}px`;
  }

  /** The header switcher keeps the open item in the other language (FR-018). */
  private syncLanguageSwitcher() {
    const link = document.querySelector<HTMLAnchorElement>('.language-switcher');
    if (!link) return;
    const base = link.getAttribute('href')!.split('#')[0];
    link.setAttribute('href', base + translateHash(location.hash, otherLang(this.lang)));
  }
}
