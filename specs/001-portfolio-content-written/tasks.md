---

description: "Task list for the bilingual written portfolio and shared content source"
---

# Tasks: Portfolio écrit bilingue et source de contenu commune

**Input**: Design documents from `/specs/001-portfolio-content-written/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: included. The plan (research § 13) and the constitution's quality gates require
Vitest unit tests, Playwright end-to-end tests (with and without JavaScript, network audit) and
Lighthouse CI budgets.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6, from spec.md)
- Single Astro project at repository root; content in `content/`, code in `src/`, tests in `tests/`
- Pages are one thin file per language under `src/pages/fr/` and `src/pages/en/` that render a shared view from `src/views/` (translated segments cannot share one `[lang]` route tree without route collisions); later tasks that name `src/pages/[lang]/…` follow the same pattern
- Before using an Astro API (content loaders, i18n options, `astro:assets`, redirects), check its
  exact name in the docs of the installed Astro 7 version (research § 1)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize the Astro 7 project at the repository root with TypeScript strict: create `package.json` (name `personal-website`, `"type": "module"`, `"engines": { "node": ">=24" }`), `astro.config.mjs` with `output: 'static'`, `trailingSlash: 'always'`, `site: 'https://example.com'` (placeholder until hosting is chosen), and `tsconfig.json` extending Astro's strict preset
- [X] T002 Install dependencies in `package.json`: `astro@^7.4`, `@astrojs/sitemap@^3.7`, `yaml`, `schema-dts`; dev: `typescript`, `vitest@^5`, `@playwright/test@^1.64`, `@lhci/cli`, `prettier`, `prettier-plugin-astro`
- [X] T003 [P] Add npm scripts to `package.json`: `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright test), `lhci` (lhci autorun), `check:seo` (node scripts/check-seo.mjs), `check:links` (node scripts/check-links.mjs), `format`
- [X] T004 [P] Configure Prettier in `.prettierrc` (with `prettier-plugin-astro`) and add `.gitignore` entries for `node_modules/`, `dist/`, `.astro/`, `test-results/`, `playwright-report/`, `.lighthouseci/`
- [X] T005 [P] Configure Vitest in `vitest.config.ts` (test files `tests/unit/**/*.test.ts`)
- [X] T006 [P] Configure Playwright in `playwright.config.ts`: `webServer` runs `npm run build && npm run preview`; projects `desktop-chromium`, `mobile-webkit` (iPhone device), `chromium-320` (viewport 320×640), and `chromium-nojs` (`javaScriptEnabled: false`)
- [X] T007 Create the folder skeleton from plan.md: `content/{pages/home,pages/career,pages/contact,projects,education,experience}`, `src/{content,i18n,lib,components,layouts,styles,pages}`, `public/fonts`, `scripts`, `tests/{unit,e2e,fixtures/content/valid,fixtures/content/invalid}`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: content source, schemas, bilingual routing and base layout that every story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Content schemas and collections

