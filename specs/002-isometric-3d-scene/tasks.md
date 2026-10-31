---

description: "Task list for the isometric 3D scene"
---

# Tasks: Scène 3D isométrique du portfolio

**Input**: Design documents from `/specs/002-isometric-3d-scene/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: included. The plan (research § 10) and the constitution's quality gates require Vitest
for the pure logic, Playwright for journeys, fallbacks, privacy and frame rate, and Lighthouse.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6, from spec.md)
- Same Astro project as spec 001: views in `src/views/`, one thin page per language under
  `src/pages/fr/` and `src/pages/en/`, client code of the scene in `src/scene/`
- Client code added beyond the plan: `src/scene/labels.ts` (page data), `src/scene/scene3d.ts` (assembles the scene, imported dynamically by `boot.ts`); the list of model files present in `public/models/` is passed by `SceneView.astro`, so the browser never requests a missing model. US5 parts already in place: `role="application"`, accessible name and live region (T040), header switcher fragment (T039)
- Check the exact Three.js 0.187 API names (addons import paths, `MapControls`, `MeshoptDecoder`)
  in the installed package before using them

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, folders and the scene route

- [X] T001 Install `three@^0.187` and `@types/three@^0.187` in `package.json`; add `gltfpack@^1.3` as a dev dependency and an npm script `models:optimize` (`scripts/optimize-models.mjs`) that runs `gltfpack -cc -tc` on every `assets-src/models/**/*.glb` into `public/models/` (contracts/scene-model.md)
- [X] T002 [P] Create folders `src/scene/`, `src/components/scene/`, `public/models/featured/`, `assets-src/models/` (with a `README.md` stating that `.blend` sources and raw exports live here and are not published); add `assets-src/**/*.blend1` to `.gitignore`
- [X] T003 [P] Add the page type `scene` to `src/i18n/routes.ts`: segments `explorer` (fr) / `explore` (en), `urlFor('scene', lang)` → `/fr/explorer/`, `/en/explore/`; extend `tests/unit/routes.test.ts` with both rows (contracts/scene-page.md)
- [X] T004 [P] Add scene labels FR/EN to `src/i18n/ui.ts`: page title and intro, "Voir la version écrite", loading, list heading and type groups, close, "En savoir plus", recenter, choice screen texts ("Continuer en 3D" / "Version écrite"), fallback messages (no WebGL, load error + "Réessayer", too slow), overflow box labels ("Autres projets", "Autres diplômes", "Autres expériences"), canvas accessible name

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the scene page in HTML, the manifest, and the 3D core every story builds on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Pure logic (with tests)

- [X] T005 [P] Unit tests in `tests/unit/scene-layout.test.ts` for `layout(items, slots)` per data-model.md rules 1–6: featured project with `featured.<id>` slot; featured project without dedicated model falls back to a generic model at the same slot; projects fill `slot.project.NN` by ascending `NN` in `order`; overflow turns the last project slot into `overflow/projects`; education and experience fill their slots in order with the same overflow rule; unused slots stay empty; same input → same output
- [X] T006 [P] Implement `layout()` in `src/scene/layout.ts` (pure, no Three.js import), types `SceneItem`, `Slot`, `Placement` with `Placement.model` one of `generic-project | generic-education | generic-experience | featured:<id> | overflow`
- [X] T007 [P] Unit tests in `tests/unit/scene-hash.test.ts` and implementation in `src/scene/hash.ts`: parse and build `#<type-traduit>/<id>` with types `projet|project`, `diplome|education`, `experience|experience`; unknown fragment → `null`; translate a fragment to the other language
- [X] T008 [P] Unit tests in `tests/unit/scene-manifest.test.ts` and implementation in `src/lib/scene-manifest.ts`: build `SceneItem[]` from the site model for one language — `key` = `<type>/<id>` unique, `label` (project title; diploma title; "position — organization"), `order`, `featured` (projects only), `image` (optimized cover URL or `null`), `badge` "≤ 40" characters (year, short title), `href` (written page, same language), `panelId` = `panel-<type>-<id>`; drafts absent

### Scene page (HTML first)

