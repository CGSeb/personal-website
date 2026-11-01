---

description: "Task list for the low-poly avatar in the 3D scene"
---

# Tasks: Avatar low-poly dans la scène 3D

**Input**: Design documents from `/specs/004-scene-avatar/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/avatar.md, quickstart.md

**Tests**: included. The plan and the quickstart require them (Vitest, Playwright), and the
constitution's quality gates require Lighthouse and the scene budgets.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4, from spec.md)
- Same Astro project as specs 001–003: views in `src/views/`, components in `src/components/`,
  client code of the scene in `src/scene/`, models built by `assets-src/models/build_models.py`
- **Decision gate**: Sébastien validates the likeness on renders (T008). Nothing after it may
  start before this validation is recorded: a change of pose or proportions means a new bake
- `blender` is not on the PATH of this machine. Blender 5.2 is at
  `C:\Users\Sebastien\Documents\VoxelShift\stable\blender-5.2.0-windows-x64\blender.exe`
- Code comments in English, user-facing text in `src/i18n/ui.ts`, colours from the roles of
  `src/styles/tokens.css`; commits follow `type: emoji Message`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the texts and the budget line every later phase relies on

- [ ] T001 [P] Give `avatar.glb` a row with no per-file cap in `scripts/check-scene-budget.mjs` (its size is printed, it never fails on its own); the 3 MB total stays blocking and still counts it (research § 11)
- [ ] T002 [P] Add `scene.avatar.name`, `scene.avatar.welcome` and `scene.group.welcome` in both languages in `src/i18n/ui.ts`, with the exact texts of contracts/avatar.md; add `avatar: { name, welcome }` to `SceneLabels` in `src/scene/labels.ts` and to the `scene-labels` JSON in `src/views/SceneView.astro`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what lets the figure behave like the placed objects

- [ ] T003 Extract from `placeObjects` in `src/scene/objects.ts` an exported `withHitShape(key, root)` that builds the invisible hit shape (`HIT_SCALE`) and `setState`, and returns a `PlacedObject`; `placeObjects` uses it, with no change of behaviour (`npm run test:e2e -- scene.spec` still passes)
- [ ] T004 [P] Add `avatar(): { shown: boolean; waving: boolean }` to `SceneTestHook` in `src/scene/test-hook.ts`, to `SceneHandle` in `src/scene/scene3d.ts` (`shown: false`, `waving: false` for now) and to `installTestHook` in `src/scene/boot.ts`

**Checkpoint**: nothing visible has changed; all existing checks pass

---

## Phase 3: User Story 1 - Reconnaître Sébastien dans sa pièce (Priority: P1) 🎯 MVP

**Goal**: the figure sits at the desk, face visible, in the right light by day and by night, without getting in the way of any object

**Independent Test**: open the scene in light and dark, on desktop and phone: the figure is in its place, its face shows from the first view, and every object around it can still be selected

### Model and validation

- [x] T005 [US1] Add the `avatar-*` materials and `build_tower_avatar()` to `assets-src/models/tower_room.py`, following contracts/avatar.md and research § 1–3: origin on the seat, front towards +Z, rigid parts, faceted, no texture; oversized head, short brown hair with volume on top, short full beard and moustache, dark rectangular glasses, fair skin, brick-red T-shirt, dark trousers, seated pose; right arm under the empty `avatar.arm` at the shoulder, its parts bent and rigid; empty `avatar.head` at the top of the head; register it in `TOWER_OBJECTS` (scale 1.0)
- [x] T006 [US1] Add `assets-src/models/render_avatar.py`: renders `avatar` from the front and at three-quarters, and in the room from the scene's isometric direction `(1, 1, 1)`, to `specs/004-scene-avatar/captures/` (PNG, with an extra crop at the size of a phone view: a head of about 20 px)
- [x] T007 [US1] Build and render: run `build_models.py -- --only avatar` then `render_avatar.py`; place the photo `content/profile-photo.webp` beside the renders in `specs/004-scene-avatar/captures/README.md`, and iterate on T005 until the main features read at phone size
- [x] T008 [US1] **Validation by Sébastien** (quickstart A, scenarios 1–2): show the renders, adjust on feedback, record the decision in `specs/004-scene-avatar/quickstart.md`

**Checkpoint**: likeness validated; only now may the bake start

### Room

- [ ] T009 [US1] Move the chair into `_chair(b, x, z, rot)` in `assets-src/models/tower_room.py` (same parts, rotated) and call it with `rot = π/4`, front towards `+X +Z` (research § 6); check on a quick render without baking that neither the back nor the casters go through the desk, and move the chair if needed (quickstart scenario 3)
- [ ] T010 [US1] Add the `avatar.seat` empty (position on the seat, same rotation as the chair) in `tower_markers()` of `assets-src/models/tower_room.py`, through a new `avatar_seat` argument of `room_markers()` in `assets-src/models/build_models.py`
- [ ] T011 [US1] In `build_tower_room_baked` of `assets-src/models/tower_room.py`, add the figure to the Blender scene after `_join_room()`, placed at the seat, keep it for both bakes and remove it before `tower_markers()` and the export, so `room.glb` holds only its shadow (research § 5; check that `room.glb` has no `avatar-*` material)
- [ ] T012 [US1] Rebuild: `build_models.py -- --only avatar --only room`, then `npm run models:optimize`; `public/models/avatar.glb`, `room.glb`, `room-day.webp`, `room-night.webp` are refreshed and `npm run build` + `npm run check:scene` pass; record the size of `avatar.glb`

### Scene

- [ ] T013 [P] [US1] Read `avatar.seat` in `describe()` of `src/scene/room.ts` into `Room.avatarSeat: THREE.Object3D | null`
- [ ] T014 [US1] Create `src/scene/avatar.ts` with `AVATAR_KEY` and `loadAvatar(room, models, options)` per contracts/avatar.md: null when the file is not in `models`, the seat is missing or the load fails; places the root at the seat; uses `withHitShape`; `head()` gives the world position of `avatar.head`. `wave()` and `waving()` are stubs until T021
- [ ] T015 [US1] In `src/scene/picking.ts`, let every other object win over the figure when a ray hits both, whatever the distance (`hit.userData.yields`, set by `avatar.ts`; contracts/avatar.md § Sélection)
- [ ] T016 [US1] In `createScene` of `src/scene/scene3d.ts`: load the figure without delaying the other objects, `stage.scene.add` root and hit, `lighting.adopt`, add it to `objects` and `byKey` so highlight, `screenPosition('avatar')` and picking work; `onHover` shows `labels.avatar.name` in the tooltip; `onSelect('avatar')` must not reach `panels.open`; `avatar().shown` in the handle
- [ ] T017 [US1] Create `tests/e2e/scene-avatar.spec.ts` (helpers as in `tests/e2e/scene.spec.ts`): figure shown by day and by night, in portrait and landscape, and its position inside the view (quickstart 4); every existing object opens its panel when selected at its screen position, including on the mobile projects (quickstart 5, SC-006)

**Checkpoint**: US1 stands alone: the figure is there and nothing else has changed

---

## Phase 4: User Story 2 - Être salué et lire une présentation (Priority: P1)

**Goal**: hovering waves; a click or a tap waves and opens the welcome bubble, with no link, which can be closed

**Independent Test**: hover then click the figure, in both languages, on desktop and phone, and check the wave, the text of the bubble and how it closes

- [ ] T018 [P] [US2] Create `tests/unit/scene-wave.test.ts`: `waveAngle` is 0 at 0 and from `WAVE_MS` on, `WAVE_MS ≤ 2000`, the arm goes up in between
- [ ] T019 [P] [US2] Create `tests/unit/scene-bubble.test.ts` for `bubblePosition` (above and centred on the anchor; kept inside the scene at each edge and at 320 px) and extend `tests/unit/scene-hash.test.ts` for `welcomeHash`, `isWelcomeHash` and `translateHash` on `#bienvenue` / `#welcome`, with `parseHash` still null for them
- [ ] T020 [P] [US2] Create `src/scene/wave.ts` (`WAVE_MS`, `waveAngle`: up, two beats, down) and add `welcomeHash` and `isWelcomeHash` to `src/scene/hash.ts`, with the `translateHash` case
- [ ] T021 [US2] Implement `wave()` and `waving()` in `src/scene/avatar.ts`: a `requestAnimationFrame` loop that lives only during the gesture, as the day / night fade in `scene3d.ts`, rotates `avatar.arm` with `waveAngle`, calls `requestRender` and ends at exactly the rest pose; ignored while running and when `reducedMotion` is true (data-model.md § États du geste)
- [ ] T022 [US2] Add the bubble element to `src/views/SceneView.astro` per contracts/avatar.md (`role="dialog"`, `aria-labelledby`, `tabindex="-1"`, `hidden`, text, close button with `scene.close`, **no link**) and its styles, with a tail towards the head, the scene's colour roles, AA contrast in both themes, text wrapping at 320 px
- [ ] T023 [US2] Create `src/scene/bubble.ts`: class `Bubble` and pure `bubblePosition` per contracts/avatar.md. Open: show, focus (`preventScroll`), set the fragment with `history.replaceState`. Close by its button, Escape and a click outside; `.language-switcher`, `[data-theme-toggle]`, `.scene-list`, `[data-recenter]` and the canvas are excluded from "outside", as for the panels. On close: fragment removed, focus back to the opener
- [ ] T024 [US2] Make `syncLanguageSwitcher` public in `src/scene/panels.ts`, and call it from `Bubble` on open and on close, so the language link carries the translated fragment
- [ ] T025 [US2] Wire it all in `src/scene/scene3d.ts`: hover entering the figure → `wave()`; `onSelect('avatar')` → `wave()` and `bubble.toggle(canvas)`; any other selection or empty click closes the bubble; opening the bubble calls `panels.close()`, and `panels.events.onChange` closes it when a panel opens; `refreshStates` shows the figure as `selected` while open; `stage.onRender` calls `bubble.reposition(toScreen(avatar.head()))` while open; on the controls' `change` event, close it if the figure left the view (`isVisible`; research § 8); `avatar().waving` in the handle
- [ ] T026 [US2] Open the bubble without a wave when the page arrives with the welcome fragment, once the figure is loaded (in `src/scene/scene3d.ts`, after `panels.openFromHash`); without a figure the fragment is ignored
- [ ] T027 [US2] Extend `tests/e2e/scene-avatar.spec.ts`: quickstart scenarios 6, 7, 9, 10, 11, 12, 13, 14 (hover waves with no bubble; one wave only when hovered repeatedly; click and tap: exact text, one button, zero `a` in the bubble; follows the view, closes off-screen; every way of closing; one of bubble or panel; language keeps it open, without a wave; theme keeps it open)

