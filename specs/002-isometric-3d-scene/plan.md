# Implementation Plan: Scène 3D isométrique du portfolio

**Branch**: `feat/002-3d-scene-spec` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-isometric-3d-scene/spec.md`

## Summary

Ajouter au site une page par langue (`/fr/explorer/`, `/en/explore/`) qui affiche une pièce
isométrique vue de haut, rendue avec Three.js. Les projets, diplômes et expériences y sont des
objets placés automatiquement dans des emplacements du modèle de la pièce (objets dédiés
possibles pour les projets mis en avant). Sélectionner un objet ouvre un panneau HTML dans la
scène ; « En savoir plus » mène à la page écrite. La page est générée par Astro depuis la même
source de contenu : panneaux, liste accessible et manifeste existent en HTML avant la 3D, qui
se charge ensuite, s'adapte à l'appareil et laisse place à la version écrite si besoin.
Décisions détaillées : [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 (strict) sur Node.js 24 ; Astro 7.4 (existant)

**Primary Dependencies**: `three` 0.187 (`OrthographicCamera`, `MapControls`, `GLTFLoader`,
`MeshoptDecoder`, `Raycaster`) ; outils de préparation des modèles en développement seulement :
`gltfpack` 1.3 (Meshopt), conversion des textures en WebP

**Storage**: aucun côté serveur ; modèles `.glb` et textures servis en statique ; vue de la
caméra et choix de repli en `sessionStorage`

**Testing**: Vitest (logique pure), Playwright (parcours, repli, réseau, clic dans le canevas,
mesure de fluidité sous ralentissement), Lighthouse CI (page de la scène avec ses seuils)

**Target Platform**: navigateurs avec WebGL2 (WebGL1 accepté) des deux dernières versions de
Chrome, Firefox, Safari (iOS compris) et Edge ; repli HTML partout ailleurs

**Project Type**: page interactive dans le site statique existant (même projet Astro)

**Performance Goals**: 60 i/s sur ordinateur courant, ≥ 30 i/s sur téléphone Android de milieu
de gamme ; contenu HTML de la page < 2,5 s, scène interactive < 5 s en 4G mobile

**Constraints**: ≤ 3 Mo compressés jusqu'à la première interaction ; aucune requête tierce ;
aucun cookie ; rendu à la demande et suspendu en arrière-plan ; aucun texte de contenu dans la
scène

**Scale/Scope**: 1 pièce ; ≈ 10–40 projets, 5–15 diplômes et expériences ; 3 types d'objets
génériques + quelques objets dédiés ; 2 langues

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Exigence | Comment le plan la respecte | État |
|---|---|---|---|
| I. Source unique, deux expériences | Contenu décrit une fois ; chaque objet 3D pointe vers sa page écrite | Page générée depuis `getSite()` ; aucun texte dans la scène ; « En savoir plus » dans chaque panneau ; export complété | ✅ |
| II. Écrit d'abord | La 3D n'est jamais le seul chemin vers un contenu | Panneaux et liste en HTML dans la page, lisibles sans JS ; chaque élément lié à sa page écrite | ✅ |
| III. 3D fluide, mobile | 60 / 30 i/s, toucher, chargement progressif, repli, qualité adaptative | `MapControls` tactile, import dynamique, régulateur de qualité, repli WebGL / mouvements réduits / économie de données / lenteur, rendu à la demande | ✅ |
| IV. Hébergement léger | Statique, ressources compressées en cache long | `.glb` Meshopt + WebP servis par le site, noms à empreinte | ✅ |
| V. Vie privée | Aucun traceur, cookie ni requête tierce | Tout est servi par le site ; vidéos des projets via la façade existante ; test réseau étendu à la scène | ✅ |
| VI. Bilingue | Deux langues, URL distinctes, hreflang, sélecteur qui garde la place | `/fr/explorer/` ↔ `/en/explore/`, fragment traduit, panneaux générés par langue | ✅ |
| Budgets 3D | ≤ 3 Mo avant interaction, interactive < 5 s | Budget suivi par un contrôle de taille à la construction et Lighthouse | ✅ |
| Flux et contrôles | Effet sur les deux expériences et les deux langues ; contrôles avant production | Spec le précise ; contrôles automatisés + vérification sur vrai téléphone | ✅ |

Aucune violation : la section Complexity Tracking est vide.

**Re-check après Phase 1** : le modèle de données, les contrats et le guide de validation ne
changent aucune ligne. Point de vigilance : la page de la scène charge plus de JavaScript que le
budget de 50 Ko de la version écrite ; ce budget s'applique à la version écrite, la scène relève
du budget 3D (≤ 3 Mo) et son contenu HTML s'affiche avant le module 3D. ✅

## Project Structure

### Documentation (this feature)

```text
specs/002-isometric-3d-scene/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── scene-model.md       # Emplacements et objets dans les fichiers .glb
│   ├── scene-page.md        # Adresses, fragment, manifeste, crochet de test
│   └── export-additions.md  # Champs ajoutés à /data/portfolio.json
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
public/models/                 # Modèles optimisés servis tels quels (room.glb, objets génériques, dédiés)
assets-src/models/             # Sources Blender (.blend) et exports bruts, hors construction

src/
├── i18n/routes.ts             # + type de page « scene », segments explorer / explore
├── lib/
│   ├── scene-manifest.ts      # Manifeste des éléments de la scène (pur, depuis getSite)
│   └── export.ts              # + champs ajoutés (contracts/export-additions.md)
├── scene/                     # Code client de la scène (chargé seulement sur la page 3D)
│   ├── boot.ts                # Détection, écran de choix, import dynamique du reste
│   ├── capabilities.ts        # WebGL, mouvements réduits, économie de données (pur + navigateur)
│   ├── layout.ts              # Placement automatique éléments -> emplacements (pur)
│   ├── quality.ts             # Régulateur de qualité (pur)
│   ├── hash.ts                # Lecture / écriture du fragment (pur)
│   ├── renderer.ts            # Rendu à la demande, caméra isométrique, contrôles
│   ├── room.ts                # Chargement de la pièce, pièce provisoire en code
│   ├── objects.ts             # Objets génériques et dédiés, textures, mise en évidence
│   ├── picking.ts             # Sélection par rayon, survol, toucher
│   ├── panels.ts              # Ouverture / fermeture / ancrage des panneaux HTML, focus
│   └── test-hook.ts           # Positions à l'écran des objets (dev / test seulement)
├── components/scene/          # ScenePanel, SceneItemList, SceneFallback, SceneChoice (Astro)
├── views/SceneView.astro      # Page de la scène (HTML complet + manifeste + script)
└── pages/fr/explorer/index.astro, pages/en/explore/index.astro

scripts/check-scene-budget.mjs # Taille des .glb, textures et module 3D dans dist/

tests/
├── unit/                      # layout, quality, hash, capabilities, scene-manifest, export
└── e2e/scene.spec.ts, scene-fallback.spec.ts, scene-perf.spec.ts
```

**Structure Decision**: la scène est une page de plus dans le projet Astro existant. Le code
client vit dans `src/scene/`, séparé des vues, et n'est chargé que par la page de la scène ;
les fonctions pures (placement, qualité, fragment, capacités) sont isolées pour Vitest. Les
modèles optimisés vont dans `public/models/` (servis tels quels), leurs sources Blender dans
`assets-src/` hors construction.

## Complexity Tracking

Aucune violation de la constitution à justifier.