- [X] T009 Create `src/views/SceneView.astro` and `src/pages/fr/explorer/index.astro`, `src/pages/en/explore/index.astro`: `BaseLayout` with title, description, canonical, alternates and breadcrumb JSON-LD; in `<main>`, in this order: `<h1>` + intro + link to the written home; `#scene` container with loading indicator; `<noscript>` message with link to the written version; the manifest as `<script type="application/json" id="scene-manifest">` (contracts/scene-page.md)
- [X] T010 [P] `src/components/scene/SceneItemList.astro`: `<nav aria-label>` grouped by type (projects, education, experience), one entry per item; without JavaScript each entry is a link to the written page, enhanced into a `<button data-key>` by the script (FR-020)
- [X] T011 [P] `src/components/scene/ScenePanel.astro`: one `<article id="panel-<type>-<id>" hidden aria-labelledby>` per item with close button and "En savoir plus" link to `href`; project content per FR-009 (title, summary, role, period, categories, technologies, cover, links with the existing `VideoFacade`), diploma per FR-010 (title, institution, location, period or obtained date, level, skills), experience per FR-011 (position, organization, type, location, period with ongoing label, technologies); reuse `Period` and `ProjectLinks`
- [X] T012 Add the scene page pair to `src/lib/pages.ts` so it is in the sitemap; turn on the home entry in `src/views/HomeView.astro` (`SHOW_3D_ENTRY = true`, link to `urlFor('scene', lang)`) (FR-001)

### 3D core

- [X] T013 `src/scene/boot.ts`: entry module loaded by `SceneView.astro` after the page content (`<script>` that calls `import('./…')` on idle); reads the manifest, enhances the list into buttons, decides the path (3D, choice screen or fallback — stubs filled in US4), then imports `src/scene/renderer.ts`
- [X] T014 `src/scene/renderer.ts`: WebGL renderer sized to `#scene` (device pixel ratio capped by quality level), `OrthographicCamera` at isometric angles (azimuth 45°, elevation ≈ 35.26°), `MapControls` with rotation disabled and pan / zoom limited to the `bounds` box, **render on demand** (only on camera change, state change or running animation), resize handling, rendering stopped when `document.hidden` (FR-025)
- [X] T015 `src/scene/room.ts`: load `public/models/room.glb` with `GLTFLoader` + `MeshoptDecoder` when it exists; otherwise build the **provisional room in code** (floor, west and north walls, shelf, wall area, board) with the same named empties: 6 `slot.project.NN`, 4 `slot.education.NN`, 4 `slot.experience.NN`, `camera.home`, `bounds`; read empties into `Slot[]` (contracts/scene-model.md)
- [X] T016 `src/scene/objects.ts`: instantiate the model of each `Placement` (`generic-*.glb`, `featured/<id>.glb`, `overflow.glb`, or simple coded stand-ins while files are missing) at its slot transform; apply the project image to the `screen` material and a generated texture with `badge` to the `label` material; add an invisible larger hit shape per object; highlight state (outline or emissive) for `idle | highlighted | selected`
- [X] T017 [P] `src/scene/test-hook.ts`: when `import.meta.env.DEV` or `window.__sceneTest` is set before load, expose `window.__scene = { ready, screenPosition(key), quality(), frames() }`; never in a published build without that flag (contracts/scene-page.md)

**Checkpoint**: `/fr/explorer/` shows its HTML list and panels, then the provisional room with every published item placed

---

## Phase 3: User Story 1 - Explorer la scène et découvrir un élément sur place (Priority: P1) 🎯 MVP

**Goal**: select an object in the room and read its information in a panel, without leaving the page

**Independent Test**: on desktop, open one project, one diploma and one experience from the scene; each panel shows the right content in the page language and closes

### Tests for User Story 1 ⚠️

- [X] T018 [P] [US1] E2E in `tests/e2e/scene.spec.ts` (with `data-scene-test`): home link opens `/fr/explorer/` with a loading indicator then `__scene.ready` (US1-1); hovering an object shows its name (US1-2); clicking at `__scene.screenPosition('project/lesson-folk')` opens `#panel-project-lesson-folk` with the FR-009 fields and sets the fragment `#projet/lesson-folk` (US1-4); same for a diploma (US1-3) and an experience (US1-5); close button, Escape and click outside close it and return to exploration (US1-6)

### Implementation for User Story 1

