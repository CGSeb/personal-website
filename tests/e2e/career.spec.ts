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

      // Experiences are grouped by organization and ordered by their latest role.
      const experiences = page.locator('#experience .career-entry');
      await expect(experiences.first()).toBeVisible();
      for (const field of ['.entry-title', '.entry-org', '.period', '.role-summary', '.tags']) {
        await expect(experiences.first().locator(field).first()).not.toBeEmpty();
      }

      const diplomas = page.locator('#education .education-entry');
      await expect(diplomas.first()).toBeVisible();
      // The first <time> of each diploma is its start; sorted by start, descending.
      const starts = await diplomas.evaluateAll((els) =>
        els.map((el) => el.querySelector('time')?.getAttribute('datetime') ?? ''),
      );
      expect([...starts].sort().reverse()).toEqual(starts);
      for (const field of ['.entry-title', '.entry-details', '.period']) {
        await expect(diplomas.first().locator(field)).not.toBeEmpty();
      }
    });

    test('roles in the same organization are stacked in one block', async ({ page }) => {
      await page.goto(L[lang].path);
      const group = page.locator('#experience .career-entry', { hasText: 'OpenStudio' });
      await expect(group).toHaveCount(1);
      await expect(group.locator('.role')).toHaveCount(2);
    });

    test('an experience page lists and links its projects (US2-2)', async ({ page }) => {
      await page.goto(L[lang].path);
      const withProjects = page.locator('#experience .career-entry', {
        hasText: /Freelance|Indépendant/,
      });
      await withProjects
        .getByRole('link', { name: /détail|details/i })
        .first()
        .click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const projectLink = page.locator('.related-projects a').first();
      await expect(projectLink).toBeVisible();
      await projectLink.click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/(projets|projects)/[a-z0-9-]+/$`));
    });

    test('an ongoing experience shows the ongoing label (US2-3)', async ({ page }) => {
      await page.goto(L[lang].path);
      const ongoing = page.locator('#experience .career-entry').first();
      await expect(ongoing.locator('.period').first()).toContainText(L[lang].ongoing);
      await expect(ongoing.locator('.entry-dates time')).toHaveCount(1);
    });

    test('the ongoing dot pulses, and only fades with reduced motion', async ({ page }) => {
      const dot = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((el) => {
            const s = getComputedStyle(el, '::before');
            return { bg: s.backgroundColor, animation: s.animationName };
          });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(L[lang].path);
      const ongoing = await dot('#experience .career-entry.ongoing .entry-dates');
      const past = await dot('#experience .career-entry:not(.ongoing) .entry-dates');
      expect(ongoing.animation).toBe('pulse');
      expect(ongoing.bg).not.toBe(past.bg);
      expect(past.animation).toBe('none');

      await page.emulateMedia({ reducedMotion: 'reduce' });
      // Reduced motion: no ring, only a slow fade of the dot.
      expect((await dot('#experience .career-entry.ongoing .entry-dates')).animation).toBe('fade');
    });

    test('a diploma page shows its details', async ({ page }) => {
      await page.goto(L[lang].path);
      await page.locator('#education .education-entry a').first().click();
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
