// Privacy (FR-023, SC-006, constitution V): no third-party request and no cookie on any page;
// third-party videos load only after a click.
import { expect, test } from '@playwright/test';

test('no request outside the site and no cookie, on every page', async ({
  page,
  context,
  request,
  baseURL,
}) => {
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
  for (const path of pages.filter((p) => p !== '/')) {
    await page.goto(path, { waitUntil: 'networkidle' });
  }
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});

test('the 3D scene, loaded and with a panel open, makes no outside request and sets no cookie', async ({
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
  for (const [path, item] of [
    ['/fr/explorer/', 'LessonFolk'],
    ['/en/explore/', 'LessonFolk'],
  ] as const) {
    await page.goto(path);
    await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
    await page.evaluate(() => window.__scene!.ready);
    await page.locator('.scene-list').getByRole('button', { name: item }).first().click();
    await expect(page.locator('.scene-panel:not([hidden])')).toBeVisible();
    await page.waitForLoadState('networkidle');
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

  test.skip(!javaScriptEnabled, 'without JavaScript the facade is a plain link to the video');
  await page.locator('.video-facade .video-link').click();
  await expect(page.locator('.video-facade iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\//,
  );
});
