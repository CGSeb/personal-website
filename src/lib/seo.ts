// Head tags of a page: title, canonical, hreflang alternates, Open Graph and Twitter (FR-016).
import { otherLang, type Lang } from '../i18n/routes';

const OG_LOCALE: Record<Lang, string> = { fr: 'fr_FR', en: 'en_US' };

export interface SeoInput {
  site: URL;
  lang: Lang;
  siteName: string;
  title: string;
  description: string;
  canonicalPath: string;
  alternatePath: string;
  /** Absolute URL or site path of the preview image. */
  image: string;
  imageAlt?: string | undefined;
  type?: 'website' | 'article' | 'profile' | undefined;
}

export function seoTags(input: SeoInput) {
  const { site, lang, siteName, title, description } = input;
  const fullTitle = title === siteName ? title : `${title} — ${siteName}`;
  const canonical = new URL(input.canonicalPath, site).href;
  const image = new URL(input.image, site).href;
  const alternates = [
    { hreflang: lang, href: canonical },
    { hreflang: otherLang(lang), href: new URL(input.alternatePath, site).href },
    { hreflang: 'x-default', href: new URL('/', site).href },
  ];
  const og = [
    ['og:type', input.type ?? 'website'],
    ['og:site_name', siteName],
    ['og:title', title],
    ['og:description', description],
    ['og:url', canonical],
    ['og:image', image],
    ...(input.imageAlt ? [['og:image:alt', input.imageAlt]] : []),
    ['og:locale', OG_LOCALE[lang]],
    ['og:locale:alternate', OG_LOCALE[otherLang(lang)]],
  ].map(([property, content]) => ({ property: property!, content: content! }));
  const twitter = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', title],
    ['twitter:description', description],
    ['twitter:image', image],
  ].map(([name, content]) => ({ name: name!, content: content! }));
  return { fullTitle, canonical, alternates, og, twitter };
}
