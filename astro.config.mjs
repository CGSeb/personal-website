// @ts-check
import { defineConfig } from 'astro/config';

// `site` is a placeholder until hosting and the domain are chosen.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
