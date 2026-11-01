// User Story 5 — get in touch: protected e-mail link and profile links, no form.
import { expect, test } from '@playwright/test';

const EMAIL = 'contact@sebastienmichon.fr'; // content/profile.yaml
const L = {
  fr: { contact: 'Contact', path: '/fr/contact/' },
  en: { contact: 'Contact', path: '/en/contact/' },
};

for (const lang of ['fr', 'en'] as const) {
  test.describe(`contact (${lang})`, () => {
    test('e-mail link and profile links, no form (US5-1, FR-026)', async ({ page }) => {
      await page.goto(L[lang].path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const mail = page.locator('a[href^="mailto:"]');
      await expect(mail).toHaveCount(1);
      await expect(mail).toHaveAttribute('href', `mailto:${EMAIL}`);
      await expect(mail).toHaveText(EMAIL);
      await expect(page.locator('.profiles a[href^="https://"]').first()).toBeVisible();
      await expect(page.locator('form')).toHaveCount(0);
    });

    test(
      'contact is reachable from the navigation and the footer (US5-3)',
      { tag: '@narrow' },
      async ({ page }) => {
        await page.goto(`/${lang}/`);
        await expect(
          page.locator('footer').getByRole('link', { name: L[lang].contact }),
        ).toHaveAttribute('href', L[lang].path);
        await page.getByRole('navigation').getByRole('link', { name: L[lang].contact }).click();
        await expect(page).toHaveURL(new RegExp(`${L[lang].path}$`));
      },
    );
  });
}

test('the plain e-mail address is in no page source (US5-2)', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => new URL(url!).pathname,
  );
  expect(pages).toContain('/fr/contact/');
  for (const path of pages) {
    const html = await (await request.get(path)).text();
    expect(html, path).not.toContain(EMAIL);
  }
  const exported = await (await request.get('/data/portfolio.json')).text();
  expect(exported).not.toContain(EMAIL);
});
