// User Story 4 of spec 003 — the theme button (contracts/theme.md): follows the system until the
// visitor chooses, remembers the choice across pages, languages and pages of the same browser,
// paints the stored theme from the first frame, survives blocked storage, sets no cookie.
import { expect, test, type Page } from '@playwright/test';

const LABELS = {
  fr: {
    system: 'Thème : système. Passer au thème clair',
    light: 'Thème : clair. Passer au thème sombre',
    dark: 'Thème : sombre. Revenir au réglage du système',
  },
  en: {
    system: 'Theme: system. Switch to light theme',
    light: 'Theme: light. Switch to dark theme',
    dark: 'Theme: dark. Go back to the system setting',
  },
};

const toggle = (page: Page) => page.locator('.site-header [data-theme-toggle]');

const state = (page: Page) =>
  page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme ?? null,
    stored: localStorage.getItem('theme'),
    scheme: getComputedStyle(document.documentElement).colorScheme,
    bg: getComputedStyle(document.body).backgroundColor,
  }));

// Background of the given theme with no stored choice, read from the system setting.
const systemBg = async (page: Page, colorScheme: 'light' | 'dark') => {
  await page.emulateMedia({ colorScheme });
  await page.goto('/en/');
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
};

test.describe('with JavaScript', () => {
  test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'the button needs JavaScript');

  test('without a choice, the page follows the system, also when it changes', async ({ page }) => {
    const dark = await systemBg(page, 'dark');
    const light = await systemBg(page, 'light');
    expect(dark).not.toBe(light);

    await expect(toggle(page)).toHaveAttribute('data-state', 'system');
    expect(await state(page)).toMatchObject({
      dataTheme: null,
      stored: null,
      scheme: 'light',
      bg: light,
    });

    const events = page.evaluate(
      () =>
        new Promise<string>((resolve) =>
          document.addEventListener(
            'themechange',
            (e) => resolve((e as CustomEvent).detail.theme),
            {
              once: true,
            },
          ),
        ),
    );
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await events).toBe('dark');
    expect(await state(page)).toMatchObject({ dataTheme: null, scheme: 'dark', bg: dark });
  });

  test('a click goes system → light → dark → system', { tag: '@narrow' }, async ({ page }) => {
    const dark = await systemBg(page, 'dark');
    const light = await systemBg(page, 'light');
    // A dark system, so that each step paints something different from the one before.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/en/');
    const button = toggle(page);

    await expect(button).toHaveAccessibleName(LABELS.en.system);
    await button.click();
    await expect(button).toHaveAccessibleName(LABELS.en.light);
    expect(await state(page)).toMatchObject({
      dataTheme: 'light',
      stored: 'light',
      scheme: 'light',
      bg: light,
    });

    await button.click();
    await expect(button).toHaveAccessibleName(LABELS.en.dark);
    expect(await state(page)).toMatchObject({
      dataTheme: 'dark',
      stored: 'dark',
      scheme: 'dark',
      bg: dark,
    });

    await button.click();
    await expect(button).toHaveAccessibleName(LABELS.en.system);
    expect(await state(page)).toMatchObject({
      dataTheme: null,
      stored: null,
      scheme: 'dark',
      bg: dark,
    });
  });

  test('the choice holds across pages, languages and a new page', async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/fr/');
    await expect(toggle(page)).toHaveAccessibleName(LABELS.fr.system);
    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName(LABELS.fr.light);

    await page.goto('/fr/projets/');
    await expect(toggle(page)).toHaveAccessibleName(LABELS.fr.light);
    expect((await state(page)).scheme).toBe('light');

    await page.locator('.site-header .language-switcher').click();
    await expect(page).toHaveURL(/\/en\/projects\/$/);
    await expect(toggle(page)).toHaveAccessibleName(LABELS.en.light);
    expect((await state(page)).scheme).toBe('light');

    const other = await context.newPage();
    await other.emulateMedia({ colorScheme: 'dark' });
    await other.goto('/en/career/');
    await expect(toggle(other)).toHaveAccessibleName(LABELS.en.light);
    expect((await state(other)).scheme).toBe('light');
  });

  test('no flash: the stored theme is painted from the first frame', async ({ page }) => {
    const dark = await systemBg(page, 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      // The stylesheet may still be loading here (WebKit), and nothing is painted before it: what
      // must already be set is the theme it will apply.
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { firstTheme?: string }).firstTheme =
          document.documentElement.dataset.theme;
      });
    });
    await page.goto('/en/');
    expect(
      await page.evaluate(() => (window as unknown as { firstTheme?: string }).firstTheme),
    ).toBe('dark');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(dark);
  });

  test('with storage blocked, the button still changes the page', async ({ page }) => {
    const light = await systemBg(page, 'light');
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/en/');

    await toggle(page).click();
    await expect(toggle(page)).toHaveAccessibleName(LABELS.en.light);
    expect(
      await page.evaluate(() => ({
        dataTheme: document.documentElement.dataset.theme,
        bg: getComputedStyle(document.body).backgroundColor,
      })),
    ).toEqual({ dataTheme: 'light', bg: light });
    expect(errors).toEqual([]);
  });

  test('keyboard: reached by Tab, activated by Enter and Space', async ({ page }, info) => {
    // WebKit only tabs to links and buttons with a platform setting turned on.
    test.skip(info.project.name === 'mobile-webkit', 'no Tab navigation in WebKit by default');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/fr/');
    const button = toggle(page);
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      if (await button.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAccessibleName(LABELS.fr.light);
    await page.keyboard.press('Space');
    await expect(button).toHaveAccessibleName(LABELS.fr.dark);
  });

  test('no cookie is set', async ({ page, context }) => {
    await page.goto('/en/');
    for (let i = 0; i < 3; i++) await toggle(page).click();
    await page.goto('/fr/');
    expect(await context.cookies()).toEqual([]);
  });
});

test('without JavaScript the button is hidden and the system decides', async ({
  page,
  javaScriptEnabled,
}) => {
  test.skip(javaScriptEnabled, 'only meaningful with JavaScript disabled');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/en/');
  await expect(toggle(page)).toBeHidden();
  expect(
    await page.evaluate(() => ({
      dataTheme: document.documentElement.dataset.theme ?? null,
      scheme: getComputedStyle(document.documentElement).colorScheme,
    })),
  ).toEqual({ dataTheme: null, scheme: 'dark' });
});
