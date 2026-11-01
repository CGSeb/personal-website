## Context

Working with Blender quickly means juggling several versions: the stable one, an LTS release for an older project, an experimental build to try a new feature. Each has its own settings and extensions, and a long render ties up the machine at the worst moment.

Voxel Shift brings all of this into a single free, open-source desktop app for Windows and Linux.

## Features

- **Blender library**: install official stable releases and experimental builds, pick a default version, keep favourites
- **Projects**: reopen a recent project with the right Blender version, thumbnails included
- **Migration**: transfer settings and extensions between installations; save configurations and apply them again
- **Render planner**: a queue of animation renders with start time, progress, time remaining, pause, resume, retry and notifications
- **Built-in MCP server**: tools so an AI assistant can drive Blender, projects and renders, with the interface updating live

## Approach

A Tauri app: React and TypeScript interface, Rust core. Tested on both the interface and the Rust side, released under GPL-3.0 with regular versions and a public roadmap.
