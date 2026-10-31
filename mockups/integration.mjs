// Serves the style mockups of spec 003 with `astro dev` only: `astro build` never sees the route,
// so nothing of this folder reaches dist/ (specs/003-visual-design-pass/contracts/mockups.md).

/** @returns {import('astro').AstroIntegration} */
export default function mockups() {
  return {
    name: 'style-mockups',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({
          pattern: '/_maquettes/[...path]',
          entrypoint: new URL('./MockupPage.astro', import.meta.url),
          prerender: true,
        });
      },
    },
  };
}
