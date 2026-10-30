# Implementation Plan: Portfolio écrit bilingue et source de contenu commune

**Branch**: `001-portfolio-content-written` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-portfolio-content-written/spec.md`

## Summary

Construire la version écrite du portfolio, bilingue français / anglais, et la source de contenu
unique (projets, diplômes, expériences, profil) que la future scène 3D lira aussi. Le site est
généré en HTML statique par Astro à partir de fichiers versionnés dans le dépôt, validés par
schéma à chaque construction. Il fonctionne sans JavaScript, publie données structurées,
sitemap, `llms.txt` et un export JSON documenté, et ne fait aucune requête tierce. Décisions
détaillées : [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict) sur Node.js 24 LTS

**Primary Dependencies**: Astro 7.4 (sortie statique, collections de contenu, i18n,
`astro:assets`), `@astrojs/sitemap` 3.7, `schema-dts` (types JSON-LD), polices WOFF2
auto-hébergées

**Storage**: fichiers YAML et Markdown versionnés sous `content/` ; aucune base de données

**Testing**: Vitest 5 (unitaires : schémas, générateurs), Playwright 1.64 (bout en bout, avec et
sans JavaScript, audit réseau), Lighthouse CI (budgets et scores)

**Target Platform**: navigateurs des deux dernières versions de Chrome, Firefox, Safari (iOS
compris) et Edge ; hébergement statique quelconque (choisi à la mise en ligne)

**Project Type**: site web statique (un seul projet, sans backend)

**Performance Goals**: LCP < 2,5 s, CLS < 0,1, INP < 200 ms sur mobile 4G ; Lighthouse ≥ 90
dans les quatre catégories

**Constraints**: aucun JavaScript requis pour lire ou naviguer ; JS ≤ 50 Ko compressé par page ;
aucune requête vers un domaine tiers ; aucun cookie ; 320–2560 px de large

**Scale/Scope**: environ 10 à 40 projets, 5 à 15 éléments de parcours, 2 langues ; 8 gabarits de
page (accueil, liste et détail projet, catégorie, parcours, diplôme, expérience, contact,
introuvable) + racine de langue

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Exigence | Comment le plan la respecte | État |
|---|---|---|---|
| I. Source unique, deux expériences | Contenu décrit une fois, lu par les deux expériences | Collections sous `content/` ; export `/data/portfolio.json` pour la 3D ; identifiants stables | ✅ |
| II. Écrit d'abord, indexable, IA | HTML complet sans JS, URL par élément, JSON-LD, sitemap, robots, llms.txt, HTML sémantique | Génération statique, routes par élément et par langue, générateurs dédiés, gabarits sémantiques | ✅ |
| III. 3D fluide | Hors périmètre de cette fonctionnalité | Emplacement d'accès prévu sur l'accueil, masqué (FR-012) ; export JSON prêt | ✅ (n/a) |
| IV. Hébergement léger | Statique, aucun serveur à la visite, ressources compressées et en cache | Sortie `dist/` statique, redirections portables, images AVIF/WebP | ✅ |
| V. Vie privée | Aucun traceur, cookie ni requête tierce ; polices locales ; embeds au clic | Polices auto-hébergées, aucune mesure d'audience, façade vidéo, test réseau Playwright | ✅ |
| VI. Bilingue | Deux langues complètes, URL distinctes, hreflang, sélecteur conservant la page, traductions relues | Champs `{fr, en}` obligatoires, construction bloquée si manque, routes traduites, sélecteur par identifiant | ✅ |
| Budgets | LCP, CLS, INP, Lighthouse ≥ 90, JS ≤ 50 Ko | Zéro framework UI, Lighthouse CI avec seuils bloquants | ✅ |
| Flux et contrôles | Effet sur 3D et langues précisé ; contrôles avant production | Spec le précise ; contrôles automatisés (cf. research § 13 et quickstart) | ✅ |

Aucune violation : la section Complexity Tracking est vide.

**Re-check après Phase 1** : le modèle de données, les contrats et le guide de validation ne
modifient aucune ligne du tableau. Les deux seuls scripts côté client (racine de langue
< 1 Ko, façade vidéo) restent très sous le budget et le site reste utilisable sans eux. ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-portfolio-content-written/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── content-source.md
│   ├── routes.md
│   └── portfolio-export.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
content/                       # Source de contenu unique (éditée à la main)
├── profile.yaml
├── categories.yaml
├── technologies.yaml
├── redirects.yaml
├── pages/                     # Textes fixes : home, career, contact (fr.md / en.md)
├── projects/<id>/             # meta.yaml, fr.md, en.md, images
├── education/<id>/            # meta.yaml, fr.md, en.md
└── experience/<id>/           # meta.yaml, fr.md, en.md

src/
├── content.config.ts          # Déclaration des collections et schémas Zod
├── content/
│   ├── schemas.ts             # Schémas partagés (texte bilingue, période, visuel…)
│   └── validate.ts            # Vérification croisée (ids, références, traductions)
├── i18n/
│   ├── ui.ts                  # Libellés d'interface FR/EN
│   └── routes.ts              # Segments traduits, construction d'URL, page équivalente
├── lib/
│   ├── jsonld.ts              # Générateurs JSON-LD par type de page
│   ├── seo.ts                 # Titre, description, canonique, hreflang, Open Graph
│   ├── export.ts              # Construction de portfolio.json
│   └── llms.ts                # Construction de llms.txt / llms-full.txt
├── components/                # Header, LanguageSwitcher, ProjectCard, Timeline, VideoFacade…
├── layouts/BaseLayout.astro
├── styles/                    # Jetons CSS, base, typographie
└── pages/
    ├── index.astro            # Racine x-default + redirection de langue
    ├── 404.astro
    ├── [lang]/…               # Pages par langue (cf. contracts/routes.md)
    ├── data/portfolio.json.ts
    ├── llms.txt.ts
    ├── llms-full.txt.ts
    └── robots.txt.ts

public/fonts/                  # WOFF2 auto-hébergées

tests/
├── unit/                      # Vitest : schémas, validate, jsonld, export, llms, routes
├── e2e/                       # Playwright : parcours, sans JS, langue, réseau, 320 px
└── fixtures/content/          # Contenu d'exemple valide et invalide

lighthouserc.json              # Seuils Lighthouse CI
astro.config.mjs
```

**Structure Decision**: un seul projet Astro à la racine, sans backend. Le contenu vit dans
`content/` (hors de `src/`) pour séparer clairement ce que Sébastien édite de ce qui est du
code ; la future scène 3D s'ajoutera dans ce même projet (`src/components/scene/` et une
route dédiée) et lira les mêmes collections.

## Complexity Tracking

Aucune violation de la constitution à justifier.
