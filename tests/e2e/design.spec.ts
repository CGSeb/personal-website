// User Story 2 of spec 003 — every page type of the written version in the chosen style, in
// both languages and both themes; narrow screens, no JavaScript, print and forced colours.
import { expect, test, type Page } from '@playwright/test';

const PAGES = {
  fr: {
    home: '/fr/',
    projects: '/fr/projets/',
    category: '/fr/projets/categorie/web/',
    project: '/fr/projets/lesson-folk/',
    career: '/fr/parcours/',
    diploma: '/fr/parcours/diplomes/exia-cesi/',
    experience: '/fr/parcours/experiences/cg-seb/',
    contact: '/fr/contact/',
    notFound: '/fr/page-introuvable/',
  },
  en: {
    home: '/en/',
    projects: '/en/projects/',
    category: '/en/projects/category/web/',
    project: '/en/projects/lesson-folk/',
    career: '/en/career/',
    diploma: '/en/career/education/exia-cesi/',
    experience: '/en/career/experience/cg-seb/',
    contact: '/en/contact/',
    notFound: '/en/page-not-found/',
  },
};

const ALL = Object.values(PAGES).flatMap((byType) => Object.entries(byType));

// A role resolved to a computed colour, through a probe element, to compare with what the page
// actually paints.
const role = (page: Page, name: string) =>
  page.evaluate((v) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${v})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);

const painted = (page: Page) =>
  page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    h1: getComputedStyle(document.querySelector('h1')!).color,
  }));

test.describe('page colours follow the roles of the theme', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'one browser is enough');
  });

  for (const [type, path] of ALL) {
    test(`${path} (${type})`, async ({ page }) => {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const { bg, h1 } = await painted(page);
        expect(bg, `${colorScheme} background`).toBe(await role(page, '--color-bg'));
        expect(h1, `${colorScheme} h1`).toBe(await role(page, '--color-text'));
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
          colorScheme,
        );
      }
    });
  }
});

test('no horizontal scroll at 320 px', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-320', 'run by the 320 px project');
  for (const [, path] of ALL) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('without JavaScript a dark system gives a dark page with working links', async ({
  page,
  javaScriptEnabled,
}) => {
  test.skip(javaScriptEnabled, 'only meaningful with JavaScript disabled');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/fr/');
  expect((await painted(page)).bg).toBe(await role(page, '--color-bg'));
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark',
  );
  await expect(page.locator('.theme-toggle:visible')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Parcours' }).click();
  await expect(page).toHaveURL(/\/fr\/parcours\/$/);
});

test.describe('print and forced colours', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop-chromium', 'one browser is enough');
  });

  test('print: dark text on white, no header nor theme button', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', media: 'print' });
    await page.goto('/en/projects/lesson-folk/');
    const { bg, h1 } = await painted(page);
    expect(bg).toBe('rgb(255, 255, 255)');
    expect(h1).toBe('rgb(0, 0, 0)');
    await expect(page.locator('header').first()).toBeHidden();
    await expect(page.locator('.theme-toggle:visible')).toHaveCount(0);
  });

  test('forced colours: card borders and the focus ring stay visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/en/projects/');
    const card = page.locator('.project-card').first();
    const border = await card.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.borderTopStyle, width: parseFloat(s.borderTopWidth) };
    });
    expect(border.style).not.toBe('none');
    expect(border.width).toBeGreaterThan(0);

    await card.getByRole('link').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const outline = await card.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThan(0);
  });
});

test('links to other sites open in a new tab, with a note for screen readers', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'one browser is enough');
  let checked = 0;
  for (const [, path] of ALL) {
    await page.goto(path);
    const links = await page
      .locator('main a[href^="http"]')
      .evaluateAll((els) =>
        els.map((a) => ({
          href: a.getAttribute('href'),
          target: a.getAttribute('target'),
          rel: a.getAttribute('rel') ?? '',
          note: a.querySelector('.visually-hidden')?.textContent?.trim() ?? '',
        })),
      );
    for (const link of links) {
      expect(link.target, `${path} ${link.href}`).toBe('_blank');
      expect(link.rel, `${path} ${link.href}`).toContain('noopener');
      expect(link.note, `${path} ${link.href}`).toMatch(/onglet|tab/);
    }
    checked += links.length;
  }
  expect(checked).toBeGreaterThan(0);
});

test('the header offers the 3D version as a raised button, apart from the links', async ({
  page,
}) => {
  for (const [path, label, href] of [
    ['/fr/projets/', 'Explorer en 3D', '/fr/explorer/'],
    ['/en/career/', 'Explore in 3D', '/en/explore/'],
  ] as const) {
    await page.goto(path);
    const button = page.getByRole('navigation').getByRole('link', { name: label });
    await expect(button).toHaveAttribute('href', href);
    await expect(button).toHaveClass(/nav-3d/);
    const look = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, shadow: s.boxShadow };
    });
    expect(look.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(look.shadow).not.toBe('none');
  }
});
