// Privacy (FR-023, SC-006, constitution V): no third-party request and no cookie on any page;
// third-party videos load only after a click. Pages and scene run in both themes (spec 003).
import { expect, test } from '@playwright/test';

test('no request outside the site and no cookie, on every page, in both themes', async ({
  page,
  context,
  request,
  baseURL,
  javaScriptEnabled,
}) => {
  test.setTimeout(120_000);
  const origin = new URL(baseURL!).origin;
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, url]) => new URL(url!).pathname,
  );
  expect(pages.length).toBeGreaterThan(10);

  const outside: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== origin)
      outside.push(req.url());
  });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const path of pages.filter((p) => p !== '/')) {
      await page.goto(path, { waitUntil: 'networkidle' });
    }
    // The button itself: one full cycle on the last page.
    if (javaScriptEnabled) {
      for (let i = 0; i < 3; i++) await page.locator('.site-header [data-theme-toggle]').click();
      await page.waitForLoadState('networkidle');
    }
  }
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('the 3D scene, by day and by night, with a panel open, makes no outside request and sets no cookie', async ({
  page,
  context,
  baseURL,
  javaScriptEnabled,
}) => {
  test.skip(!javaScriptEnabled, 'the 3D needs JavaScript');
  const origin = new URL(baseURL!).origin;
  const outside: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== origin)
      outside.push(req.url());
  });
  await page.addInitScript(() => {
    window.__sceneTest = true;
  });
  for (const [path, item, colorScheme] of [
    ['/fr/explorer/', 'LessonFolk', 'light'],
    ['/en/explore/', 'LessonFolk', 'dark'],
  ] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto(path);
    await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
    await page.evaluate(() => window.__scene!.ready);
    await page.locator('.scene-list summary').click();
    await page.locator('.scene-list').getByRole('button', { name: item }).first().click();
    await expect(page.locator('.scene-panel:not([hidden])')).toBeVisible();
    // The theme button switches the room to the other ambiance, which loads its baked texture.
    // The header's button: on phones the panel is a sheet over the scene's own button.
    const toggle = page.locator('.site-header [data-theme-toggle]');
    const other = colorScheme === 'light' ? 'night' : 'day';
    await toggle.click();
    // From a light system the first click picks "light" (still day), the second "dark".
    if (colorScheme === 'light') await toggle.click();
    await expect.poll(() => page.evaluate(() => window.__scene!.ambiance())).toBe(other);
    await page.waitForLoadState('networkidle');
    // Back to "follow the system" for the next pass.
    await page.evaluate(() => localStorage.removeItem('theme'));
  }
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('a third-party video loads only after a click', async ({ page, javaScriptEnabled }) => {
  const videoRequests: string[] = [];
  await page.route('**/*youtube*/**', (route) => {
    videoRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto('/fr/projets/lesson-folk/', { waitUntil: 'networkidle' });
  expect(videoRequests).toEqual([]);
  await expect(page.locator('.video-facade iframe')).toHaveCount(0);

  // Real content: runs again as soon as the project has a video link.
  test.skip((await page.locator('.video-facade').count()) === 0, 'no video link in the content');

  test.skip(!javaScriptEnabled, 'without JavaScript the facade is a plain link to the video');
  await page.locator('.video-facade .video-link').click();
  await expect(page.locator('.video-facade iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\//,
  );
});
