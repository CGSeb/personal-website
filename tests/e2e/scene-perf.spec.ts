// Scene 002 — SC-003: frame rate on a slowed-down machine. Chromium only (CPU throttling
// through the DevTools protocol). Passes at 30 fps or more, or when the scene steps its quality
// down and then proposes the written version, so a slow device is never stuck.
import { expect, test, type Page } from '@playwright/test';

const SECONDS = 10;

test.skip(
  ({ browserName, javaScriptEnabled }) => browserName !== 'chromium' || !javaScriptEnabled,
  'CPU throttling needs Chromium, and the 3D needs JavaScript',
);

/**
 * Keeps the scene moving for `ms`: one zoom step per animation frame, in then out, dispatched
 * from the page itself. Driving it with Playwright's mouse would wait for a round trip per event
 * and leave the scene idle in between, which is not the speed of the scene.
 */
async function keepMoving(page: Page, ms: number) {
  await page.evaluate(
    (duration) =>
      new Promise<void>((resolve) => {
        const canvas = document.querySelector('#scene canvas')!;
        const box = canvas.getBoundingClientRect();
        const end = performance.now() + duration;
        let i = 0;
        const step = (now: number) => {
          if (now >= end) return resolve();
          const deltaY = Math.floor(i++ / 10) % 2 === 0 ? -40 : 40;
          canvas.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY,
              clientX: box.left + box.width / 2,
              clientY: box.top + box.height / 2,
              bubbles: true,
              cancelable: true,
            }),
          );
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    ms,
  );
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

    const startFrames = await page.evaluate(() => window.__scene!.frames());
    const start = Date.now();
    await keepMoving(page, SECONDS * 1000);
    const elapsed = (Date.now() - start) / 1000;
    const fps = ((await page.evaluate(() => window.__scene!.frames())) - startFrames) / elapsed;
    testInfo.annotations.push({ type: 'fps', description: fps.toFixed(1) });
    if (fps >= 30) return;

    // Too slow: the governor must step down to the lowest quality, then propose the written
    // version. Keep moving so it keeps measuring.
    const notice = page.locator('.scene-notice');
    const deadline = Date.now() + 30_000;
    while (!(await notice.isVisible()) && Date.now() < deadline) await keepMoving(page, 2000);
    await expect(notice, `${fps.toFixed(1)} fps and no proposal`).toBeVisible();
    expect(await page.evaluate(() => window.__scene!.quality())).toBe('low');
    await expect(notice.getByRole('link')).toHaveAttribute('href', '/fr/');
  });
}
