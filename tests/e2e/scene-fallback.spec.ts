// Scene 002 — US4: fallbacks towards the written version. Nobody is left on a blank scene.
import { expect, test, type Page } from '@playwright/test';

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'covered by scene-nojs.spec.ts');

const status = (page: Page) => page.locator('#scene .scene-status');

test.describe('reduced motion (US4-2, FR-024)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('asks first; "Continuer en 3D" loads the scene', async ({ page }) => {
    await page.goto('/fr/explorer/');
    await expect(status(page).getByRole('heading', { name: 'Animations réduites' })).toBeVisible();
    await expect(page.locator('#scene canvas')).toHaveCount(0);
    await status(page).getByRole('button', { name: 'Continuer en 3D' }).click();
    await expect(page.locator('#scene canvas')).toBeVisible({ timeout: 30_000 });
    // The choice is remembered for the session.
    await page.reload();
    await expect(page.locator('#scene canvas')).toBeVisible({ timeout: 30_000 });
  });

  test('"Voir la version écrite" goes to the written home', async ({ page }) => {
    await page.goto('/fr/explorer/');
    await status(page).getByRole('link', { name: 'Voir la version écrite' }).click();
    await expect(page).toHaveURL(/\/fr\/$/);
  });
});

test('a scene that cannot load shows the error, a retry and the written version', async ({
  page,
}) => {
  // Block the 3D module (dev: scene3d.ts, build: scene3d.<hash>.js) and Three.js chunks.
  await page.route(/scene3d|three/, (route) => route.abort());
  await page.goto('/fr/explorer/');
  await expect(status(page)).toContainText('n’a pas pu se charger', { timeout: 30_000 });
  await expect(status(page).getByRole('button', { name: 'Réessayer' })).toBeVisible();
  await expect(status(page).getByRole('link', { name: 'Voir la version écrite' })).toBeVisible();
});
