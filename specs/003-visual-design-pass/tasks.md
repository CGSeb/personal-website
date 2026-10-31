---

description: "Task list for the visual design pass"
---

# Tasks: Passe graphique et design du portfolio

**Input**: Design documents from `/specs/003-visual-design-pass/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: included. The spec requires measurable checks (contrast in both themes, no flash, no
mockup in `dist/`, budgets at night), and the constitution's quality gates require Vitest,
Playwright and Lighthouse.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5, from spec.md)
- Same Astro project as specs 001 and 002: views in `src/views/`, components in
  `src/components/`, client code of the scene in `src/scene/`, models built by
  `assets-src/models/build_models.py`
- **Decision gate**: after US1, Sébastien chooses the style (T024). US2 and US3 apply the chosen
  style only; nothing in them may start before `decision.md` exists
- Check the exact APIs in the installed packages before use (Astro 7 `injectRoute` and
  `astro:config:setup` `command`, Three.js 0.187 lights and `emissiveIntensity`, Playwright
  `emulateMedia` / `forcedColors`)
- Built beyond the plan in Phase 2: `src/scene/lighting.ts` applies the ambiance settings (lights,
  lamp glow, window, point lights), so `renderer.ts` only keeps the background
  (`refreshBackground()`). The light theme's focus colour became a darker amber (`#b35900`):
  the old `#ff9f1c` was under 3:1 on the light background. The literal-colour check covers
  `src/` with the exemptions listed in contracts/design-tokens.md. The site's room keeps its
  look (`build_models.py` style `site`); its window glass and lampshade are now the `window` and
  `lamp` materials, the bookshelf is `decor.shelf` with two plants, and `light.lamp.01` sits in
  the floor lamp

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: folders and labels

- [X] T001 Create `mockups/` with `README.md` (exploration only, served by `astro dev` only, deleted after the decision; contracts/mockups.md), and the empty folders `mockups/styles/`, `mockups/models/` and `specs/003-visual-design-pass/captures/`
- [X] T002 [P] Add the theme labels FR/EN to `src/i18n/ui.ts`: `theme.system`, `theme.light`, `theme.dark`, each with the current state and the next action ("Thème : système. Passer au thème clair" / "Theme: system. Switch to light theme", and so on through the cycle system → light → dark → system); also the mockup banner "Maquette : {style}" / "Mockup: {style}" and "Voir l'autre maquette" / "See the other mockup"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: design values in two levels, the theme mechanism and the day / night scene, which
the mockups and the final style all build on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Design values

