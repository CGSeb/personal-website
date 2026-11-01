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

  test(
    'every object still opens its panel, never the bubble (FR-004, SC-006)',
    { tag: '@narrow' },
    async ({ page, isMobile }) => {
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
    },
  );
});

const FR_WELCOME =
  'Bonjour, c’est Sébastien, bienvenue sur mon portfolio 3D. Navigue dans la pièce pour la découvrir.';
const EN_WELCOME =
  'Hi, it’s Sébastien, welcome to my 3D portfolio. Move around the room to discover it.';

const bubbleOf = (page: Page) => page.locator('[data-avatar-bubble]');
const entryOf = (page: Page) => page.locator('[data-avatar-entry] button');
const waving = (page: Page) => page.evaluate(() => window.__scene!.avatar().waving);

/** Unfolds the list of items (folded by default). */
const unfoldList = (page: Page) => page.locator('.scene-list summary').click();

/** No more frames are being drawn: the count stays the same for a while. */
async function framesSettled(page: Page) {
  await expect
    .poll(async () => {
      const before = await page.evaluate(() => window.__scene!.frames());
      await page.waitForTimeout(300);
      return (await page.evaluate(() => window.__scene!.frames())) - before;
    })
    .toBe(0);
}

/** The whole of `inner` lies inside `outer`. */
function expectInside(
  inner: { x: number; y: number; width: number; height: number },
  outer: { x: number; y: number; width: number; height: number },
) {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - 1);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - 1);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 1);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + 1);
}

