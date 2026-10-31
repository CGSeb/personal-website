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
  // Style « tour »: charcoal like the room at night, an amber LED line and the amber cube.
  // librsvg only knows the fonts installed on the build machine, hence the fallbacks.
  const font = "'Space Grotesk', Inter, 'Segoe UI', Arial, sans-serif";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><radialGradient id="glow" cx="0.83" cy="0.45" r="0.45">
    <stop offset="0" stop-color="#f0a35a" stop-opacity="0.22"/><stop offset="1" stop-color="#f0a35a" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="1200" height="630" fill="#141516"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect y="560" width="1200" height="70" fill="#1c1d1f"/>
  <rect x="80" y="558" width="1040" height="4" rx="2" fill="#f0a35a"/>
  <g fill="none" stroke="#f0a35a" stroke-width="10" stroke-linejoin="round">
    <path d="M1000 160 1110 215 1110 345 1000 400 890 345 890 215Z"/><path d="M890 215 1000 270 1110 215M1000 270v130" stroke-opacity="0.6"/>
  </g>
  <rect x="80" y="166" width="28" height="28" rx="6" fill="#f0a35a"/>
  <text x="80" y="270" font-family="${font}" font-size="84" font-weight="700" fill="#f0ebe3">${escape(profile.name)}</text>
  <text x="80" y="350" font-family="${font}" font-size="44" fill="#f5b77a">${headline}</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
