// SEO and semantic HTML check of the built site (FR-016 to FR-018, FR-020, SC-003).
// Run after `npm run build`: node scripts/check-seo.mjs [dist]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const errors = [];
const fail = (page, message) => errors.push(`${page} : ${message}`);

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });

// Titles and descriptions must be unique within a language: a project may keep the same
// name in French and English.
// dist/fr/projets/index.html -> /fr/projets/
const pagePath = (file) =>
  `/${relative(dist, file).split(sep).join('/')}`
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '');

const attr = (html, regex) => html.match(regex)?.[1];
const count = (html, regex) => (html.match(regex) ?? []).length;

const titles = new Map();
const descriptions = new Map();
const pages = [];

for (const file of htmlFiles(dist)) {
  const page = pagePath(file);
  const html = readFileSync(file, 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue; // redirect pages
  if (page === '/404') continue; // not indexed
  pages.push(page);

  const lang = attr(html, /<html lang="([a-z]+)"/) ?? '?';
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const description = attr(html, /<meta name="description" content="([^"]*)"/);
  if (!title) fail(page, 'pas de <title>');
  else if (titles.has(`${lang}|${title}`))
    fail(page, `<title> déjà utilisé par ${titles.get(`${lang}|${title}`)}`);
  else titles.set(`${lang}|${title}`, page);
  if (!description) fail(page, 'pas de meta description');
  else if (descriptions.has(`${lang}|${description}`))
    fail(page, `meta description déjà utilisée par ${descriptions.get(`${lang}|${description}`)}`);
  else descriptions.set(`${lang}|${description}`, page);

  if (!/<html lang="(fr|en)"/.test(html)) fail(page, '<html lang> manquant');
  if (!/<link rel="canonical" href="[^"]+"/.test(html)) fail(page, 'pas d’URL canonique');
  for (const lang of ['fr', 'en', 'x-default']) {
    if (!html.includes(`hreflang="${lang}"`)) fail(page, `pas de lien hreflang="${lang}"`);
  }

  // The root page only redirects; content pages carry the full set.
  if (page === '/') continue;
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!html.includes(`property="${property}"`)) fail(page, `pas de ${property}`);
  }
  const h1 = count(html, /<h1[\s>]/g);
  if (h1 !== 1) fail(page, `${h1} <h1> au lieu d’un seul`);
  for (const tag of ['<main', '<nav', '<header', '<footer']) {
    if (!html.includes(tag)) fail(page, `pas de ${tag}>`);
  }
  // Heading levels never skip one going down (h2 -> h4).
  let previous = 1;
  for (const [, level] of html.matchAll(/<h([1-6])[\s>]/g)) {
    if (Number(level) > previous + 1) fail(page, `titre h${level} après h${previous}`);
    previous = Number(level);
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(img)) fail(page, `image sans attribut alt : ${img.slice(0, 80)}`);
  }
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (ld.length === 0) fail(page, 'pas de JSON-LD');
  for (const [, json] of ld) {
    try {
      const data = JSON.parse(json);
      if (data['@context'] !== 'https://schema.org') fail(page, 'JSON-LD sans @context schema.org');
    } catch (e) {
      fail(page, `JSON-LD illisible : ${e.message}`);
    }
  }
}

// Sitemap: exactly the HTML pages (SC-003).
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const locs = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname),
);
for (const page of pages) if (!locs.has(page)) fail(page, 'absente du sitemap');
for (const loc of locs)
  if (!pages.includes(loc)) fail(loc, 'dans le sitemap mais pas de page HTML');

for (const file of ['robots.txt', 'llms.txt', 'llms-full.txt']) {
  try {
    if (!readFileSync(join(dist, file), 'utf8').trim()) fail(`/${file}`, 'vide');
  } catch {
    fail(`/${file}`, 'manquant');
  }
}

// Style mockups of spec 003 are served by `astro dev` only (contracts/mockups.md, FR-004).
const MOCKUP = /_maquettes|room-atelier|room-bureau|room-tour/;
const allFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
for (const file of allFiles(dist)) {
  const where = `/${relative(dist, file).split(sep).join('/')}`;
  if (MOCKUP.test(where)) fail(where, 'fichier de maquette dans la construction');
  else if (/\.(html|xml|txt|js|css|json)$/.test(file) && MOCKUP.test(readFileSync(file, 'utf8')))
    fail(where, 'renvoie vers une maquette');
}

if (errors.length) {
  console.error(`✗ ${errors.length} problème(s) SEO :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`✓ SEO : ${pages.length} pages vérifiées, sitemap complet.`);
