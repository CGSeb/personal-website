// Scene 002 — US1 (panels from the scene) and US2 (learn more, state restore).
import { expect, test, type Page } from '@playwright/test';

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'the 3D needs JavaScript');

/** Waits for the test hook (installed once the page is idle) and for the scene. */
async function sceneReady(page: Page) {
  await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
  await page.evaluate(() => window.__scene!.ready);
}

/** Opens the scene with the test hook enabled and waits until it is ready. */
async function openScene(page: Page, path = '/fr/explorer/') {
  await page.addInitScript(() => {
    window.__sceneTest = true;
  });
  await page.goto(path);
  await expect(page.locator('#scene canvas')).toBeVisible({ timeout: 30_000 });
  await sceneReady(page);
}

/** Viewport position of an object, from the test hook. */
async function objectPoint(page: Page, key: string) {
  const point = await page.evaluate((k) => window.__scene!.screenPosition(k), key);
  expect(point, key).not.toBeNull();
  const box = (await page.locator('#scene').boundingBox())!;
  return { x: box.x + point!.x, y: box.y + point!.y };
}

async function clickObject(page: Page, key: string) {
  // Wait for any camera move (bringing the previous item into view) to finish.
  await expect
    .poll(async () => {
      const a = await objectPoint(page, key);
      await page.waitForTimeout(100);
      const b = await objectPoint(page, key);
      return Math.hypot(a.x - b.x, a.y - b.y);
    })
    .toBeLessThan(1);
  const { x, y } = await objectPoint(page, key);
  await page.mouse.click(x, y);
}

test.describe('scene (US1)', () => {
  test('home link opens the scene, which loads (US1-1)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__sceneTest = true;
    });
    await page.goto('/fr/');
    await page.getByRole('link', { name: 'Explorer le portfolio en 3D' }).click();
    await expect(page).toHaveURL(/\/fr\/explorer\/$/);
    await sceneReady(page);
    await expect(page.locator('#scene')).toHaveAttribute('aria-busy', 'false');
  });

  test('hovering an object shows its name (US1-2)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no hover on touch screens');
    await openScene(page);
    const { x, y } = await objectPoint(page, 'project/lesson-folk');
    await page.mouse.move(x, y);
    await expect(page.locator('.scene-tooltip')).toHaveText('LessonFolk');
  });

  test('a project opens its panel in the scene (US1-4)', async ({ page }) => {
    await openScene(page);
    await clickObject(page, 'project/lesson-folk');
    const panel = page.locator('#panel-project-lesson-folk');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('heading', { level: 2 })).toHaveText('LessonFolk');
    for (const text of ['Rôle', 'Période', 'TypeScript', 'En savoir plus']) {
      await expect(panel.getByText(text, { exact: false }).first()).toBeVisible();
    }
    await expect(page).toHaveURL(/#projet\/lesson-folk$/);
  });

  test('a diploma and an experience open their panels (US1-3, US1-5)', async ({ page }) => {
    await openScene(page);
    await clickObject(page, 'education/master-informatique');
    await expect(page.locator('#panel-education-master-informatique')).toBeVisible();
    await expect(page.locator('#panel-education-master-informatique')).toContainText('Bac+5');
    // The open panel may cover other objects on small screens: close it first.
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel-education-master-informatique')).toBeHidden();
    await clickObject(page, 'experience/freelance-dev');
    await expect(page.locator('#panel-experience-freelance-dev')).toBeVisible();
    await expect(page.locator('#panel-experience-freelance-dev')).toContainText('Depuis');
  });

  test('close button, Escape and a click outside close the panel (US1-6)', async ({ page }) => {
    await openScene(page);
    const panel = page.locator('#panel-project-lesson-folk');

    await clickObject(page, 'project/lesson-folk');
    await panel.getByRole('button', { name: 'Fermer' }).click();
    await expect(panel).toBeHidden();
    await expect(page).not.toHaveURL(/#/);

    await clickObject(page, 'project/lesson-folk');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();

    await clickObject(page, 'project/lesson-folk');
    await page.locator('main h1').click();
    await expect(panel).toBeHidden();
  });

  test('the item list opens panels too (FR-020)', async ({ page }) => {
    await openScene(page);
    await page
      .locator('.scene-list')
      .getByRole('button', { name: 'Master en informatique' })
      .click();
    await expect(page.locator('#panel-education-master-informatique')).toBeVisible();
  });
});