**Checkpoint**: US1 and US2 work: the figure greets and welcomes

---

## Phase 5: User Story 3 - Le même accès pour tout le monde (Priority: P2)

**Goal**: keyboard and screen readers get the same text; reduced motion gets no wave; without 3D nothing is missing

**Independent Test**: walk through the scene with the keyboard and a screen reader, then with reduced motion on, then without WebGL and without JavaScript

- [ ] T028 [US3] Add to the end of `src/components/scene/SceneItemList.astro` the hidden section `data-avatar-entry` of contracts/avatar.md (`scene.group.welcome`, button with `scene.avatar.name`), and its style if the list's does not already cover it
- [ ] T029 [US3] In `src/scene/scene3d.ts`, when the figure is loaded: reveal the section, have its button call `wave()` and `bubble.toggle(button)` then bring the figure into view, and highlight the figure on focus and hover as `Panels.enhanceList` does for the other entries; keep the section hidden when `loadAvatar` returns null
- [ ] T030 [US3] Extend `tests/e2e/scene-avatar.spec.ts`: quickstart scenarios 15, 16 (list entry at the keyboard, focus into the bubble, Escape returns it to the entry; with `reducedMotion: 'reduce'`, `waving` stays false and selection opens the bubble)
- [ ] T031 [P] [US3] Extend `tests/e2e/scene-nojs.spec.ts` and `tests/e2e/scene-nowebgl.spec.ts`: the entry and the bubble do not show (quickstart 17), and the welcome fragment is harmless there

