// User Story 2 — the career page and one page per experience and diploma.
import { expect, test } from '@playwright/test';

const L = {
  fr: { career: 'Parcours', ongoing: 'Depuis', path: '/fr/parcours/' },
  en: { career: 'Career', ongoing: 'Since', path: '/en/career/' },
};

for (const lang of ['fr', 'en'] as const) {
  test.describe(`career (${lang})`, () => {
    test('lists experience and education, most recent first (US2-1)', async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.getByRole('navigation').getByRole('link', { name: L[lang].career }).click();
      await expect(page).toHaveURL(new RegExp(`${L[lang].path}$`));

      for (const list of ['#experience', '#education']) {
        const entries = page.locator(`${list} .timeline-entry`);
        await expect(entries.first()).toBeVisible();
        // The first <time> of each entry is its start; entries are sorted by start, descending.
        const starts = await entries.evaluateAll((els) =>
          els.map((el) => el.querySelector('time')?.getAttribute('datetime') ?? ''),
        );
        expect([...starts].sort().reverse()).toEqual(starts);
        for (const field of ['.entry-title', '.entry-org', '.entry-location', '.period']) {
          await expect(entries.first().locator(field)).not.toBeEmpty();
        }
      }
    });

    test('an experience page lists and links its projects (US2-2)', async ({ page }) => {
      await page.goto(L[lang].path);
      const withProjects = page.locator('#experience .timeline-entry', {
        hasText: /Freelance|Indépendant/,
      });
      await withProjects.getByRole('link').first().click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const projectLink = page.locator('.related-projects a').first();
      await expect(projectLink).toBeVisible();
      await projectLink.click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/(projets|projects)/[a-z0-9-]+/$`));
    });

    test('an ongoing experience shows the ongoing label (US2-3)', async ({ page }) => {
      await page.goto(L[lang].path);
      const ongoing = page.locator('#experience .timeline-entry').first();
      await expect(ongoing.locator('.period')).toContainText(L[lang].ongoing);
      await expect(ongoing.locator('.period time')).toHaveCount(1);
    });

    test('a diploma page shows its details', async ({ page }) => {
      await page.goto(L[lang].path);
      await page.locator('#education .timeline-entry a').first().click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.entry-meta')).toBeVisible();
      await expect(page.locator('.prose')).not.toBeEmpty();
    });

    test('project pages link to their experience (FR-003)', async ({ page }) => {
      await page.goto(`/${lang}/${lang === 'fr' ? 'projets' : 'projects'}/lesson-folk/`);
      await page.locator('.related a').first().click();
      await expect(page).toHaveURL(new RegExp(`${L[lang].path}[a-z]+/[a-z0-9-]+/$`));
    });
  });
}
