// Default share image per language (1200×630), generated at build time from the profile.
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getSite } from '../../content';
import type { Lang } from '../../i18n/routes';

export const getStaticPaths: GetStaticPaths = () => [
  { params: { lang: 'fr' } },
  { params: { lang: 'en' } },
];

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Naive word wrap for SVG text. */
const wrap = (text: string, max: number) =>
  text.split(' ').reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= max)
      lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as Lang;
  const { profile } = await getSite();
  const headline = wrap(profile.headline[lang], 38)
    .slice(0, 3)
    .map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 56}">${escape(line)}</tspan>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3d5afe"/><stop offset="1" stop-color="#7c4dff"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="10" stroke-linejoin="round">
    <path d="M1000 160 1110 215 1110 345 1000 400 890 345 890 215Z"/><path d="M890 215 1000 270 1110 215M1000 270v130"/>
  </g>
  <text x="80" y="250" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">${escape(profile.name)}</text>
  <text x="80" y="340" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="44" fill="#ffffff" fill-opacity="0.9">${headline}</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
