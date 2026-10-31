// User Story 3 — read the site in your language.
import { expect, test } from '@playwright/test';

// Same page in both languages, one per page type.
const pairs: [string, string][] = [
  ['/fr/', '/en/'],
  ['/fr/projets/', '/en/projects/'],
  ['/fr/projets/categorie/web/', '/en/projects/category/web/'],
  ['/fr/projets/voxelshift/', '/en/projects/voxelshift/'],
  ['/fr/parcours/', '/en/career/'],
  ['/fr/parcours/experiences/cg-seb/', '/en/career/experience/cg-seb/'],
  ['/fr/parcours/diplomes/exia-cesi/', '/en/career/education/exia-cesi/'],
];

test.describe('language switcher (US3-1, FR-014)', () => {
  for (const [fr, en] of pairs) {
    test(`${fr} <-> ${en}`, async ({ page }) => {
      await page.goto(fr);
      await page.getByRole('link', { name: 'English' }).click();
      await expect(page).toHaveURL(new RegExp(`${en}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await page.getByRole('link', { name: 'Français' }).click();
      await expect(page).toHaveURL(new RegExp(`${fr}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    });
  }
});

test.describe('hreflang (US3-3, FR-013)', () => {
  for (const [fr, en] of pairs) {
    test(`${fr} and ${en} point to each other`, async ({ page }) => {
      for (const [path, lang] of [
        [fr, 'fr'],
        [en, 'en'],
      ] as const) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const href = (hreflang: string) =>
          page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`).getAttribute('href');
        expect(new URL((await href('fr'))!).pathname).toBe(fr);
        expect(new URL((await href('en'))!).pathname).toBe(en);
        expect(new URL((await href('x-default'))!).pathname).toBe('/');
      }
    });
  }
});

test.describe('root page (US3-2, FR-015)', () => {
  test('offers both languages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForLoadState();
    // With JavaScript the page redirects; without it the visitor picks a language.
    if (new URL(page.url()).pathname === '/') {
      await expect(page.getByRole('link', { name: /Français/ })).toHaveAttribute('href', '/fr/');
      await expect(page.getByRole('link', { name: /English/ })).toHaveAttribute('href', '/en/');
    }
  });

  test.describe('French browser', () => {
    test.use({ locale: 'fr-FR' });
    test('redirects to /fr/', async ({ page, javaScriptEnabled }) => {
      test.skip(!javaScriptEnabled, 'the redirect needs JavaScript');
      await page.goto('/');
      await expect(page).toHaveURL(/\/fr\/$/);
    });
  });

  test.describe('other browser language', () => {
    test.use({ locale: 'de-DE' });
    test('redirects to /en/', async ({ page, javaScriptEnabled }) => {
      test.skip(!javaScriptEnabled, 'the redirect needs JavaScript');
      await page.goto('/');
      await expect(page).toHaveURL(/\/en\/$/);
    });
  });
});

test('unknown address shows the not-found page in both languages', async ({ page }) => {
  const response = await page.goto('/fr/projets/nexiste-pas/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Page introuvable');
  await expect(page.getByText('Page not found')).toBeVisible();
  await expect(page.getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/fr/');
  await expect(page.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/en/');
});
