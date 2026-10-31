// Contrast of the role pairs in both themes, and no literal colour outside the design values
// (specs/003-visual-design-pass/contracts/design-tokens.md).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Theme = 'light' | 'dark';
type Values = Record<string, string>;

/** Custom properties declared directly in the first block whose selector matches. */
function block(css: string, selector: RegExp): Values {
  const match = selector.exec(css);
  if (!match) throw new Error(`block not found: ${selector}`);
  const start = css.indexOf('{', match.index) + 1;
  let depth = 1;
  let end = start;
  while (depth > 0) {
    if (css[end] === '{') depth++;
    if (css[end] === '}') depth--;
    end++;
  }
  const values: Values = {};
  for (const [, name, value] of css.slice(start, end - 1).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    values[name!] = value!.trim();
  return values;
}

const escape = (s: string) => s.replace(/[[\]().*+?^$|\\]/g, '\\$&');

/**
 * Light and dark values of a stylesheet whose blocks start with `root` (`:root`, or
 * `:root[data-style='…']` for a candidate style laid over `base`); the two dark blocks must agree.
 */
function themes(css: string, root = ':root', base?: Record<Theme, Values>): Record<Theme, Values> {
  const r = escape(root);
  const own = block(css, new RegExp(`^${r}\\s*\\{`, 'm'));
  const system = block(css, new RegExp(`${r}:not\\(\\[data-theme='light'\\]\\)\\s*\\{`));
  const chosen = block(css, new RegExp(`${r}\\[data-theme='dark'\\]\\s*\\{`));
  expect(system, 'the two dark blocks differ').toEqual(chosen);
  const light = { ...base?.light, ...own };
  return { light, dark: { ...base?.dark, ...light, ...chosen } };
}

function resolve(values: Values, name: string, seen: string[] = []): string {
  if (seen.includes(name)) throw new Error(`circular: ${[...seen, name].join(' -> ')}`);
  const value = values[name];
  if (value === undefined) throw new Error(`undefined: ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(values, ref[1]!, [...seen, name]) : value;
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1]!.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [foreground, backgrounds, threshold]
const PAIRS: [string, string[], number][] = [
  ['--color-text', ['--color-bg', '--color-surface', '--color-surface-raised'], 4.5],
  ['--color-muted', ['--color-bg', '--color-surface'], 4.5],
  ['--color-accent-text', ['--color-bg', '--color-surface'], 4.5],
  ['--color-on-accent', ['--color-accent'], 4.5],
  ['--color-ongoing', ['--color-surface'], 3],
  ['--color-border-strong', ['--color-bg', '--color-surface'], 3],
  ['--color-focus', ['--color-bg', '--color-surface'], 3],
];

const TOKENS = 'src/styles/tokens.css';
const site = themes(readFileSync(TOKENS, 'utf8'));

/** The site's values, plus the candidate styles while their mockups exist (spec 003, US1). */
const STYLESHEETS: [string, Record<Theme, Values>][] = [
  [TOKENS, site],
  ...['atelier', 'bureau', 'tour']
    .map((style) => `mockups/styles/${style}.css`)
    .filter((file) => existsSync(file))
    .map((file): [string, Record<Theme, Values>] => {
      const style = file.match(/(\w+)\.css$/)![1];
      return [file, themes(readFileSync(file, 'utf8'), `:root[data-style='${style}']`, site)];
    }),
];

describe.each(STYLESHEETS)('%s', (_, values) => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bgs, min] of PAIRS) {
      for (const bg of bgs) {
        it(`${theme}: ${fg} on ${bg} ≥ ${min}:1`, () => {
          const ratio = contrast(resolve(values[theme], fg), resolve(values[theme], bg));
          expect(ratio).toBeGreaterThanOrEqual(min);
        });
      }
    }
  }
});

// Files where literal colours are expected: light and sky colours of the scene, materials of
// the 3D objects built in code, and the share image (contracts/scene-ambiance.md).
const EXEMPT = new Set([
  'src/styles/tokens.css',
  'src/scene/ambiance.ts',
  'src/scene/objects.ts',
  'src/scene/room.ts',
  'src/pages/og/[lang].png.ts',
]);
const LITERAL = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b|\brgba?\(|\bhsla?\(/i;

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name).split('\\').join('/');
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(css|astro|ts)$/.test(name) ? [path] : [];
  });

describe('literal colours', () => {
  it('only the design values and the exempt files hold colours', () => {
    const found = sources('src')
      .filter((file) => !EXEMPT.has(file))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .flatMap((line, i) => (LITERAL.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
      );
    expect(found).toEqual([]);
  });
});