- [X] T019 [US1] `src/scene/picking.ts`: raycast on pointer move (hover → `highlighted` + name tooltip near the cursor) and on click / tap (→ `selected`); ignore a click that ends a drag (movement > 6 px) and double clicks (edge case)
- [X] T020 [US1] `src/scene/panels.ts`: open the item's `<article>` as a non-modal panel anchored next to the object's screen position on wide screens (kept inside the viewport), update the fragment with `history.replaceState`, move focus to the panel; close on button, Escape or outside click; one panel at a time; re-render the scene on state change (FR-008, FR-013)
- [X] T021 [US1] Recenter button in `SceneView.astro` wired in `src/scene/renderer.ts`: animate back to `camera.home` (instant with reduced motion) (FR-007)
- [X] T022 [US1] Overflow box: selecting `overflow/projects` (and the education / experience variants) opens a list panel of the remaining items, each opening its own panel (data-model.md rule 3)

**Checkpoint**: the scene is usable on desktop with the provisional room — publishable MVP

---

## Phase 4: User Story 2 - Aller plus loin vers le site écrit (Priority: P1)

**Goal**: "En savoir plus" leads to the written page; selection never redirects; the scene restores its state on return

**Independent Test**: from a project panel, follow "En savoir plus", check the written page in the same language, go back and find the scene and panel again

### Tests for User Story 2 ⚠️

- [X] T023 [P] [US2] E2E in `tests/e2e/scene.spec.ts`: selecting objects never changes the page URL path (US2-2); "En savoir plus" goes to the written page of the item in the same language (US2-1); back restores the camera view and reopens the panel from the fragment (US2-3); a link to the written home is always visible (US2-4); opening `/en/explore/#education/master-informatique` directly opens that panel (FR-014)

### Implementation for User Story 2

- [X] T024 [US2] Save the camera view `{ x, z, zoom }` to `sessionStorage` key `scene.camera` on change (throttled) and restore it on load, all accesses wrapped in try/catch, in `src/scene/renderer.ts`
- [X] T025 [US2] Open the panel from the fragment on load and on `hashchange` in `src/scene/boot.ts` / `src/scene/panels.ts`, focusing the object in the camera if it is out of view

**Checkpoint**: both P1 stories work; the link between the two experiences is complete

---

## Phase 5: User Story 3 - Utiliser la scène sur téléphone (Priority: P2)

**Goal**: touch exploration and readable panels on phones, portrait and landscape

**Independent Test**: on an emulated phone, pan, pinch, tap an object, read and close the panel, rotate

### Tests for User Story 3 ⚠️

- [X] T026 [P] [US3] E2E in `tests/e2e/scene.spec.ts` for the `mobile-webkit` and `chromium-320` projects: tap at an object's screen position opens its panel as a bottom sheet that fits the viewport (US3-1/2); viewport change from portrait to landscape keeps the scene without reload (US3-3)

### Implementation for User Story 3

- [X] T027 [US3] Touch tuning in `src/scene/renderer.ts` and `src/scene/picking.ts`: one-finger pan, pinch zoom, tap threshold, larger hit shapes on coarse pointers (`matchMedia('(pointer: coarse)')`)
- [X] T028 [US3] Bottom-sheet panel layout under 40rem in the panel styles (`src/components/scene/ScenePanel.astro`): max 70 % of the viewport height, scrollable content, close button within thumb reach, swipe-down to close
- [X] T029 [US3] Orientation and resize: keep the camera target on resize / orientation change in `src/scene/renderer.ts`; initial quality level `medium` on coarse pointers (data-model.md)

**Checkpoint**: the scene works on phones

---

## Phase 6: User Story 4 - Repli vers le site écrit (Priority: P2)

**Goal**: nobody is left on a blank or stuttering scene

**Independent Test**: open the scene without WebGL, with reduced motion, with a simulated low frame rate and without JavaScript; each time a message and the written-version link appear

### Tests for User Story 4 ⚠️

- [X] T030 [P] [US4] Unit tests in `tests/unit/scene-quality.test.ts` for the governor of `src/scene/quality.ts`: measured from 3 s after first render, sliding 2 s window, threshold "30 i/s (téléphone) ou 50 i/s (ordinateur)", at most one step down every 3 s, levels `high → medium → low`, never back up, at `low` and still slow → `propose-written`
- [X] T031 [P] [US4] Unit tests in `tests/unit/scene-capabilities.test.ts` for the decision of `src/scene/capabilities.ts`: no WebGL → `fallback`; reduced motion or save-data without a stored choice → `choice`; stored `scene.choice` honored; otherwise `3d`
- [X] T032 [P] [US4] E2E in `tests/e2e/scene-fallback.spec.ts` and `tests/e2e/scene-nowebgl.spec.ts` (own file: it needs its own browser launch): Chromium launched with `--disable-webgl --disable-3d-apis` shows the no-WebGL message and link, list and panels still work (US4-1); `reducedMotion: 'reduce'` shows the choice screen, "Continuer en 3D" loads the scene without camera animation, "Version écrite" goes to the written home (US4-2, FR-024); blocked `room.glb` / model requests show the load error with "Réessayer" (edge case); JavaScript disabled shows the `<noscript>` message (US4-4)

