// Sitemap of every public page, each with its hreflang alternates (FR-018). Generated here
// rather than with @astrojs/sitemap, which pairs languages by identical paths and so cannot
// link translated slugs such as /fr/projets/ and /en/projects/.
import type { APIRoute } from 'astro';
import { getSite } from '../content';
import { allPages } from '../lib/pages';

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const entries = allPages(await getSite()).flatMap((pair) =>
    (['fr', 'en'] as const).map(
      (lang) => `  <url>
    <loc>${abs(pair[lang])}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${abs(pair.fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(pair.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs('/')}"/>
  </url>`,
    ),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${abs('/')}</loc>
  </url>
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
