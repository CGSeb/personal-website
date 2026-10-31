// Scene 002 — SC-003: frame rate on a slowed-down machine. Chromium only (CPU throttling
// through the DevTools protocol). Passes at 30 fps or more, or when the scene steps its quality
// down and then proposes the written version, so a slow device is never stuck.
import { expect, test, type Page } from '@playwright/test';

const SECONDS = 10;

test.skip(
  ({ browserName, javaScriptEnabled }) => browserName !== 'chromium' || !javaScriptEnabled,
  'CPU throttling needs Chromium, and the 3D needs JavaScript',
);

/** One scripted gesture: a pan drag across the canvas, then a zoom in and out. */
async function gesture(page: Page, box: { x: number; y: number; width: number; height: number }) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx - 120, cy);
  await page.mouse.down();
  for (let i = 0; i <= 24; i++) await page.mouse.move(cx - 120 + i * 10, cy + Math.sin(i / 4) * 40);
  await page.mouse.up();
  for (const delta of [-120, -120, 120, 120]) await page.mouse.wheel(0, delta);
}

// By day and, since spec 003, by night (lamps, LED glows and the night window).
for (const colorScheme of ['light', 'dark'] as const) {
  test(`the scene holds 30 fps under 4× CPU throttling, or steps down and proposes the written version (SC-003, ${colorScheme})`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'one desktop measure is enough');
    test.setTimeout(90_000);
    await page.emulateMedia({ colorScheme });

    await page.addInitScript(() => {
      window.__sceneTest = true;
    });
    await page.goto('/fr/explorer/');
    await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
    await page.evaluate(() => window.__scene!.ready);
    expect(await page.evaluate(() => window.__scene!.ambiance())).toBe(
      colorScheme === 'dark' ? 'night' : 'day',
    );

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const box = (await page.locator('#scene canvas').boundingBox())!;
    const startFrames = await page.evaluate(() => window.__scene!.frames());
    const start = Date.now();
    while (Date.now() - start < SECONDS * 1000) await gesture(page, box);
    const elapsed = (Date.now() - start) / 1000;
    const fps = ((await page.evaluate(() => window.__scene!.frames())) - startFrames) / elapsed;
    testInfo.annotations.push({ type: 'fps', description: fps.toFixed(1) });
    if (fps >= 30) return;

    // Too slow: the governor must step down to the lowest quality, then propose the written
    // version. Keep moving so it keeps measuring.
    const notice = page.locator('.scene-notice');
    const deadline = Date.now() + 30_000;
    while (!(await notice.isVisible()) && Date.now() < deadline) await gesture(page, box);
    await expect(notice, `${fps.toFixed(1)} fps and no proposal`).toBeVisible();
    expect(await page.evaluate(() => window.__scene!.quality())).toBe('low');
    await expect(notice.getByRole('link')).toHaveAttribute('href', '/fr/');
  });
}