**Checkpoint**: the figure is reachable by everyone, and nothing depends on it

---

## Phase 6: User Story 4 - Une figurine qui ne coûte rien à la scène (Priority: P2)

**Goal**: no visible cost for the visitor; no frame at rest; a failed model changes nothing else

**Independent Test**: run the existing budget, frame-rate and Lighthouse checks, and measure that no frame is drawn at rest or after a wave

- [ ] T032 [US4] Extend `tests/e2e/scene-avatar.spec.ts`: `__scene.frames()` stays still at rest and within a second after a wave (quickstart 8, SC-005); with `avatar.glb` blocked by `page.route`, the scene stays usable, with no list entry and no blocking error (quickstart 18); 320 px in both languages, the bubble fully inside (quickstart 19); time from selection to visible bubble under 100 ms (SC-007)
- [ ] T033 [P] [US4] Add a wave during the measurement in `tests/e2e/scene-perf.spec.ts`, and the figure's requests to the allowed set of `tests/e2e/privacy.spec.ts` if the test lists them (quickstart 20)
- [ ] T034 [US4] Run `npm test`, `npm run build`, `npm run check:seo`, `npm run check:scene`, `npm run test:e2e`, `npm run lhci`; Lighthouse ≥ 90 in every category on every URL (target 100); fix any regression; if the total goes over 3 MB, stop and report the sizes to Sébastien (SC-003)

