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