test.describe('scene (US2)', () => {
  test('selecting never leaves the page; "En savoir plus" goes to the written page (US2-1, US2-2)', async ({
    page,
  }) => {
    await openScene(page);
    await clickObject(page, 'project/lesson-folk');
    await expect(page).toHaveURL(/\/fr\/explorer\/#projet\/lesson-folk$/);
    await page
      .locator('#panel-project-lesson-folk')
      .getByRole('link', { name: /En savoir plus/ })
      .click();
    await expect(page).toHaveURL(/\/fr\/projets\/lesson-folk\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('LessonFolk');
  });

  test('going back restores the open panel (US2-3)', async ({ page }) => {
    await openScene(page);
    await clickObject(page, 'project/lesson-folk');
    await page
      .locator('#panel-project-lesson-folk')
      .getByRole('link', { name: /En savoir plus/ })
      .click();
    await expect(page).toHaveURL(/\/fr\/projets\/lesson-folk\/$/);
    await page.goBack();
    await sceneReady(page);
    await expect(page.locator('#panel-project-lesson-folk')).toBeVisible();
  });

  test('a link to the written home is always visible (US2-4)', async ({ page }) => {
    await openScene(page);
    await expect(page.getByRole('link', { name: 'Voir la version écrite' })).toHaveAttribute(
      'href',
      '/fr/',
    );
  });

  test('a shared link opens its panel, in English (FR-014)', async ({ page }) => {
    await openScene(page, '/en/explore/#education/master-informatique');
    const panel = page.locator('#panel-education-master-informatique');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
      'href',
      '/en/career/education/master-informatique/',
    );
  });
});

test.describe('scene on phones (US3)', () => {
  test('a tap opens the panel as a bottom sheet that fits the screen (US3-1, US3-2)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    await openScene(page);
    const { x, y } = await objectPoint(page, 'project/lesson-folk');
    await page.mouse.click(x, y);
    const panel = page.locator('#panel-project-lesson-folk');
    await expect(panel).toBeVisible();
    const sheet = (await panel.boundingBox())!;
    const scene = (await page.locator('.scene-wrap').boundingBox())!;
    expect(sheet.width).toBeGreaterThanOrEqual(scene.width - 2);
    expect(Math.round(sheet.y + sheet.height)).toBeLessThanOrEqual(
      Math.round(scene.y + scene.height) + 1,
    );
    expect(sheet.height).toBeLessThanOrEqual(scene.height * 0.7 + 1);
    await expect(panel.getByRole('button', { name: 'Fermer' })).toBeInViewport();
  });

  test('swiping the sheet down closes it (US3-2)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'touch events are dispatched through Chromium');
    await page.setViewportSize({ width: 375, height: 740 });
    await openScene(page);
    await page.locator('.scene-list').getByRole('button', { name: 'LessonFolk' }).click();
    const panel = page.locator('#panel-project-lesson-folk');
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    await panel.dispatchEvent('touchstart', {
      touches: [{ identifier: 1, clientX: box.x + 40, clientY: box.y + 20 }],
    });
    await panel.dispatchEvent('touchend', {
      changedTouches: [{ identifier: 1, clientX: box.x + 40, clientY: box.y + 140 }],
    });
    await expect(panel).toBeHidden();
  });

  test('turning the screen keeps the scene without reloading (US3-3)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await openScene(page);
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
    await page.setViewportSize({ width: 780, height: 390 });
    await expect(page.locator('#scene canvas')).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
    // Objects are still placed inside the view.
    const p = await page.evaluate(() => window.__scene!.screenPosition('project/lesson-folk'));
    const box = (await page.locator('#scene').boundingBox())!;
    expect(p!.x).toBeGreaterThan(0);
    expect(p!.x).toBeLessThan(box.width);
    expect(p!.y).toBeGreaterThan(0);
    expect(p!.y).toBeLessThan(box.height);
  });
});
