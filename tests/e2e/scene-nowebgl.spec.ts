// Scene 002 — US4-1: without WebGL the scene page offers the written version; the list and the
// panels still work. Own file: switching WebGL off needs its own browser launch.
import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });

test('without WebGL: message, written version, list and panels still work', async ({
  page,
  browserName,
  javaScriptEnabled,
}) => {
  test.skip(browserName !== 'chromium', 'WebGL can only be switched off in Chromium'); // see playwright.config.ts
  test.skip(!javaScriptEnabled, 'covered by scene-nojs.spec.ts');
  await page.goto('/fr/explorer/');
  const status = page.locator('#scene .scene-status');
  await expect(status).toContainText('ne peut pas afficher la 3D');
  await expect(status.getByRole('link', { name: 'Voir la version écrite' })).toHaveAttribute(
    'href',
    '/fr/',
  );
  await expect(page.locator('#scene canvas')).toHaveCount(0);
  await page.locator('.scene-list').getByRole('button', { name: 'LessonFolk' }).click();
  await expect(page.locator('#panel-project-lesson-folk')).toBeVisible();
});
