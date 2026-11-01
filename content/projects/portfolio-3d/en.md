## Context

A portfolio has to be both engaging and easy to find. Rather than choose, this one has two versions built from the same content:

- **an isometric 3D scene**: a room to explore, where each object (project, diploma, job) opens an information panel;
- **a written version** in static HTML: readable even without JavaScript, and designed for search engines and AI agents.

## Features

- **A room to explore**: move the view, zoom, and tap an object to learn more
- **One content source, in two languages**: French and English, with a light or dark theme
- **A keyboard list** that drives the scene, and a way back to the written version at any time
- **No trackers or cookies**

## Under the hood

- **Astro and TypeScript** for the site and the written version
- **Three.js** for the 3D scene; the room and objects are modelled in **Blender**
- **YAML and Markdown** for the content: each item is described once, and it feeds the pages, the sitemap, `llms.txt` and the scene
- **Spec Kit** to specify each change before coding it
