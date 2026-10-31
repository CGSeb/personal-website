// Scene 002 — US1 (panels from the scene) and US2 (learn more, state restore).
import { expect, test, type Page } from '@playwright/test';

test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, 'the 3D needs JavaScript');

/** Waits for the test hook (installed once the page is idle) and for the scene. */
async function sceneReady(page: Page) {
  await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
  await page.evaluate(() => window.__scene!.ready);
}

/** Opens the scene with the test hook enabled and waits until it is ready; unfolds the list
 * of items (folded by default) so the tests can use it. */
async function openScene(page: Page, path = '/fr/explorer/') {
  await page.addInitScript(() => {
    window.__sceneTest = true;
  });
  await page.goto(path);
  await expect(page.locator('#scene canvas')).toBeVisible({ timeout: 30_000 });
  await sceneReady(page);
  await page.locator('.scene-list summary').click();
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
    await clickObject(page, 'education/exia-cesi');
    await expect(page.locator('#panel-education-exia-cesi')).toBeVisible();
    await expect(page.locator('#panel-education-exia-cesi')).toContainText('Bac+5');
    // The open panel may cover other objects on small screens: close it first.
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel-education-exia-cesi')).toBeHidden();
    await clickObject(page, 'experience/cg-seb');
    await expect(page.locator('#panel-experience-cg-seb')).toBeVisible();
    await expect(page.locator('#panel-experience-cg-seb')).toContainText('Depuis');
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
      .getByRole('button', { name: 'Ingénieur conception logicielle' })
      .click();
    await expect(page.locator('#panel-education-exia-cesi')).toBeVisible();
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
    await openScene(page, '/en/explore/#education/exia-cesi');
    const panel = page.locator('#panel-education-exia-cesi');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
      'href',
      '/en/career/education/exia-cesi/',
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

test.describe('keyboard, screen readers and languages (US5)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard navigation is a desktop journey');

  test('Tab moves through the list and highlights each object in the scene (US5-1)', async ({
    page,
  }) => {
    await openScene(page);
    const list = page.locator('.scene-list button');
    const keys = await list.evaluateAll((buttons) =>
      buttons.map((b) => b.getAttribute('data-key')),
    );
    expect(keys.slice(0, 3)).toEqual([
      'project/lesson-folk',
      'project/portfolio-3d',
      'project/voxelshift',
    ]);
    await list.first().focus();
    for (const key of keys.slice(0, 4)) {
      await expect(page.locator(`.scene-list button[data-key="${key}"]`)).toBeFocused();
      await expect.poll(() => page.evaluate(() => window.__scene!.highlighted())).toBe(key);
      await page.keyboard.press('Tab');
    }
    // A visible focus ring on the buttons.
    await list.first().focus();
    const outline = await list.first().evaluate((b) => getComputedStyle(b).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('Enter opens and focuses the panel, Escape closes it and returns focus (US5-2)', async ({
    page,
  }) => {
    await openScene(page);
    const button = page.locator('.scene-list button[data-key="education/exia-cesi"]');
    await button.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('#panel-education-exia-cesi');
    await expect(panel).toBeVisible();
    await expect(panel).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('panels and the scene are announced (US5-3)', async ({ page }) => {
    await openScene(page);
    await expect(page.locator('#scene')).toHaveAttribute('role', 'application');
    await expect(page.locator('#scene')).toHaveAttribute('aria-label', /Scène 3D du portfolio/);
    await page.locator('.scene-list').getByRole('button', { name: 'LessonFolk' }).click();
    await expect(page.getByRole('dialog', { name: 'LessonFolk' })).toBeVisible();
    await expect(page.locator('[data-announce]')).toHaveText('LessonFolk ouvert');
  });

  test('the language switcher keeps the open item (US5-4, FR-018)', async ({ page }) => {
    await openScene(page);
    await page
      .locator('.scene-list')
      .getByRole('button', { name: 'Ingénieur conception logicielle' })
      .click();
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toHaveAttribute('href', '/en/explore/#education/exia-cesi');
    await switcher.click();
    await sceneReady(page);
    await expect(page).toHaveURL(/\/en\/explore\/#education\/exia-cesi$/);
    await expect(page.locator('#panel-education-exia-cesi')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

// Spec 003 — US3: the room in the chosen style, by day and by night.
test.describe('day and night (spec 003, US3)', () => {
  test('the theme button turns the room to night and back, panel and view kept', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await openScene(page);
    expect(await page.evaluate(() => window.__scene!.ambiance())).toBe('day');
    await page.locator('.scene-list').getByRole('button', { name: 'LessonFolk' }).click();
    const panel = page.locator('#panel-project-lesson-folk');
    await expect(panel).toBeVisible();
    // Let the camera finish bringing the object into view.
    await expect
      .poll(async () => {
        const a = await objectPoint(page, 'project/lesson-folk');
        await page.waitForTimeout(100);
        const b = await objectPoint(page, 'project/lesson-folk');
        return Math.hypot(a.x - b.x, a.y - b.y);
      })
      .toBeLessThan(1);
    const before = await page.evaluate(() => window.__scene!.screenPosition('project/lesson-folk'));
    // The header's button: on phones the panel is a sheet over the scene's own button.
    const toggle = page.locator('.site-header .theme-toggle');

    // system (light) -> light -> dark: night.
    await toggle.click();
    await toggle.click();
    await expect.poll(() => page.evaluate(() => window.__scene!.ambiance())).toBe('night');
    await expect.poll(() => page.evaluate(() => window.__scene!.fading())).toBe(false);
    // dark -> system (light): day again.
    await toggle.click();
    await expect.poll(() => page.evaluate(() => window.__scene!.ambiance())).toBe('day');

    await expect(panel).toBeVisible();
    await expect(page).toHaveURL(/#projet\/lesson-folk$/);
    const after = await page.evaluate(() => window.__scene!.screenPosition('project/lesson-folk'));
    expect(Math.hypot(after!.x - before!.x, after!.y - before!.y)).toBeLessThan(1);
    expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(1);
  });

  test('with reduced motion the switch is instant', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__sceneTest = true;
    });
    await page.goto('/fr/explorer/');
    // Reduced motion asks first (choice screen).
    await page.getByRole('button', { name: 'Continuer en 3D' }).click();
    await sceneReady(page);
    const toggle = page.locator('.site-header .theme-toggle');
    await toggle.click();
    await toggle.click();
    const state = await page.evaluate(() => ({
      ambiance: window.__scene!.ambiance(),
      fading: window.__scene!.fading(),
    }));
    expect(state).toEqual({ ambiance: 'night', fading: false });
  });

  test('the room has its slots, lamps and baked mesh', async ({ page }) => {
    await openScene(page);
    const nodes = await page.evaluate(() => window.__scene!.roomNodes());
    for (const name of [
      'room.baked',
      'featured.lesson-folk',
      'featured.portfolio-3d',
      'featured.voxelshift',
      'slot.project.01',
      'slot.education.01',
      'slot.education.02',
      'slot.experience.01',
      'light.lamp.01',
      'camera.home',
      'bounds',
    ]) {
      expect(nodes, name).toContain(name);
    }
  });
});

test('the list of items is folded under its title, and unfolds with it (spec 003)', async ({
  page,
}) => {
  await page.goto('/fr/explorer/');
  const summary = page.locator('.scene-list summary');
  await expect(summary).toContainText('Tous les éléments de la scène');
  const item = page.locator('.scene-list').getByText('LessonFolk');
  await expect(item).toBeHidden();
  await summary.click();
  await expect(item).toBeVisible();
  await summary.click();
  await expect(item).toBeHidden();
});
