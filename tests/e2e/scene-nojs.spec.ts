// Scene page without JavaScript (quickstart scenario 2): readable content and links to the
// written pages, no blank page (US4-4, FR-020, FR-027).
import { expect, test } from '@playwright/test';

test('without JavaScript the scene page lists every item with links to the written pages', async ({
  page,
  javaScriptEnabled,
}) => {
  test.skip(javaScriptEnabled, 'only meaningful with JavaScript disabled');
  await page.goto('/fr/explorer/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explorer le portfolio en 3D');
  await expect(page.getByText('La scène 3D a besoin de JavaScript')).toBeVisible();
  const list = page.locator('.scene-list');
  await expect(list.getByRole('link', { name: 'LessonFolk' })).toHaveAttribute(
    'href',
    '/fr/projets/lesson-folk/',
  );
  await expect(list.getByRole('link', { name: 'Ingénieur conception logicielle' })).toHaveAttribute(
    'href',
    '/fr/parcours/diplomes/exia-cesi/',
  );
  await expect(page.locator('.scene-panel:visible')).toHaveCount(0);
});
