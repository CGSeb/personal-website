// Size budget of the 3D scene (contracts/scene-model.md, SC-002): each model file and baked
// texture against its budget, and everything the scene page needs before the first interaction
// (page, styles, scene JavaScript, models, baked textures, project images) at 3 MB compressed at
// most.
// Run after `npm run build`: node scripts/check-scene-budget.mjs [dist]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = process.argv[2] ?? 'dist';
const KB = 1024;
const MB = 1024 * KB;
const TOTAL_BUDGET = 3 * MB;
const errors = [];
const rows = [];

const allFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });

const format = (bytes) =>
  bytes >= MB ? `${(bytes / MB).toFixed(2)} Mo` : `${Math.round(bytes / KB)} Ko`;

// 1. Model files, against their budgets. .glb files are already compressed (Meshopt, WebP).
const modelBudget = (path) => {
  if (path === 'room.glb') return 1.5 * MB;
  if (path === 'generic-project.glb') return 150 * KB;
  if (path.startsWith('featured/')) return 300 * KB;
  return 100 * KB;
};
const modelsDir = join(dist, 'models');
const models = existsSync(modelsDir)
  ? allFiles(modelsDir)
      .filter((f) => f.endsWith('.glb'))
      .map((f) => ({ path: relative(modelsDir, f).split(sep).join('/'), size: statSync(f).size }))
  : [];
for (const { path, size } of models) {
  const budget = modelBudget(path);
  rows.push([`models/${path}`, size, budget]);
  if (size > budget) errors.push(`models/${path} : ${format(size)} > ${format(budget)}`);
}

// Baked lighting of the room (room-day.webp, room-night.webp, spec 003): both are loaded with
// the room, so the switch to night needs no request.
const TEXTURE_BUDGET = 512 * KB;
const textures = existsSync(modelsDir)
  ? allFiles(modelsDir)
      .filter((f) => f.endsWith('.webp'))
      .map((f) => ({ path: relative(modelsDir, f).split(sep).join('/'), size: statSync(f).size }))
  : [];
for (const { path, size } of textures) {
  rows.push([`models/${path}`, size, TEXTURE_BUDGET]);
  if (size > TEXTURE_BUDGET)
    errors.push(`models/${path} : ${format(size)} > ${format(TEXTURE_BUDGET)}`);
}

// 2. What the scene page loads before the first interaction, per language. Text resources
// count gzip-compressed, as served.
const gzipped = (file) => gzipSync(readFileSync(file)).length;
const asset = (url) => join(dist, url.replace(/^\//, ''));

/** The page's module scripts and every chunk they import, statically or dynamically. */
function scriptGraph(entries) {
  const seen = new Set();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    for (const [, spec] of code.matchAll(
      /(?:from|import)\s*\(?\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g,
    )) {
      queue.push(join(file, '..', spec));
    }
  }
  return [...seen];
}

for (const page of ['fr/explorer', 'en/explore']) {
  const htmlFile = join(dist, page, 'index.html');
  if (!existsSync(htmlFile)) {
    errors.push(`${page} : page de la scène absente de ${dist}`);
    continue;
  }
  const html = readFileSync(htmlFile, 'utf8');
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(([, u]) => u);
  const scripts = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map(([, u]) => u);
  const chunks = scriptGraph(scripts.map(asset));
  const manifest = /<script type="application\/json" id="scene-manifest">(.*?)<\/script>/s.exec(
    html,
  )?.[1];
  const images = manifest
    ? [...new Set(JSON.parse(manifest).flatMap((i) => (i.image ? [i.image] : [])))]
    : [];

  const js = chunks.reduce((sum, f) => sum + gzipped(f), 0);
  const parts = {
    page: gzipSync(html).length,
    styles: styles.reduce((sum, u) => sum + gzipped(asset(u)), 0),
    js,
    models: models.reduce((sum, m) => sum + m.size, 0),
    textures: textures.reduce((sum, t) => sum + t.size, 0),
    images: images.reduce(
      (sum, u) => sum + (existsSync(asset(u)) ? statSync(asset(u)).size : 0),
      0,
    ),
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  rows.push([`/${page}/ : JavaScript de la scène (${chunks.length} fichiers)`, js]);
  rows.push([`/${page}/ : total avant interaction`, total, TOTAL_BUDGET]);
  if (total > TOTAL_BUDGET)
    errors.push(
      `/${page}/ : ${format(total)} avant la première interaction > ${format(TOTAL_BUDGET)} ` +
        `(${Object.entries(parts)
          .map(([k, v]) => `${k} ${format(v)}`)
          .join(', ')})`,
    );
}

for (const [name, size, budget] of rows) {
  console.log(
    `${size <= (budget ?? Infinity) ? '✓' : '✗'} ${name} : ${format(size)}${budget ? ` / ${format(budget)}` : ''}`,
  );
}
if (errors.length) {
  console.error(`\n${errors.length} dépassement(s) de budget :\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('\nBudgets de la scène respectés.');