### Implementation for User Story 4

- [X] T033 [US4] `src/scene/capabilities.ts`: WebGL2 then WebGL1 detection, `prefers-reduced-motion`, `navigator.connection?.saveData`, stored `scene.choice` (try/catch), returning `3d | choice | fallback`
- [X] T034 [US4] Choice screen, no-WebGL message, load error with retry and too-slow notice, built by `src/scene/boot.ts` from the page labels (no separate Astro components: they only exist once JavaScript runs)
- [X] T035 [US4] `src/scene/quality.ts` governor wired into `src/scene/renderer.ts`: apply levels (pixel ratio; antialiasing is fixed when the renderer is created and shadows only matter once the real models cast them), store `scene.quality`, show the too-slow proposal at the end (FR-022, FR-023, US4-3)
- [X] T036 [US4] Reduced motion in the scene: no camera easing, instant recenter and focus moves, no idle animation (FR-024)

**Checkpoint**: every fallback path ends on readable content

---

## Phase 7: User Story 5 - Accessibilité et langues (Priority: P2)

**Goal**: keyboard and screen-reader use; language switch keeps the place

**Independent Test**: Tab through all items, Enter opens, Escape closes; screen reader announcements; switch language from an open panel

### Tests for User Story 5 ⚠️

- [X] T037 [P] [US5] E2E in `tests/e2e/scene.spec.ts`: Tab moves through the item list in a logical order with a visible focus and highlights the object in the scene (US5-1); Enter opens the panel and focuses it, Escape closes and returns focus (US5-2); the panel has `aria-labelledby` and the canvas container an accessible name (US5-3); the language switcher link carries the translated fragment and opens the same item in the other language (US5-4, FR-018)

### Implementation for User Story 5

- [X] T038 [US5] List ↔ scene link in `src/scene/panels.ts` and `src/scene/objects.ts`: focus or hover on a list button highlights the object and pans it into view if needed; selecting an object marks its list button `aria-current`
- [X] T039 [US5] Language switcher: update the header switcher's `href` with the translated fragment whenever a panel opens or closes, in `src/scene/panels.ts` (uses `src/scene/hash.ts`)
- [X] T040 [US5] Accessible names and roles in `SceneView.astro`: `#scene` gets `role="application"` and an `aria-label` once the 3D is ready, a polite live region announces the opened item, focus outlines on list buttons

**Checkpoint**: the scene is usable without a mouse and in both languages

---

## Phase 8: User Story 6 - Contenu à jour automatiquement (Priority: P3)

**Goal**: new or changed content appears in the scene at the next build; the export carries what the panels show

**Independent Test**: add a project in `content/`, build, find it in the scene with a correct panel; set an item to draft, it disappears

### Tests for User Story 6 ⚠️

- [X] T041 [P] [US6] Extend `tests/unit/export.test.ts` and `src/lib/export.schema.json` for contracts/export-additions.md: project `kind`, `gallery`, `links[].label`; diploma `skills`, `obtained`, `institutionUrl`; experience `organizationUrl`; `scene` URLs `{ fr, en }` on every item
- [X] T042 [P] [US6] Extend `tests/unit/build-content.test.ts`: the valid-fixture build has a scene page whose manifest lists `project/alpha` and `project/beta` but not `gamma-draft` (US6-2)

### Implementation for User Story 6

- [X] T043 [US6] Add the export fields in `src/lib/export.ts` and `src/pages/data/portfolio.json.ts` (gallery image URLs via `getImage`), keep `schemaVersion: 1` (FR-016)
- [X] T044 [US6] Featured projects: in `src/scene/objects.ts`, load `public/models/featured/<id>.glb` for a featured project with a matching `featured.<id>` slot, falling back to the generic model when the file is missing (US6-3)

**Checkpoint**: the scene follows the content source with no scene edit

---

## Phase 9: Polish, Models & Cross-Cutting Concerns

**Purpose**: real 3D models, budgets and quality gates

