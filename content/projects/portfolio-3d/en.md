## Context

A portfolio has to be both engaging and easy to find. Rather than choose, this one has two versions built from the same content:

- **an isometric 3D scene**: a room to explore, where each object (project, diploma, job) opens an information panel;
- **a written version** in static HTML: fast, readable even without JavaScript, and designed for search engines and AI agents.

## Approach

- **Specified before it was coded**, with Spec Kit: two specifications, each with a technical plan and a task list
- **One content source, in two languages**: each item is described once in YAML and Markdown and validated at build time; it feeds the pages, the sitemap, `llms.txt` and the export the scene reads
- **The scene**: Three.js, an orthographic camera, on-demand rendering and adaptive quality; the room and objects are modelled in Blender with named slots, and a new project finds its place on its own
- **Accessible and lightweight**: a keyboard list that drives the scene, fallbacks to the written version (no WebGL, reduced motion, slow device), no trackers or cookies

## Results

Lighthouse scores of 100 on both the scene and the written version, under 300 KB before the first interaction on the scene, and 250 end-to-end tests on desktop, iPhone and small screens, plus a check without JavaScript: the written version stays complete and the scene shows its list of links instead of the 3D.
