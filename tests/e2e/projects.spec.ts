// User Story 1 — discover the projects. Runs in every Playwright project, including
// `chromium-nojs` (FR-010) and `chromium-320` (FR-024).
import { expect, test } from '@playwright/test';

for (const lang of ['fr', 'en'] as const) {
  const L = {
    fr: {
      projects: 'Projets',
      all: 'Voir tous les projets',
      role: 'Rôle',
      back: 'Retour aux projets',
      next: 'Projet suivant',
    },
    en: {
      projects: 'Projects',
      all: 'See all projects',
      role: 'Role',
      back: 'Back to projects',
      next: 'Next project',
    },
  }[lang];

  test.describe(`projects (${lang})`, () => {
    test('home presents the person and featured projects (US1-1)', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.headline')).not.toBeEmpty();
      await expect(page.locator('.featured .project-card').first()).toBeVisible();
      await expect(page.getByRole('link', { name: L.all })).toBeVisible();
    });

    test('a project detail is reachable in two clicks from home (US1-2, SC-001)', async ({
      page,
    }) => {
      await page.goto(`/${lang}/`);
      await page.getByRole('navigation').getByRole('link', { name: L.projects }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/(projets|projects)/$`));
      const card = page.locator('.project-card').first();
      const title = (await card.locator('h2, h3').first().innerText()).trim();
      await card.getByRole('link').first().click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      for (const section of ['.summary', '.project-meta', '.prose']) {
        await expect(page.locator(section).first()).toBeVisible();
      }
      await expect(page.getByText(L.role, { exact: true })).toBeVisible();
    });

    test('navigation between projects (US1-3)', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.locator('.featured .project-card a').first().click();
      const first = await page.getByRole('heading', { level: 1 }).innerText();
      await page.getByRole('link', { name: new RegExp(L.next) }).click();
      await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(first);
      await page.getByRole('link', { name: L.back }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/(projets|projects)/$`));
    });

    test('category pages filter the list (FR-009)', async ({ page }) => {
      await page.goto(`/${lang}/${lang === 'fr' ? 'projets' : 'projects'}/`);
      const filters = page.getByRole('navigation', {
        name: lang === 'fr' ? 'Filtrer par catégorie' : 'Filter by category',
      });
      const all = await page.locator('.project-card').count();
      await filters.getByRole('link').nth(1).click();
      await expect(page).toHaveURL(/\/(categorie|category)\/[a-z0-9-]+\/$/);
      const filtered = await page.locator('.project-card').count();
      expect(filtered).toBeGreaterThan(0);
      expect(filtered).toBeLessThanOrEqual(all);
    });

    test('no horizontal scroll (FR-024)', async ({ page }) => {
      for (const path of [`/${lang}/`, `/${lang}/${lang === 'fr' ? 'projets' : 'projects'}/`]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
      }
    });
  });
}

test('the list shows every published project of the seed content', async ({ page }) => {
  const response = await page.goto('/fr/projets/');
  expect(response?.ok()).toBe(true);
  await expect(page.locator('.project-card')).toHaveCount(3);
});