- [X] T045 Model the room in Blender per contracts/scene-model.md (units, orientation, `slot.*`, `camera.home`, `bounds`, `screen` / `label` materials, baked lighting), source in `assets-src/models/room.blend`, export to `assets-src/models/room.glb`, optimize with `npm run models:optimize` into `public/models/room.glb` (≤ 1.5 MB)
- [X] T046 [P] Model the generic objects in Blender: `generic-project`, `generic-education`, `generic-experience`, `overflow` (`assets-src/models/*.blend` → `public/models/*.glb`, ≤ 150 / 100 / 100 / 100 KB)
- [X] T047 [P] Model the dedicated objects of the featured projects (`public/models/featured/<id>.glb`, ≤ 300 KB each) and add their `featured.<id>` empties to the room
- [X] T048 [P] Budget check `scripts/check-scene-budget.mjs` and npm script `check:scene`: sizes of `public/models/**` against contracts/scene-model.md and of the scene's JavaScript chunks in `dist/`; total before first interaction ≤ 3 MB (SC-002)
- [X] T049 [P] Frame-rate test `tests/e2e/scene-perf.spec.ts` (Chromium only): CDP CPU throttling ×4, scripted pan / zoom for 10 s, frames counted with `__scene.frames()`; pass if ≥ 30 fps or if quality stepped down and then the too-slow proposal appeared (SC-003)
- [X] T050 [P] Extend `tests/e2e/privacy.spec.ts` to the scene pages, waiting for `__scene.ready` and opening a panel: no third-party request, no cookie (FR-026, SC-008)
- [X] T051 [P] Add `/fr/explorer/` and `/en/explore/` to `lighthouserc.json` with their own assertions (accessibility, best practices, SEO ≥ 0.9; total byte weight ≤ 3 MB) and keep the written-version budgets unchanged
- [X] T052 Extend `scripts/check-seo.mjs` if needed for the scene pages (one `<h1>`, hreflang, JSON-LD) and add `npm run check:scene` to `.github/workflows/ci.yml`
- [X] T053 Update `README.md` (scene, models workflow) and `content/README.md` (featured projects and dedicated models)
- [ ] T054 Run every scenario of `specs/002-isometric-3d-scene/quickstart.md`, record the results there, and do the manual checks on a real Android phone, an iPhone and a screen reader

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks every user story
- **User stories (Phases 3–8)**: depend on Foundational; US1 → US2 (both P1) first, then US3, US4, US5 in any order, then US6
- **Polish (Phase 9)**: models (T045–T047) can start any time after Phase 2 since the code works with the provisional room; the checks (T048–T054) come last

### User Story Dependencies

- **US1 (P1)**: after Phase 2
- **US2 (P1)**: after US1 (needs panels)
- **US3 (P2)**: after US1
- **US4 (P2)**: after Phase 2 (fallbacks wrap the 3D boot); independent of US1–US3
- **US5 (P2)**: after US1 (needs panels and list behaviour)
- **US6 (P3)**: export part independent; featured models need US1 objects

### Within Each User Story

- Tests first, failing, then implementation
- Story checkpoint before the next priority

### Parallel Opportunities

- Setup: T002–T004
- Foundational: T005–T008 (pure logic), T010–T011, T017
- US4 tests T030–T032 together; US6 T041–T042 together
- Polish: T046–T051 together; models in Blender in parallel with any code phase

---

## Parallel Example: Foundational

```bash
Task: "layout() tests in tests/unit/scene-layout.test.ts"
Task: "hash parse/build in src/scene/hash.ts with tests"
Task: "manifest in src/lib/scene-manifest.ts with tests"
Task: "SceneItemList in src/components/scene/SceneItemList.astro"
Task: "ScenePanel in src/components/scene/ScenePanel.astro"
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2)

1. Phase 1 and Phase 2 (HTML page, manifest, 3D core with the provisional room)
2. US1: panels from the scene
3. US2: "En savoir plus" and state restore
4. **Stop and validate** on desktop

### Incremental Delivery

1. MVP (US1 + US2) on the provisional room
2. US4 fallbacks, then US3 mobile, then US5 accessibility and languages
3. US6 export additions and featured models
4. Models from Blender replace the provisional room without code changes (contract)
5. Budgets, performance, privacy, Lighthouse, quickstart, then release with the written version

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Commit after each task or logical group; one PR per phase, like spec 001
- The 3D models (T045–T047) are design work in Blender; they can be done with the Blender
  connection of this environment or by Sébastien directly
