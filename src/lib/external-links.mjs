// Sätteri hast plugin: links of the Markdown content to another site open in a new tab, with a
// hidden note for screen readers in the language of the file (`fr.md` / `en.md`).
const NOTE = {
  fr: '(s’ouvre dans un nouvel onglet)',
  en: '(opens in a new tab)',
};

const isExternal = (href) => typeof href === 'string' && /^https?:\/\//i.test(href);

export default function externalLinks({ fileURL }) {
  const lang = fileURL?.pathname.endsWith('/en.md') ? 'en' : 'fr';
  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        if (!isExternal(node.properties?.href)) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', ['noopener']);
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'span',
          properties: { className: ['visually-hidden'] },
          children: [{ type: 'text', value: ` ${NOTE[lang]}` }],
        });
      },
    },
  };
}
