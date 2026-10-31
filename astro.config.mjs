// @ts-check
import { readFileSync } from 'node:fs';
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';
import { parse } from 'yaml';
import externalLinks from './src/lib/external-links.mjs';

const contentDir = process.env.CONTENT_DIR ?? 'content';

/** Old address -> new address, from `<content>/redirects.yaml` (FR-025). */
function loadRedirects() {
  let list;
  try {
    list = parse(readFileSync(`${contentDir}/redirects.yaml`, 'utf8')) ?? [];
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return {};
    throw error;
  }
  /** @type {Record<string, string>} */
  const redirects = {};
  for (const [i, entry] of list.entries()) {
    const where = `${contentDir}/redirects.yaml[${i}]`;
    if (!entry?.from?.startsWith('/') || !entry?.to?.startsWith('/')) {
      throw new Error(`${where} : from / to — chemins absolus attendus (commençant par /)`);
    }
    if (redirects[entry.from]) throw new Error(`${where} : from — « ${entry.from} » déjà redirigé`);
    redirects[entry.from] = entry.to;
  }
  for (const [from, to] of Object.entries(redirects)) {
    if (redirects[to])
      throw new Error(`${contentDir}/redirects.yaml : ${from} → ${to} — redirection en chaîne`);
  }
  return redirects;
}

// `site` is a placeholder until hosting and the domain are chosen.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  redirects: loadRedirects(),
  // Links to other sites open in a new tab (the components do the same for their own links).
  markdown: { processor: satteri({ hastPlugins: [externalLinks] }) },
  // Build tests point CONTENT_DIR at fixtures; their own cache keeps the content store apart.
  ...(process.env.ASTRO_CACHE_DIR && { cacheDir: process.env.ASTRO_CACHE_DIR }),
});