test.describe('the wave and the bubble (US2)', () => {
  test('hovering waves once and opens nothing (FR-008)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no hover on touch screens');
    await openScene(page);
    const { x, y } = await objectPoint(page, AVATAR);
    await page.mouse.move(x, y);
    await expect.poll(() => waving(page)).toBe(true);

    // Leaving and coming back in the middle of the gesture neither restarts nor stacks one.
    // Counted, not timed: slow frames on a busy test machine say nothing about the gesture, whose
    // length is checked in tests/unit/scene-wave.test.ts.
    await page.mouse.move(2, 2);
    await page.mouse.move(x, y);
    await expect(page.locator('.scene-tooltip')).toHaveText('Sébastien');
    await expect.poll(() => waving(page), { timeout: 15_000 }).toBe(false);
    expect(await page.evaluate(() => window.__scene!.avatar().waves)).toBe(1);
    await expect(bubbleOf(page)).toBeHidden();
  });

  test('a click or a tap waves and opens the bubble: the text, one button, no link (FR-009, FR-012, FR-013)', async ({
    page,
    isMobile,
  }) => {
    await openScene(page);
    await select(page, AVATAR, isMobile);
    await expect(bubbleOf(page)).toBeVisible();
    await expect(bubbleOf(page).locator('p')).toHaveText(FR_WELCOME);
    await expect(bubbleOf(page).getByRole('button')).toHaveCount(1);
    await expect(bubbleOf(page).getByRole('button', { name: 'Fermer' })).toBeVisible();
    await expect(bubbleOf(page).locator('a')).toHaveCount(0);
    await expect(page).toHaveURL(/#bienvenue$/);
    await expect(page.getByRole('dialog', { name: /Bonjour/ })).toBeVisible();
    // No panel behind it.
    await expect(page.locator('.scene-panel:visible')).toHaveCount(0);
  });

  test('the bubble speaks English on the English page (FR-014)', async ({ page, isMobile }) => {
    await openScene(page, '/en/explore/');
    await select(page, AVATAR, isMobile);
    await expect(bubbleOf(page).locator('p')).toHaveText(EN_WELCOME);
    await expect(bubbleOf(page).getByRole('button', { name: 'Close' })).toBeVisible();
    await expect(page).toHaveURL(/#welcome$/);
  });

  test(
    'it follows the head, stays inside, and closes when the figure leaves the view (FR-015)',
    { tag: '@narrow' },
    async ({ page, isMobile }) => {
      test.skip(isMobile, 'the mouse wheel and the drag need a mouse');
      await openScene(page);
      await select(page, AVATAR, false);
      await expect(bubbleOf(page)).toBeVisible();
      const scene = (await page.locator('.scene-wrap').boundingBox())!;
      const before = (await bubbleOf(page).boundingBox())!;

      const { x, y } = await objectPoint(page, AVATAR);
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, -300);
      await expect
        .poll(async () => {
          const now = (await bubbleOf(page).boundingBox())!;
          return Math.hypot(now.x - before.x, now.y - before.y);
        })
        .toBeGreaterThan(1);
      expectInside((await bubbleOf(page).boundingBox())!, scene);

      // Drag the view, zoomed in, until the figure is out of it.
      await page.mouse.wheel(0, -2000);
      for (let i = 0; i < 12 && (await bubbleOf(page).isVisible()); i++) {
        const left = scene.x + scene.width * 0.1;
        const top = scene.y + scene.height * 0.9;
        await page.mouse.move(left, top);
        await page.mouse.down();
        await page.mouse.move(left + scene.width * 0.8, top - scene.height * 0.8, { steps: 4 });
        await page.mouse.up();
        if (await bubbleOf(page).isVisible())
          expectInside((await bubbleOf(page).boundingBox())!, scene);
      }
      await expect(bubbleOf(page)).toBeHidden();
      await expect(page).not.toHaveURL(/#/);
    },
  );

  test('its button, Escape, a click outside and the figure close it (FR-016)', async ({
    page,
    isMobile,
  }) => {
    await openScene(page);
    const bubble = bubbleOf(page);
    const closed = async () => {
      await expect(bubble).toBeHidden();
      await expect(page).not.toHaveURL(/#/);
    };

    await select(page, AVATAR, isMobile);
    await expect(bubble).toBeVisible();
    await bubble.getByRole('button', { name: 'Fermer' }).click();
    await closed();

    await select(page, AVATAR, isMobile);
    await expect(bubble).toBeVisible();
    await page.keyboard.press('Escape');
    await closed();

    await select(page, AVATAR, isMobile);
    await expect(bubble).toBeVisible();
    await page.locator('main h1').click();
    await closed();

    // An empty part of the canvas, then the figure itself.
    await select(page, AVATAR, isMobile);
    await expect(bubble).toBeVisible();
    const scene = (await page.locator('#scene').boundingBox())!;
    const corner = { x: scene.x + 6, y: scene.y + scene.height - 6 };
    if (isMobile) await page.touchscreen.tap(corner.x, corner.y);
    else await page.mouse.click(corner.x, corner.y);
    await closed();

    await select(page, AVATAR, isMobile);
    await expect(bubble).toBeVisible();
    await select(page, AVATAR, isMobile);
    await closed();
  });

  test('one of bubble or panel at a time, each with its own fragment (FR-016)', async ({
    page,
  }) => {
    await openScene(page);
    await unfoldList(page);
    const panel = page.locator('#panel-project-lesson-folk');
    const list = page.locator('.scene-list');

    await entryOf(page).click();
    await expect(bubbleOf(page)).toBeVisible();
    await list.getByRole('button', { name: 'LessonFolk' }).click();
    await expect(panel).toBeVisible();
    await expect(panel).toBeFocused();
    await expect(bubbleOf(page)).toBeHidden();
    await expect(page).toHaveURL(/#projet\/lesson-folk$/);

    await entryOf(page).click();
    await expect(bubbleOf(page)).toBeVisible();
    await expect(bubbleOf(page)).toBeFocused();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/#bienvenue$/);
  });

  test('selecting another object closes the bubble and opens its panel (US2-5)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the bubble may cover the object on a small screen');
    await page.setViewportSize({ width: 1280, height: 800 });
    await openScene(page);
    await select(page, AVATAR, false);
    await expect(bubbleOf(page)).toBeVisible();
    await select(page, 'experience/cg-seb', false);
    await expect(page.locator('#panel-experience-cg-seb')).toBeVisible();
    await expect(bubbleOf(page)).toBeHidden();
    await expect(page).toHaveURL(/#experience\/cg-seb$/);
  });

  test('changing language keeps it open, in the other language, without a wave (FR-017)', async ({
    page,
    isMobile,
  }) => {
    await openScene(page);
    await select(page, AVATAR, isMobile);
    await expect(bubbleOf(page)).toBeVisible();
    const switcher = page.locator('.language-switcher');
    await expect(switcher).toHaveAttribute('href', '/en/explore/#welcome');
    await switcher.click();
    await expect(page).toHaveURL(/\/en\/explore\/#welcome$/);
    await page.waitForFunction(() => window.__scene?.avatar().shown, null, { timeout: 30_000 });
    await expect(bubbleOf(page)).toBeVisible();
    await expect(bubbleOf(page).locator('p')).toHaveText(EN_WELCOME);
    expect(await waving(page)).toBe(false);
    // And back: the link carries the fragment of the other language, until the bubble closes.
    await expect(page.locator('.language-switcher')).toHaveAttribute(
      'href',
      '/fr/explorer/#bienvenue',
    );
    await bubbleOf(page).getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.language-switcher')).toHaveAttribute('href', '/fr/explorer/');
  });

  test('changing theme keeps it open (FR-017, FR-018)', async ({ page, isMobile }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openScene(page);
    await select(page, AVATAR, isMobile);
    await expect(bubbleOf(page)).toBeVisible();
    const toggle = page.locator('.site-header .theme-toggle');
    await toggle.click();
    await toggle.click();
    await expect.poll(() => page.evaluate(() => window.__scene!.ambiance())).toBe('night');
    await expect(bubbleOf(page)).toBeVisible();
    await expect(page).toHaveURL(/#bienvenue$/);
  });
});

test.describe('the same access for everyone (US3)', () => {
  test('the list entry works at the keyboard, and gives the focus back (FR-019, FR-020)', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'keyboard navigation is a desktop journey');
    await openScene(page);
    await unfoldList(page);
    const entry = entryOf(page);
    await expect(entry).toHaveText('Sébastien');
    await entry.focus();
    await expect.poll(() => page.evaluate(() => window.__scene!.highlighted())).toBe(AVATAR);
    await page.keyboard.press('Enter');
    await expect(bubbleOf(page)).toBeVisible();
    await expect(bubbleOf(page)).toBeFocused();
    await expect(entry).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Tab');
    await expect(bubbleOf(page).getByRole('button', { name: 'Fermer' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(bubbleOf(page)).toBeHidden();
    await expect(entry).toBeFocused();
    await expect(entry).not.toHaveAttribute('aria-current');
  });

  test('with reduced motion there is no wave, and selecting opens the bubble (FR-011)', async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__sceneTest = true;
    });
    await page.goto('/fr/explorer/');
    await page.getByRole('button', { name: 'Continuer en 3D' }).click();
    await page.waitForFunction(() => window.__scene?.avatar().shown, null, { timeout: 30_000 });
    const { x, y } = await objectPoint(page, AVATAR);
    if (!isMobile) {
      await page.mouse.move(x, y);
      await expect(page.locator('.scene-tooltip')).toHaveText('Sébastien');
      expect(await waving(page)).toBe(false);
    }
    await select(page, AVATAR, isMobile);
    await expect(bubbleOf(page)).toBeVisible();
    expect(await waving(page)).toBe(false);
  });
});

test.describe('nothing to pay for it (US4)', () => {
  test('no frame at rest, nor in the second after a wave (FR-010, SC-005)', async ({
    page,
    isMobile,
  }) => {
    await openScene(page);
    await framesSettled(page);
    const rest = await page.evaluate(() => window.__scene!.frames());
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.__scene!.frames())).toBe(rest);

    const { x, y } = await objectPoint(page, AVATAR);
    if (isMobile) await page.touchscreen.tap(x, y);
    else await page.mouse.move(x, y);
    await expect.poll(() => waving(page)).toBe(true);
    await expect.poll(() => waving(page), { timeout: 15_000 }).toBe(false);
    // The last frame asked by the gesture is drawn on the next animation frame, later on a busy
    // test machine.
    await framesSettled(page);
    const after = await page.evaluate(() => window.__scene!.frames());
    expect(after).toBeGreaterThan(rest);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.__scene!.frames())).toBe(after);
  });

  test('when its file fails, the scene stays usable, without entry or bubble (FR-022)', async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/models/avatar.glb', (route) => route.abort());
    const asked = page.waitForRequest('**/models/avatar.glb');
    await page.addInitScript(() => {
      window.__sceneTest = true;
    });
    // The fragment of the bubble is ignored without a figure.
    await page.goto('/fr/explorer/#bienvenue');
    await page.waitForFunction(() => window.__scene !== undefined, null, { timeout: 30_000 });
    await page.evaluate(() => window.__scene!.ready);
    await asked;
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.__scene!.avatar().shown)).toBe(false);
    await expect(bubbleOf(page)).toBeHidden();
    await expect(page.locator('#scene')).toHaveAttribute('aria-busy', 'false');
    await unfoldList(page);
    await expect(page.locator('[data-avatar-entry]')).toBeHidden();
    expect(await page.evaluate(() => window.__scene!.screenPosition('avatar'))).toBeNull();
    await select(page, 'project/lesson-folk', isMobile);
    await expect(page.locator('#panel-project-lesson-folk')).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const [path, text] of [
    ['/fr/explorer/', FR_WELCOME],
    ['/en/explore/', EN_WELCOME],
  ] as const) {
    test(`at 320 px the whole bubble fits, clear of the controls: ${path} (SC-007)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await openScene(page, path);
      await unfoldList(page);
      await entryOf(page).click();
      await expect(bubbleOf(page).locator('p')).toHaveText(text);
      // Let the camera finish bringing the figure into view.
      await objectPoint(page, AVATAR);
      const bubble = (await bubbleOf(page).boundingBox())!;
      expectInside(bubble, (await page.locator('.scene-wrap').boundingBox())!);
      const toolbar = (await page.locator('.scene-toolbar').boundingBox())!;
      expect(bubble.y + bubble.height).toBeLessThanOrEqual(toolbar.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }

  test('the bubble shows less than 100 ms after the selection (SC-007)', async ({ page }) => {
    await openScene(page);
    await unfoldList(page);
    const elapsed = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>('[data-avatar-entry] button')!;
      const bubble = document.querySelector<HTMLElement>('[data-avatar-bubble]')!;
      const start = performance.now();
      button.click();
      return bubble.offsetWidth > 0 ? performance.now() - start : Infinity;
    });
    expect(elapsed).toBeLessThan(100);
  });
});
