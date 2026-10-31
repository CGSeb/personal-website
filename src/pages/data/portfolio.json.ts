// Public JSON export of the published content, for the 3D scene (contracts/portfolio-export.md).
import type { ImageMetadata } from 'astro';
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getSite } from '../../content';
import { buildExport } from '../../lib/export';

export const GET: APIRoute = async ({ site: base }) => {
  const site = await getSite();

  // Optimized URLs of every exported image, computed ahead since buildExport is synchronous.
  const images = [
    site.profile.photo,
    ...site.projects.flatMap((p) => [...(p.cover ? [p.cover] : []), ...p.gallery]),
  ];
  const urls = new Map<ImageMetadata, string>();
  for (const { image } of images) {
    urls.set(image, (await getImage({ src: image, width: 1200, format: 'webp' })).src);
  }

  const data = buildExport(site, {
    baseUrl: new URL('/', base).href.replace(/\/$/, ''),
    generatedAt: new Date().toISOString(),
    imageUrl: (image) => urls.get(image)!,
  });
  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
