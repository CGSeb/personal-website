// Spec 004 — the figure of Sébastien at the desk (quickstart B).
import { expect, test, type Page } from '@playwright/test';

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'the 3D needs JavaScript');

const AVATAR = 'avatar';

/** Opens the scene with the test hook enabled and waits for the scene and the figure. */
async function openScene(page: Page, path = '/fr/explorer/') {
  await page.addInitScript(() => {
    window.__sceneTest = true;
  });
  await page.goto(path);
  await expect(page.locator('#scene canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
  await page.evaluate(() => window.__scene!.ready);
  await page.waitForFunction(() => window.__scene!.avatar().shown, null, { timeout: 30_000 });
}

/** Viewport position of an object, from the test hook, once the camera has stopped moving. */
async function objectPoint(page: Page, key: string) {
  const at = async () => {
    const point = await page.evaluate((k) => window.__scene!.screenPosition(k), key);
    expect(point, key).not.toBeNull();
    const box = (await page.locator('#scene').boundingBox())!;
    return { x: box.x + point!.x, y: box.y + point!.y };
  };
  await expect
    .poll(async () => {
      const a = await at();
      await page.waitForTimeout(100);
      const b = await at();
      return Math.hypot(a.x - b.x, a.y - b.y);
    })
    .toBeLessThan(1);
  return at();
}

/** Selects an object at its screen position, the way the device does. */
async function select(page: Page, key: string, touch: boolean) {
  const { x, y } = await objectPoint(page, key);
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

test.describe('in the room (US1)', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    for (const [shape, viewport] of [
      ['portrait', { width: 390, height: 780 }],
      ['landscape', { width: 1280, height: 720 }],
    ] as const) {
      test(`the figure is shown inside the view, ${colorScheme}, ${shape} (FR-001, SC-002)`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize(viewport);
        await openScene(page);
        expect(await page.evaluate(() => window.__scene!.ambiance())).toBe(
          colorScheme === 'dark' ? 'night' : 'day',
        );
        const at = (await page.evaluate((k) => window.__scene!.screenPosition(k), AVATAR))!;
        const box = (await page.locator('#scene').boundingBox())!;
        expect(at.x).toBeGreaterThan(0);
        expect(at.x).toBeLessThan(box.width);
        expect(at.y).toBeGreaterThan(0);
        expect(at.y).toBeLessThan(box.height);
      });
    }
  }

  test('every object still opens its panel, never the bubble (FR-004, SC-006)', async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(120_000);
    await openScene(page);
    const items = await page.evaluate(
      () =>
        JSON.parse(document.getElementById('scene-manifest')!.textContent!) as {
          key: string;
          panelId: string;
        }[],
    );
    expect(items.length).toBeGreaterThan(0);
    for (const { key, panelId } of items) {
      await select(page, key, isMobile);
      // An item kept in an overflow box is reached through that box.
      const panel = page.locator(`[id="${panelId}"], #panel-overflow`).locator('visible=true');
      await expect(panel, key).toHaveCount(1);
      await expect(page.locator('[data-avatar-bubble]')).toBeHidden();
      await page.keyboard.press('Escape');
      await expect(panel, key).toHaveCount(0);
    }
  });
});
