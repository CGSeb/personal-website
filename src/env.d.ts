declare namespace App {
  interface Locals {
    /** Set by the style mockups of spec 003 (mockups/MockupPage.astro, `astro dev` only). */
    mockup?: {
      style: 'atelier' | 'bureau';
      name: string;
      links: { label: string; href: string; current?: boolean }[];
    };
  }
}