- [X] T008 Implement shared Zod schemas in `src/content/schemas.ts` (data-model.md "Types communs"): `Id` = kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`, 2–60 characters; `LocalizedText` = `{ fr, en }` "les deux clés obligatoires, non vides après suppression des espaces"; `LocalizedSlug` = `{ fr?: Id, en?: Id }`; `YearMonth` = `AAAA-MM` with valid month; `Period` = `{ start, end? }` with "`end` ≥ `start`"; `Image` = `{ src, alt: LocalizedText, decorative?: boolean }` with "`alt` obligatoire sauf si `decorative: true`"; `Link` = `{ kind: demo | code | video | article | other, url, label? }` with "URL absolue en `https`"; `Status` = `published | draft`, default `published`
- [X] T009 Declare the collections in `src/content.config.ts` (loaders reading `content/`): `profile` (from `content/profile.yaml`), `categories`, `technologies` (lists `{ id: Id, label: LocalizedText }`), `projects`, `education`, `experience` (one entry per `<id>/meta.yaml` plus its `fr.md`/`en.md` bodies), `pages` (`content/pages/<page>/{fr,en}.md` with frontmatter `{ title, description }`, description 50–160 characters), `redirects` (`{ from, to }`)
- [X] T010 Define the `profile` schema in `src/content.config.ts` per data-model.md: `name` (required), `headline` LocalizedText (required), `summary` LocalizedText "2–3 phrases, ≤ 300 caractères" (required), `photo` Image (required), `location` LocalizedText, `languages` list of `{ code: ISO 639-1, level: LocalizedText }`, `email` (required, valid e-mail), `profiles` list of `{ network: linkedin | github | youtube | x | mastodon | other, url, label? }`, `jobTitle` LocalizedText
- [X] T011 Define the `projects` schema in `src/content.config.ts`: `id` Id "= nom du dossier"; `title` LocalizedText "≤ 80 caractères"; `summary` LocalizedText "50–160 caractères"; `role` LocalizedText; `period` Period; `categories` list of Id "≥ 1"; optional `technologies`, `cover` Image, `gallery` Image[], `links` Link[], `experience` Id[], `education` Id[], `featured` (default `false`), `order` integer, `slug` LocalizedSlug, `status`, `kind` `software | creative` (default `software`)
- [X] T012 [P] Define the `education` schema in `src/content.config.ts`: `id`, `title` LocalizedText, `institution` string + optional `institutionUrl`, `location` LocalizedText, `period` Period (or `start` only with `obtained: true`), optional `level` LocalizedText, `skills` LocalizedText[], `slug`, `status`
- [X] T013 [P] Define the `experience` schema in `src/content.config.ts`: `id`, `position` LocalizedText, `organization` string + optional `organizationUrl`, `location` LocalizedText, `type` `employment | freelance | internship | apprenticeship | volunteer`, `period` Period ("`end` absent = en cours"), optional `technologies` Id[], `slug`, `status`
- [X] T014 Implement the cross-check in `src/content/validate.ts` (data-model.md rules 1–7): id equals folder name and unique per collection; `fr.md` and `en.md` present and non-empty; every referenced Id exists; published element referencing a `draft` → warning and reference ignored; slugs unique per language and collection; each Image file exists with FR/EN alt or `decorative: true`; redirects without loops and with an existing `to`. Errors use the format `content/<collection>/<id>/<fichier> : <champ> — <problème>` and fail the build
- [X] T015 Implement the content access layer in `src/content/index.ts`: `getPublished(collection)` (drops `draft`), sorting (projects: `order` ascending, else `period.start` descending; career: most recent first), computed reverse relations (projects of an experience / diploma), and lookup helpers by id; run `validate.ts` once per build
- [X] T016 [P] Unit tests for schemas and cross-check in `tests/unit/content.test.ts` using `tests/fixtures/content/valid/` and `tests/fixtures/content/invalid/` (missing translation, broken reference, duplicate id, bad period, missing alt): each invalid case produces the expected message
- [X] T017 [P] Create valid fixtures in `tests/fixtures/content/valid/` (profile, 2 categories, 3 technologies, 3 projects incl. one `draft` and one `featured`, 1 diploma, 2 experiences incl. one ongoing) and invalid fixtures in `tests/fixtures/content/invalid/`

### Bilingual routing and layout

- [X] T018 Implement route helpers in `src/i18n/routes.ts` per contracts/routes.md: `Lang = 'fr' | 'en'`; translated segments (`projets`/`projects`, `categorie`/`category`, `parcours`/`career`, `diplomes`/`education`, `experiences`/`experience`, `contact`); `urlFor(type, lang, idOrSlug?)`; `slugFor(element, lang)` (localized slug else id); `alternateOf(type, id, lang)` returning the same page in the other language
- [X] T019 [P] Interface labels FR/EN in `src/i18n/ui.ts` (navigation, buttons, "depuis"/"present", "Page introuvable", filter labels, experience types, link kinds) with a `t(lang, key)` helper typed so a missing key fails type-checking
- [X] T020 [P] Unit tests for routes in `tests/unit/routes.test.ts`: every page type in both languages matches the table in contracts/routes.md; `alternateOf` round-trips; trailing slash always present
- [X] T021 [P] Design tokens and base styles in `src/styles/tokens.css` and `src/styles/base.css`: CSS custom properties (colors, spacing, fluid type with `clamp()`), light/dark via `prefers-color-scheme`, `prefers-reduced-motion` disables non-essential animation, layout fluid from 320 px to 2560 px with no horizontal scroll
- [X] T022 [P] Self-host fonts: Inter variable bundled from `@fontsource-variable/inter` (served from the site, `font-display: swap`, unicode ranges so only latin files load), imported in `src/styles/fonts.css`
- [X] T023 Base layout in `src/layouts/BaseLayout.astro`: `<html lang>`, skip link, `<header>` with `<nav>`, `<main>`, `<footer>`; props `lang`, `title`, `description`, `canonicalPath`, `alternates`, `jsonLd`, `ogImage`; imports styles; no client script
- [X] T024 [P] Header and footer components in `src/components/Header.astro` and `src/components/Footer.astro`: main navigation Accueil/Home, Projets/Projects, Parcours/Career, Contact (FR-011), current page marked with `aria-current="page"`, footer link to Contact
- [X] T025 Seed real-structure content to develop against: `content/profile.yaml`, `content/categories.yaml`, `content/technologies.yaml`, `content/pages/{home,career,contact}/{fr,en}.md`, 3 projects, 1 diploma, 2 experiences (placeholder texts marked for Sébastien to replace), `content/redirects.yaml` empty list

**Checkpoint**: `npm run build` validates the content and produces an empty bilingual shell

---

## Phase 3: User Story 1 - Découvrir les projets (Priority: P1) 🎯 MVP

**Goal**: home page, project list, category pages and project detail pages, in both languages, readable without JavaScript

**Independent Test**: build with only home and projects; a visitor reaches a specific project's detail page in ≤ 2 clicks on desktop and phone, with JavaScript disabled too

### Tests for User Story 1 ⚠️

> Write these tests first and make sure they fail before implementation

- [X] T026 [P] [US1] E2E test in `tests/e2e/projects.spec.ts`: home shows name, headline, summary and featured projects (US1-1); list → project page shows title, summary, context, role, technologies, period, visuals, links (US1-2); previous/next and back-to-list work (US1-3); runs in the `chromium-nojs` and `chromium-320` projects too (US1-4, FR-010, FR-024)

### Implementation for User Story 1

- [X] T027 [P] [US1] `ProjectCard` component in `src/components/ProjectCard.astro`: cover via `astro:assets` `<Picture>` (AVIF + WebP, `srcset`, width/height set, `loading="lazy"` unless above the fold), title, summary, categories; whole card is a single link
- [X] T028 [P] [US1] Default project visual in `public/images/default-cover.svg`, used when `cover` is absent (edge case "ni visuel ni lien externe")
- [X] T029 [P] [US1] `Period` component in `src/components/Period.astro`: formats `YearMonth` per language, ongoing shows "depuis …" / "since …" style label from `ui.ts`
- [X] T030 [P] [US1] `VideoFacade` component in `src/components/VideoFacade.astro`: shows a local poster and a play button; the third-party iframe is injected only on click (small inline script); without JavaScript it is a plain link to the video (FR-023)
- [X] T031 [P] [US1] `ProjectLinks` component in `src/components/ProjectLinks.astro`: renders `links` by `kind` with labels from `ui.ts`, `rel="noopener"`, video links through `VideoFacade`
- [X] T032 [US1] Home page in `src/views/HomeView.astro`, rendered by `src/pages/fr/index.astro` and `src/pages/en/index.astro`: profile photo, name, headline, summary, long presentation from `content/pages/home/<lang>.md`, featured projects grid, link to all projects; hidden placeholder slot for the future 3D entry point (FR-012, rendered only when a `show3dEntry` flag is true, false for now)
- [X] T033 [US1] Project list in `src/views/ProjectListView.astro`, rendered by `src/pages/fr/projets/index.astro` and `src/pages/en/projects/index.astro`: all published projects sorted per T015, category navigation linking to category pages (FR-009)
- [X] T034 [US1] Category pages in `src/pages/fr/projets/categorie/[cat].astro` and `src/pages/en/projects/category/[cat].astro` (same view, paths from `src/lib/paths.ts`): one page per category that has at least one published project; categories without published projects generate no page
- [X] T035 [US1] Project detail page in `src/views/ProjectView.astro`, rendered by `src/pages/fr/projets/[slug].astro` and `src/pages/en/projects/[slug].astro`: title, summary, role, period, technologies, categories, cover and gallery, long description from `<lang>.md`, links, linked experiences and diplomas, previous/next project, back to list
- [X] T036 [US1] Make the Phase 3 E2E test pass and check the 320 px layout with long titles (edge case "texte très long")

**Checkpoint**: the written portfolio with projects is usable and publishable on its own

---

## Phase 4: User Story 2 - Consulter le parcours (Priority: P2)

**Goal**: career page with experiences and diplomas, each with its own page

**Independent Test**: open the career page; every diploma and experience appears most recent first with its key information and its own page

### Tests for User Story 2 ⚠️

- [X] T037 [P] [US2] E2E test in `tests/e2e/career.spec.ts`: career page lists experiences and diplomas most recent first with title, organization, location, period (US2-1); experience page lists and links its projects (US2-2); ongoing experience shows the ongoing label instead of an end date (US2-3)

### Implementation for User Story 2

- [X] T038 [P] [US2] `Timeline` component in `src/components/Timeline.astro`: semantic `<ol>` of entries with title, organization/institution, location, `Period`, link to the detail page
- [X] T039 [US2] Career page in `src/views/CareerView.astro`, rendered by `src/pages/fr/parcours/index.astro` and `src/pages/en/career/index.astro`: intro from `content/pages/career/<lang>.md`, experiences timeline then education timeline
- [X] T040 [P] [US2] Experience detail page in `src/views/CareerItemView.astro` (shared with diplomas, related projects in `src/components/RelatedProjects.astro`), rendered by `src/pages/fr/parcours/experiences/[slug].astro` and `src/pages/en/career/experience/[slug].astro`: position, organization (linked when `organizationUrl`), location, type label, period, technologies, description from `<lang>.md`, related projects (computed reverse relation)
- [X] T041 [P] [US2] Diploma detail page in `src/views/CareerItemView.astro`, rendered by `src/pages/fr/parcours/diplomes/[slug].astro` and `src/pages/en/career/education/[slug].astro`: title, institution, location, period or obtained date, level, skills, description, related projects

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Lire le site dans sa langue (Priority: P2)

**Goal**: language switcher that keeps the page, root `x-default` page with language redirect, correct `lang`/`hreflang`

**Independent Test**: from any page, switching language lands on the same page in the other language, fully translated

### Tests for User Story 3 ⚠️

- [X] T042 [P] [US3] E2E test in `tests/e2e/language.spec.ts`: on every page type the switcher leads to the same page in the other language (US3-1); `/` redirects to `/fr/` with a French browser locale and to `/en/` otherwise, and shows both links without JavaScript (US3-2); each page has `<html lang>` and reciprocal `hreflang` fr/en/x-default links (US3-3)

### Implementation for User Story 3

- [X] T043 [P] [US3] `LanguageSwitcher` component in `src/components/LanguageSwitcher.astro`: link to `alternateOf(...)` with `hreflang` and `lang` attributes, included in `Header.astro` (FR-014)
- [X] T044 [US3] Pass `alternates` from every page to `BaseLayout.astro` and render `<link rel="alternate" hreflang="fr|en|x-default">` (FR-013)
- [X] T045 [US3] Root page in `src/pages/index.astro`: `x-default`, links to `/fr/` and `/en/`, `hreflang` links, inline script < 1 KB redirecting via `navigator.languages` (French → `/fr/`, else `/en/`) (FR-015, research § 5)
- [X] T046 [US3] Not-found page in `src/pages/404.astro` (with the root page, uses `src/layouts/BilingualLayout.astro`): bilingual message, links to both home pages and project lists (edge case "adresse qui n'existe pas")

**Checkpoint**: both languages are complete and linked everywhere

---

## Phase 6: User Story 4 - Être trouvé par les moteurs de recherche et les IA (Priority: P2)

**Goal**: unique titles and descriptions, canonical URLs, Open Graph, JSON-LD, sitemap, robots.txt, llms.txt

**Independent Test**: every page passes structured-data parsing and the SEO check; the sitemap lists every page; `llms.txt` describes the content accurately

### Tests for User Story 4 ⚠️

- [X] T047 [P] [US4] Unit tests in `tests/unit/jsonld.test.ts`: each generator returns the expected `@type` (`Person` + `ProfilePage`, `SoftwareSourceCode` or `CreativeWork` by `kind`, `EducationalOccupationalCredential`, `EmployeeRole`/`OrganizationRole`, `BreadcrumbList`) linked to the `Person`
- [X] T048 [P] [US4] Unit tests in `tests/unit/llms.test.ts`: `llms.txt` follows the llmstxt.org layout (H1 name, blockquote summary, sections with absolute links), FR then EN, drafts absent; `llms-full.txt` contains every long description
- [X] T049 [P] [US4] SEO check script in `scripts/check-seo.mjs` (run on `dist/`): every HTML page has a unique `<title>` and meta description, a canonical URL, OG tags, one `<h1>`, parsable JSON-LD; sitemap URLs = all HTML pages except redirects (SC-003)

### Implementation for User Story 4

- [X] T050 [P] [US4] SEO helper in `src/lib/seo.ts`: builds title (`<page> — <name>`), description, canonical, alternates and Open Graph / Twitter tags; rendered by `BaseLayout.astro` (FR-016)
- [X] T051 [P] [US4] JSON-LD generators in `src/lib/jsonld.ts` typed with `schema-dts` (FR-017, research § 7), injected via the `jsonLd` prop of `BaseLayout.astro` on every page type
- [X] T052 [US4] Default Open Graph image generated at build time in `src/pages/og/[lang].png.ts` (name + headline); project pages use their cover (US4-4)
- [X] T053 [US4] Sitemap: endpoint `src/pages/sitemap.xml.ts` built from `src/lib/pages.ts`, with `xhtml:link` hreflang alternates (FR-018). `@astrojs/sitemap` pairs languages by identical paths, so it cannot link translated slugs
- [X] T054 [P] [US4] `src/pages/robots.txt.ts`: allow all, reference `sitemap.xml` with the absolute site URL
- [X] T055 [US4] `src/lib/llms.ts` and endpoints `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts` generated from the published collections (FR-019)
- [X] T056 [US4] Audit semantic HTML across page templates (FR-020): one `<h1>`, ordered headings, landmarks, alt on every meaningful image; fix findings in the components and pages

**Checkpoint**: the site is fully indexable and readable by AI agents

---

## Phase 7: User Story 6 - Ajouter ou modifier un contenu (Priority: P2)

**Goal**: one-place editing with clear build errors, drafts, redirects, and the documented JSON export for the future 3D scene

**Independent Test**: add a complete project under `content/projects/<id>/`, rebuild; it appears in the list, its FR/EN pages, linked experience, sitemap, `llms.txt` and `/data/portfolio.json`

### Tests for User Story 6 ⚠️

- [X] T057 [P] [US6] JSON Schema of the export in `src/lib/export.schema.json` matching contracts/portfolio-export.md (`schemaVersion: 1`, no `email`, no long descriptions, `urls` per language)
- [X] T058 [P] [US6] Unit tests in `tests/unit/export.test.ts`: export validates against the schema; drafts absent; reverse relations present; ids identical to the content source (US6-4)
- [X] T059 [P] [US6] Build-level test in `tests/unit/build-content.test.ts` (real `astro build` with `CONTENT_DIR` pointing at the fixtures and its own `ASTRO_CACHE_DIR`): building with `tests/fixtures/content/invalid/` fails and names the file and field (US6-2; Astro stops at the first schema error, the cross-check lists all of its own); a `draft` project is absent from pages, sitemap, `llms.txt` and export (US6-3)

### Implementation for User Story 6

- [X] T060 [US6] Export builder in `src/lib/export.ts` and endpoint `src/pages/data/portfolio.json.ts` (FR-006, contracts/portfolio-export.md)
- [X] T061 [US6] Redirects: read `content/redirects.yaml` in `astro.config.mjs` and pass it to Astro's `redirects` option so each `from` becomes a static redirect page with `rel=canonical` to `to` (FR-025, research § 6)
- [X] T062 [P] [US6] Content editing guide in `content/README.md`: folder layout, required fields, a copy-paste project template, how to mark `draft`/`featured`, how to add a redirect when an id or slug changes, how to read build errors (SC-005)

**Checkpoint**: content can be added safely in one place and is exported for the 3D scene

---

## Phase 8: User Story 5 - Prendre contact (Priority: P3)

**Goal**: contact page with a protected e-mail link and profile links, no form

**Independent Test**: from the contact page, open the e-mail link in a mail client and follow the profile links

### Tests for User Story 5 ⚠️

- [ ] T063 [P] [US5] E2E test in `tests/e2e/contact.spec.ts`: contact page has a working `mailto:` link and the profile links (US5-1); the plain e-mail address does not appear in the raw HTML of any page in `dist/` (US5-2, FR-026); contact is reachable from navigation and footer on every page (US5-3)

### Implementation for User Story 5

- [ ] T064 [P] [US5] E-mail obfuscation helper in `src/lib/email.ts`: encodes the address and link text as numeric HTML entities (research § 11), with a unit test in `tests/unit/email.test.ts`
- [ ] T065 [US5] Contact page in `src/pages/[lang]/contact/index.astro`: intro from `content/pages/contact/<lang>.md`, protected `mailto:` link, profile links from `profile.profiles` with network labels, no form (FR-026)

**Checkpoint**: all user stories are independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: constitution quality gates and final checks across all stories

- [ ] T066 [P] Privacy E2E test in `tests/e2e/privacy.spec.ts`: on every page, record network requests and cookies; zero request outside the site origin and zero cookie; the video iframe loads only after a click (FR-023, SC-006)
- [ ] T067 [P] Lighthouse CI config in `lighthouserc.json`: mobile profile, one URL per page type in both languages, assertions ≥ 0.9 for performance, accessibility, best-practices, SEO; budgets LCP < 2500 ms, CLS < 0.1, total JS ≤ 50 KB compressed (SC-002, SC-004)
- [ ] T068 [P] External link check in `scripts/check-links.mjs`: checks every `links[].url` and `*Url` field, reports failures as warnings without failing the build (edge case "lien externe ne répond plus")
- [ ] T069 [P] Images and performance pass: verify AVIF/WebP output, explicit dimensions, lazy loading below the fold, LCP image not lazy and `fetchpriority="high"` (FR-022)
- [ ] T070 [P] CI workflow in `.github/workflows/ci.yml`: install, `npm test`, `npm run build`, `npm run check:seo`, `npm run test:e2e`, `npm run lhci`, `npm run check:links` (non-blocking)
- [ ] T071 Project README in `README.md`: what the site is, commands, where content lives (link to `content/README.md`), quality checks, hosting still to choose
- [ ] T072 Run every scenario in `specs/001-portfolio-content-written/quickstart.md` and record the results; fix any failure

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup; blocks every user story
- **User stories (Phases 3–8)**: depend on Foundational; then independent of each other, done in priority order US1 → US2 → US3 → US4 → US6 → US5
- **Polish (Phase 9)**: after the desired stories

### User Story Dependencies

- **US1 (P1)**: after Phase 2; no dependency on other stories
- **US2 (P2)**: after Phase 2; the project ↔ experience links on project pages (T035) show up once US2 pages exist, but US2 is testable alone
- **US3 (P2)**: after Phase 2; the switcher works on whatever pages exist
- **US4 (P2)**: after Phase 2; generators cover the page types that exist, so ideally after US1–US3
- **US6 (P2)**: after Phase 2; the export and redirects do not need other stories
- **US5 (P3)**: after Phase 2; independent

### Within Each User Story

- Tests first, failing, then implementation
- Components before pages
- Story checkpoint before moving to the next priority

### Parallel Opportunities

- Setup: T003–T006 in parallel after T001–T002
- Foundational: T012/T013 after T011; T016/T017, T019–T022, T024 in parallel
- US1: T026–T031 in parallel, then pages T032–T035
- US2: T040 and T041 in parallel after T038
- US4: T047–T051 and T054 in parallel
- US6: T057–T059 and T062 in parallel
- Polish: T066–T070 in parallel

---

## Parallel Example: User Story 1

```bash
# Tests and components for User Story 1 together:
Task: "E2E test in tests/e2e/projects.spec.ts"
Task: "ProjectCard component in src/components/ProjectCard.astro"
Task: "Default project visual in src/assets/default-cover.svg"
Task: "Period component in src/components/Period.astro"
Task: "VideoFacade component in src/components/VideoFacade.astro"
Task: "ProjectLinks component in src/components/ProjectLinks.astro"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (content, schemas, routing, layout)
3. Phase 3: User Story 1
4. **Stop and validate**: projects reachable in both languages, without JavaScript, at 320 px
5. Demo locally (hosting is chosen later)

### Incremental Delivery

1. Setup + Foundational → validated content and bilingual shell
2. US1 → MVP portfolio of projects
3. US2 → career
4. US3 → language switcher and root redirect
5. US4 → SEO and AI files
6. US6 → export for 3D, redirects, editing guide
7. US5 → contact
8. Polish → quality gates, then go live once hosting is chosen

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Commit after each task or logical group
- Stop at any checkpoint to validate a story on its own
- Placeholder content (T025) must be replaced by Sébastien's real texts before going live