**Checkpoint**: all automated checks pass

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T035 [P] Update `README.md` and `assets-src/models/README.md` (the figure, the bake with the figure present, `render_avatar.py`, a pose change means a new bake) and link [contracts/avatar.md](contracts/avatar.md) from `specs/002-isometric-3d-scene/contracts/scene-model.md`
- [ ] T036 Record the results of quickstart B in `specs/004-scene-avatar/quickstart.md`, with the measured size of `avatar.glb`
- [ ] T037 Manual checks (quickstart C, scenarios 23–25), by Sébastien: real Android phone by day and by night, NVDA in both languages, overall look of the figure and its shadow; adjust the light or the model if needed, and record the results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependency
- **Foundational (Phase 2)**: T004 after nothing; T003 before T014
- **US1 (Phase 3)**: after Phase 2. T005 → T006 → T007 → **T008 (gate)** → T009 → T010 → T011 → T012 → T013–T016 → T017
- **US2 (Phase 4)**: after US1 (it needs the figure)
- **US3 (Phase 5)**: after US2 (the list entry opens the bubble)
- **US4 (Phase 6)**: after US2; T034 after US3
- **Polish (Phase 7)**: last

### Within Each User Story

Unit tests are written before the code they check (T018, T019 before T020). The e2e tests close each phase, since they need the rebuilt models and the wiring.

### Parallel Opportunities

- T001 and T002; T003 and T004
- T018, T019 and T020 touch different files
- T031 and T033 are separate from `scene-avatar.spec.ts`
- T013 can run while the bake of T012 runs

## Parallel Example: User Story 2

```text
T018 tests/unit/scene-wave.test.ts
T019 tests/unit/scene-bubble.test.ts, tests/unit/scene-hash.test.ts
T020 src/scene/wave.ts, src/scene/hash.ts
```

## Implementation Strategy

### MVP First

Phases 1–3: the figure at the desk, by day and by night, without any reaction. It can be shown and judged as it is: no later work is lost if the likeness has to change, as long as T008 is respected.

### Incremental Delivery

1. Phases 1–3: the figure is there (PR)
2. Phase 4: wave and bubble (PR, or with the next one)
3. Phases 5–6: access, fallbacks and checks (PR)
4. Phase 7: documents and manual checks

### Notes

- Each PR gets Auto-fix on, as for the previous specs
- After a change to `tower_room.py` that touches the chair or the figure's pose, rebuild `room` (bake) as well as `avatar`
- The bake takes several minutes on the GPU: run it in the background
- Not in the scope: moving the figure, other animations, sound, dialogue, weight limit