- [X] T003 Restructure `src/styles/tokens.css` into a palette (`--palette-<hue>-<level>`) and roles, with the current colours as the values: all roles of contracts/design-tokens.md (`--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-muted`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-on-accent`, `--color-accent-text`, `--color-focus`, `--color-ongoing`, `--scene-bg`, `--scene-highlight`), plus `--radius-s`, `--radius-pill`, `--shadow-1`, `--shadow-2`, `--duration-fast`, `--duration-theme`; dark values declared twice, under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and under `:root[data-theme="dark"]`; `color-scheme` follows the effective theme; durations set to `0s` under `prefers-reduced-motion: reduce`
- [X] T004 [P] Unit test `tests/unit/design-tokens.test.ts`: parse `src/styles/tokens.css`, resolve each role in the light and the dark theme, compute the WCAG 2 ratio of every pair in contracts/design-tokens.md and fail below its threshold ("4,5:1" text, "3:1" large text, control borders, focus, scene highlight); also fail on any literal colour (`#…`, `rgb(`, `hsl(`) in `src/` outside `tokens.css`, except the light and sky colours of `src/scene/ambiance.ts` (contracts/scene-ambiance.md)
- [X] T005 Replace every literal colour in `src/components/**`, `src/views/**`, `src/layouts/**`, `src/styles/base.css` and `src/scene/renderer.ts` with roles (29 occurrences found when planning), so that T004 passes with the current look unchanged

### Theme mechanism

- [X] T006 [P] Unit tests `tests/unit/theme.test.ts` and pure logic `src/lib/theme.ts` per contracts/theme.md: `effectiveTheme(pref, systemDark)`, `nextPreference(pref)` (system → light → dark → system), `parsePreference(raw)` (unknown or `null` → `'system'`)
- [X] T007 [P] `src/components/ThemeScript.astro`: `is:inline` script under 1 KB that reads `localStorage.theme` in a `try/catch` and sets `data-theme` on `<html>` only for `light` or `dark`; nothing else
- [X] T008 `src/components/ThemeToggle.astro`: `<button type="button" hidden>` revealed by its module; click cycles the preference, writes or removes `localStorage.theme` in a `try/catch`, sets or removes `data-theme`, updates its accessible name from `ui.ts` and its decorative `aria-hidden` icon, then dispatches `themechange` on `document` with `detail.theme` = effective theme; without a stored choice, listens to `matchMedia('(prefers-color-scheme: dark)')` and dispatches `themechange` when the system changes
- [X] T009 Put `ThemeScript` first in `<head>` of `src/layouts/BaseLayout.astro` (before the stylesheets) and `ThemeToggle` in `src/components/Header.astro` next to `LanguageSwitcher`; add it to the scene toolbar in `src/views/SceneView.astro` next to the recenter button

### Day / night scene

- [X] T010 [P] Unit tests `tests/unit/scene-ambiance.test.ts` and pure module `src/scene/ambiance.ts` per contracts/scene-ambiance.md: `ambianceFor(theme)`, `settingsFor(ambiance, quality)` with `pointLight` "`null` en qualité `low`", `blend(a, b, t)` (t = 0 → a, t = 1 → b, colours interpolated)
- [X] T011 `src/scene/renderer.ts` and `src/scene/room.ts`: lights created from `settingsFor()`; background read from `--scene-bg`; materials named `lamp` and `window` found in the room and driven by the settings; one `PointLight` without shadow per `light.lamp.NN` empty when the setting is not `null`; `loadRoom()` takes the room URL from the page (`roomUrl`, default `/models/room.glb`); the provisional room gets a lamp, a window and a `light.lamp.01` empty
- [X] T012 `src/scene/scene3d.ts` and `src/scene/test-hook.ts`: on `themechange`, re-read `--scene-bg` and switch ambiance, instant under reduced motion, otherwise a fade with `blend()` over `--duration-theme`, rendering on demand only during the fade; view, open panel, language and quality kept; re-apply the settings when the quality level changes; test hook `__scene.ambiance()` returns `'day'` or `'night'`
- [X] T013 `src/views/SceneView.astro`: optional prop `roomUrl` passed to the scene script (data attribute), default `/models/room.glb`

### Room variants

- [X] T014 `assets-src/models/build_models.py`: arguments after `--` (`--style atelier|bureau`, `--out <dir>`; default: current style into `assets-src/models/`); one `ROOM_PALETTE` per style; project support per style (`workbench` for atelier: wooden workbench; `desk` for bureau: white thin-top desk) carrying the same `slot.project.NN` and `featured.<id>` empties; for every style: diploma wall with the `slot.education.NN`, `decor.shelf` with at least 2 plants, a lamp using material `lamp` with its `light.lamp.01` empty, a window using material `window`; no light exported in the `.glb` (contracts/scene-ambiance.md)

**Checkpoint**: the site looks as before, passes all existing tests, has a working theme button,
and the scene switches day / night with the provisional room

---

## Phase 3: User Story 1 - Comparer deux styles et en choisir un (Priority: P1) 🎯 MVP

**Goal**: two mockups, atelier and bureau moderne, side by side, then a recorded decision

**Independent Test**: open `/_maquettes/atelier/` and `/_maquettes/bureau/` in two tabs, toggle
the theme in each, check home and room are complete with distinct palettes and accents; build
and check that nothing of the mockups is in `dist/`

### Tests for User Story 1

- [X] T015 [P] [US1] Extend `scripts/check-seo.mjs`: fail if any file path or text in `dist/` contains `_maquettes`, `room-atelier` or `room-bureau` (contracts/mockups.md)

### Implementation for User Story 1

- [X] T016 [US1] `mockups/integration.mjs`: Astro integration whose `astro:config:setup` calls `injectRoute({ pattern: '/_maquettes/[...path]', entrypoint: './mockups/MockupPage.astro' })` only when `command === 'dev'`; register it in `astro.config.mjs`
- [X] T017 [US1] `mockups/MockupPage.astro`: `getStaticPaths` for `atelier` and `bureau` × FR / EN × home / room (`/_maquettes/<style>/`, `…/scene/`, `…/en/`, `…/en/scene/`: path segments, because a static page has no query string); renders the real `HomeView` or the real `SceneView` with `roomUrl` = `mockups/models/room-<style>.glb` imported with `?url`; imports both style sheets, which are scoped by `:root[data-style='<style>']`; sets `Astro.locals.mockup`, which `BaseLayout` reads for `data-style`, `<meta name="robots" content="noindex, nofollow">` and the banner (home, room, other language, other style)
- [X] T018 [P] [US1] `mockups/styles/atelier.css`: warm palette (wood, sand, cream; ochre or terracotta accent), all roles for light and dark, font Figtree (`@fontsource-variable/figtree`, latin, with an adjusted `local()` fallback); dark = night workshop (warm browns, lit accent); every pair of contracts/design-tokens.md at its threshold
- [X] T019 [P] [US1] `mockups/styles/bureau.css`: clean palette (white, light grey, graphite; cool accent such as blue or teal), all roles for light and dark, font Inter (existing); dark = night office (graphite, cool lights); every pair at its threshold
- [X] T020 [US1] Extend `tests/unit/design-tokens.test.ts` to also check `mockups/styles/atelier.css` and `mockups/styles/bureau.css` (pairs in both themes) while `mockups/` exists
- [X] T021 [P] [US1] Build the atelier room: `blender --background --python assets-src/models/build_models.py -- --style atelier --out mockups/models/raw`, then `node scripts/optimize-models.mjs mockups/models/raw mockups/models` into `mockups/models/room-atelier.glb` (simplified: shapes, materials, light, diploma wall, shelf with plants, workbench); `mockups/models/raw/` is ignored by git
- [X] T022 [P] [US1] Build the bureau room the same way into `mockups/models/room-bureau.glb` (diploma wall, shelf with plants, white desk)
- [X] T023 [US1] Take the captures into `specs/003-visual-design-pass/captures/` named `<style>-<thème>-<largeur>-<accueil|piece>.jpg`: 2 styles × light / dark × desktop (1440 px) / phone (375 px) × home / room, so 16 images (JPEG to keep the repository light, 1.7 MB in all); the room with a project panel open on desktop, alone on the phone (the bottom sheet would cover it); comparison table in `captures/README.md`
- [X] T047 [US1] Third candidate « tour », asked by Sébastien after a first look (31/10): the modern office high up in a tower, very modern and sci-fi. `mockups/styles/tour.css` (cool whites and deep navy, cyan accent, magenta focus, Space Grotesk headings with Inter text, sharp corners; every pair at its threshold); `build_tower_room()` in `assets-src/models/build_models.py` (dark polished floor with a grid, white wall panels, glass curtain wall with the city below and lit windows at night, LED strips in a new `neon` material, white console desk, arc lamp, same slots) into `mockups/models/room-tour.glb` (141 KB); `neon` handled by `ambiance.ts` / `lighting.ts` (`neonEmissive`); headings use `--font-display` in `src/styles/base.css`; route, test and SEO check extended; 8 more captures
- [X] T048 [US1] « Tour » room reworked, asked by Sébastien (31/10): featured projects in the middle on an oval white desk (LED rim, LED ring on the floor, swivel chair, halo light hanging above), the other projects on a display wall along the glass (floating console and shelf, LED underneath), modern open shelving with plants (`decor.shelf`), low sofa, round table and arc lamp in the lounge, tall planter by the glass; `room_markers()` takes the room's own project slots, featured places and lights; `Builder.ellipse()`; night lighting: two warm lamps (`light.lamp.01` arc lamp, `light.lamp.02` halo) and two LED glows (`light.neon.NN`, new `neonLight` setting, high quality only) under a lower ambient light; less glossy floor (no hot spots); desktop captures now show the room alone and with a panel (`…-panneau.jpg`), 30 captures in all
- [X] T049 [US1] « Tour » room redone from Sébastien's reference images (31/10): glass from wall to wall on the north side with the city and a few LED signs; a long black floating desk facing the view (cyan LED line, end panels, drawer unit), featured projects in its middle and the generic ones on both sides, nearest first; ergonomic chair facing the city; west wall in concrete with built-in walnut shelving by the glass (warm LED under each shelf, `decor.shelf`), the diplomas in a row under a lit wooden slat panel, the black experience panel framed in cyan; lounge facing the view in the foreground (rug, low sofa, low table, floor lamp beside the sofa); dark wooden floor; black pots; `room_markers()` also takes education and experience places; night: three warm lights (floor lamp, desk accent, slats) and two cyan glows (desk, experience panel); replaces the T048 layout
- [X] T050 [US1] « Tour » room rebuilt after Sébastien's isometric reference renders (31/10), « plus zoomé » and « plus photoréaliste »: `assets-src/models/tower_room.py` (exec'd by `build_models.py`, `--style tour`): a 4.2 × 4.2 m furnished study (dark painted walls with white caps, window with the city at night, floor-to-ceiling walnut slats with a warm LED, L-shaped walnut desk with black drawer units, ergonomic chair, floating shelves with plants and books, plant stand, large rug, leather armchair, side table, floor lamp); procedural materials (wood grain, rug, paint); **baked lighting**: the static room is joined into one mesh (material `baked`), unwrapped, and baked with Cycles (2048 px, OptiX) for day and night into `room-tour-day.png` / `room-tour-night.png`, converted to WebP by `optimize-models.mjs` (room 525 KB + 243 KB + 318 KB); `src/scene/baked.ts` draws it unlit and fades between the two textures (`bakedNight` in the ambiance); `SceneView` takes `bakedMaps` (the mockup imports them with `?url`); the camera bounds frame the smaller room; `tour.css` moved to the room's warm palette (charcoal, walnut, linen, amber accent, teal focus); Sébastien's own edit of the previous room kept in `mockups/models/raw/room-tour-sebastien.blend` (not versioned); replaces the T048 / T049 layouts
- [X] T024 [US1] **Decision (Sébastien)**: compare the mockups (desktop and a real phone through `npm run dev -- --host`), then write `specs/003-visual-design-pass/decision.md`: chosen style, date, 3 to 5 reasons, borrowings from the other style (possibly none), links to the captures; done: « tour » chosen (31/10)
- [X] T051 [US1] « Tour » objects, asked by Sébastien after the choice (31/10): in `assets-src/models/tower_room.py`, `build_tower_objects()` builds the room's own models into `mockups/models/tour/`: LessonFolk's dedicated object is a graduation cap on two books (×1.5), Voxel Shift's is its logo in green `neon` on a black stand (from `src-tauri/icons/VSLogo.svg` of its repository, ×1.4), diplomas are large frames with a mat, a gold seal and a brass picture lamp (`lamp`) whose halo (`glow`) shows at night, experience cards are small index cards with a red pin (`pin`); the room gets a large cork board for the experiences under a picture lamp, baked spot lights over the board and the two diploma places, and new slots (3 dedicated objects on the desk, 1 generic project on the west arm, 2 diplomas, 6 experiences in a zigzag timeline); code: any project with a `featured.<id>` place gets its dedicated object (`layout.ts`), `SceneView` `modelUrls`, `lighting.adopt()` for placed objects' lamps / LEDs / halos, a warm fill light for objects in a baked room, the red string joining the experience cards in time order (`src/scene/timeline.ts`)
- [X] T052 [US1] Desk rearranged, asked by Sébastien (31/10): LessonFolk's cap on the desk's west arm; this portfolio's dedicated object is now the main computer's screen in front of the chair, showing the project's image (`screen`), instead of the diorama of the old room; Voxel Shift's logo stays on the right, darker green (`#00a352`) with a brighter glow, and lights its surroundings at night (an object's `neon` adds a point light in its colour, high quality only); the generic project screen goes to the left of the north arm; tower `generic-project` monitor; re-baked

**Checkpoint**: `decision.md` exists; `npm run build && npm run check:seo` passes

---

## Phase 4: User Story 2 - Un site écrit au style retenu (Priority: P1)

**Goal**: every page of the written version in the chosen style

**Independent Test**: browse each page type in both languages and both themes; contrast,
320 px, no JavaScript, print, Lighthouse

### Tests for User Story 2

- [ ] T025 [P] [US2] Playwright `tests/e2e/design.spec.ts`: for each page type (home, projects, category, project, career, diploma, experience, contact, 404) in FR and EN, light and dark (`colorScheme`): computed `background-color` of `body` and colour of `h1` equal the role values of the theme; no horizontal scroll at 320 px; with JavaScript disabled and dark system: dark page, no theme button, nav links work; `emulateMedia({ media: 'print' })`: dark text on white, header and theme button hidden; `forcedColors: 'active'`: card borders and focus ring visible

### Implementation for User Story 2

- [ ] T026 [US2] Move the chosen style's palette and roles from `mockups/styles/<style>.css` into `src/styles/tokens.css` (with the borrowings listed in `decision.md`); update `src/styles/fonts.css` and the font preload in `src/layouts/BaseLayout.astro` if the font changes (add the `@fontsource-variable/*` package, remove the unused one)
- [ ] T027 [P] [US2] Header, footer, language switcher, theme button in the chosen style: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/LanguageSwitcher.astro`, `src/components/ThemeToggle.astro`
- [ ] T028 [P] [US2] Shared components with one look each (FR-010): `src/components/ProjectCard.astro` (with the default visual in the chosen style when a project has no image), `src/components/Timeline.astro`, `src/components/Period.astro`, `src/components/ProjectLinks.astro`, `src/components/RelatedProjects.astro`, `src/components/VideoFacade.astro`, tags and buttons in `src/styles/base.css`
- [ ] T029 [US2] Views in the chosen style, using roles only: `src/views/HomeView.astro` (profile, featured projects, 3D entry), `src/views/ProjectListView.astro`, `src/views/ProjectView.astro`, `src/views/CareerView.astro`, `src/views/CareerItemView.astro`, `src/views/ContactView.astro`, `src/pages/404.astro`
- [ ] T030 [US2] `src/styles/base.css`: `@media print` (dark text on white, header, theme button, 3D entry and decorations hidden, URL shown after external links); `@media (forced-colors: active)` (card borders and focus in `CanvasText` / `Highlight`); no decorative transition under `prefers-reduced-motion: reduce`
- [ ] T031 [US2] Regenerate the share images `src/pages/og/[lang].png.ts` with the chosen palette and font

**Checkpoint**: T004 and T025 pass; all existing written-version tests pass

---

## Phase 5: User Story 3 - Une pièce 3D au style retenu (Priority: P1)

**Goal**: the final room and the scene interface in the chosen style, day and night

**Independent Test**: open the scene, select one object of each type, toggle the theme, trigger
each fallback, and compare every screen with the written version

### Tests for User Story 3

- [ ] T032 [P] [US3] Extend `tests/e2e/scene.spec.ts`: with a panel open, toggling the theme makes `__scene.ambiance()` return `'night'`, then `'day'`, with the same panel open and the same view, without reload; under `reducedMotion: 'reduce'` the switch is instant; the diploma wall, the shelf and the project support are present (named nodes in the loaded room)
- [ ] T033 [P] [US3] Extend `tests/e2e/scene-perf.spec.ts`: run the existing frame-rate scenario also in dark theme (night, CPU throttling ×4): ≥ 30 fps, or quality stepped down then the too-slow proposal

### Implementation for User Story 3

- [ ] T034 [US3] Final room in the chosen style in `assets-src/models/build_models.py` (remove the other style's palette and furniture): finished furniture, materials and decor; diploma wall, `decor.shelf` with plants, the style's project support with all `slot.project.NN` and `featured.<id>`; lamps (`lamp`, `light.lamp.NN`, 1 to 3) and window (`window`); then `npm run models:optimize`; `room.glb` "≤ 1,5 Mo" compressed
- [ ] T035 [P] [US3] Generic and featured objects in the chosen style (`build_generic_project`, `build_generic_education`, `build_generic_experience`, `build_overflow`, `build_lesson_folk`, `build_portfolio_3d` in `assets-src/models/build_models.py`), re-exported and optimized into `public/models/`
- [ ] T036 [US3] Tune `src/scene/ambiance.ts` day and night settings for the final room (light colours matching the palette, lamp glow, night window); keep T010 passing
- [ ] T037 [P] [US3] Scene interface in the chosen style, roles only: `src/components/scene/ScenePanel.astro`, `src/components/scene/SceneItemList.astro`, toolbar, loading indicator, choice screen and fallback messages in `src/views/SceneView.astro`; highlight colour from `--scene-highlight` in `src/scene/objects.ts`

**Checkpoint**: T032 and T033 pass; `npm run check:scene` passes

---

## Phase 6: User Story 4 - Choisir son thème, clair ou sombre (Priority: P2)

**Goal**: the theme button proven on every page and in the scene, remembered, without flash

**Independent Test**: dark system, open the site (dark), switch to light, change page and
language, reopen the site (still light); in the scene, the room switches day / night

### Tests for User Story 4

- [ ] T038 [P] [US4] Playwright `tests/e2e/theme.spec.ts`: no stored choice → follows `colorScheme` and its change during the visit; click cycle system → light → dark → system, the last step removes `localStorage.theme`; choice kept across pages, across FR / EN and in a new page of the same context; no flash: with `theme=dark` stored and a light system, the computed background at `DOMContentLoaded` is already the dark `--color-bg`; with `localStorage` throwing (init script), the button still changes the page's theme and no error is logged; accessible name in FR and EN reflects state and next action; keyboard: reachable by Tab, activated by Enter and Space; no cookie set

### Implementation for User Story 4

- [ ] T039 [US4] Fix whatever T038 reveals in `src/components/ThemeToggle.astro`, `src/components/ThemeScript.astro` or `src/lib/theme.ts`; check that the script stays under 1 KB and that the page JavaScript stays "≤ 50 Ko" compressed

**Checkpoint**: T038 passes

---

## Phase 7: User Story 5 - Garder la qualité acquise (Priority: P2)

**Goal**: every existing check passes on the redesigned site, in both themes

**Independent Test**: run the full suite and the quickstarts of specs 001, 002 and 003

- [ ] T040 [US5] Run `npm test`, `npm run build`, `npm run check:seo`, `npm run check:scene`, `npm run test:e2e`, `npm run lhci`; Lighthouse ≥ 90 in every category on every URL of `lighthouserc.json` (target 100), LCP < 2,5 s, CLS < 0,1, JS ≤ 50 Ko; fix any regression in the files concerned
- [ ] T041 [US5] Extend `tests/e2e/privacy.spec.ts` to run its third-party request and cookie checks in both themes, including a theme toggle and the scene at night
- [ ] T042 [US5] Run the quickstarts of `specs/001-portfolio-content-written/quickstart.md` and `specs/002-isometric-3d-scene/quickstart.md`, then `specs/003-visual-design-pass/quickstart.md` scenarios 1–19; record the results in the quickstart file
- [ ] T043 [US5] Manual checks (quickstart C, scenarios 20–22): real Android phone in both themes (site and scene day / night), written ↔ scene identity, NVDA on the theme button in both languages

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T044 Delete `mockups/` and its registration in `astro.config.mjs`; remove the `mockups/styles/*` part of `tests/unit/design-tokens.test.ts`, the mockup part of `src/layouts/BaseLayout.astro` (`data-style`, noindex, banner and its style), `src/env.d.ts` (`App.Locals.mockup`), the `mockup.banner` label in `src/i18n/ui.ts`, the `mockups/models/raw/` line of `.gitignore`, and `@fontsource-variable/figtree` / `@fontsource-variable/space-grotesk` from `devDependencies` unless their style was chosen (then the font moves to `dependencies` in T026); keep the `check-seo.mjs` rule (FR-005)
- [ ] T045 [P] Update `README.md` (design values and roles, theme button, day / night scene, link to spec 003) and `assets-src/models/README.md` (style of the room, lamps and window, contracts/scene-ambiance.md)
- [ ] T046 [P] Update `specs/002-isometric-3d-scene/contracts/scene-model.md` with a link to `specs/003-visual-design-pass/contracts/scene-ambiance.md` for the `lamp`, `window`, `light.lamp.NN` and `decor.shelf` additions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: after Setup; blocks all user stories
- **US1 (Phase 3)**: after Phase 2; ends with the decision gate T024
- **US2 (Phase 4)** and **US3 (Phase 5)**: after T024; independent of each other (US2 touches
  the written version, US3 the room and the scene interface; both read `tokens.css` from T026,
  so T026 goes first)
- **US4 (Phase 6)**: after Phase 2 for the mechanism; its final check after US2 and US3 (button
  in the chosen style, night room)
- **US5 (Phase 7)**: after US2, US3 and US4
- **Polish (Phase 8)**: after US5

### Within Each User Story

- Tests first, failing, then implementation
- Story checkpoint before the next phase

### Parallel Opportunities

- Setup: T002 alongside T001
- Foundational: T004, T006, T007, T010 together; T014 (Blender) alongside any code task
- US1: T018–T019 together, T021–T022 together, T015 at any time
- After T026: US2 (T027–T031) and US3 (T034–T037) in parallel
- Polish: T045–T046 together

---

## Parallel Example: User Story 1

```bash
Task: "Atelier values in mockups/styles/atelier.css"
Task: "Bureau values in mockups/styles/bureau.css"
Task: "Atelier room into mockups/models/room-atelier.glb"
Task: "Bureau room into mockups/models/room-bureau.glb"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 and Phase 2: same look as today, but roles, theme button and day / night scene in
   place
2. US1: the two mockups
3. **Stop**: Sébastien compares and writes the decision

### Incremental Delivery

1. Foundational (one PR): no visible change except the theme button and the night room
2. US1 mockups (one PR), then the decision
3. US2 written version (one PR), US3 room and scene (one PR)
4. US4 theme proofs, US5 checks (one PR)
5. Polish: delete `mockups/`, docs

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Commit after each task or logical group; one PR per phase, like specs 001 and 002
- The rooms (T021, T022, T034, T035) are design work in Blender; they can be done with the
  Blender connection of this environment or by Sébastien directly
- T024 is Sébastien's decision; it cannot be done by Claude
