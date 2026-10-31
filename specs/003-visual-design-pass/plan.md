# Implementation Plan: Passe graphique et design du portfolio

**Branch**: `feat/003-design-spec` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-visual-design-pass/spec.md`

## Summary

La passe se fait en deux temps séparés par une décision de Sébastien.

1. **Exploration** : deux styles candidats, « atelier » et « bureau moderne », décrits chacun par
   un jeu de valeurs de design (CSS) et une palette de pièce (Blender). Une route de
   développement seulement, `/_maquettes/<style>/`, affiche l'accueil réel et la scène réelle
   avec ces valeurs et une pièce simplifiée du style, en clair et en sombre. Les maquettes ne
   sont jamais construites pour la production. Sébastien compare et consigne son choix dans
   `decision.md`.
2. **Application** : les valeurs du style retenu deviennent celles du site (`tokens.css`, deux
   niveaux : palette puis rôles). Tous les composants sont revus pour n'utiliser que ces rôles.
   La pièce définitive est modélisée dans le style retenu, avec une ambiance de jour et une de
   nuit. Un bouton de thème (système, clair, sombre) est ajouté à l'en-tête et à la scène. Le
   choix est gardé en `localStorage` et appliqué avant le premier rendu.

Les contrôles existants restent en place. Trois s'y ajoutent : contrastes AA des deux thèmes,
absence des maquettes dans `dist/`, budgets de la scène de nuit. Décisions détaillées :
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 (strict) sur Node.js 24, Astro 7.4 (existant) ; Python 3 dans
Blender 5.1 pour les modèles (existant)

**Primary Dependencies**: existantes (`three` 0.187, `@fontsource-variable/inter`). Ajout possible
d'**une** police sans-serif `@fontsource-variable/*` pour le style « atelier » (candidate :
Figtree), retirée si ce style n'est pas retenu. Aucune autre dépendance d'exécution.

**Storage**: préférence de thème dans `localStorage` (`theme` = `light` | `dark`, absente =
système) ; rien côté serveur ; aucun cookie

**Testing**: Vitest (contrastes des paires de rôles dans les deux thèmes, logique pure du thème,
ambiances de la pièce) ; Playwright (bouton de thème, mémorisation, absence de flash, sans JS,
320 px, bascule jour / nuit dans la scène, impression) ; Lighthouse CI (existant) ;
`check:scene` (existant, étendu à la nuit) ; contrôle d'absence des maquettes dans `dist/`

**Target Platform**: celle des specs 001 et 002 (deux dernières versions des navigateurs
courants, iOS Safari compris)

**Project Type**: refonte visuelle du site statique existant (même projet Astro)

**Performance Goals**: inchangés. Version écrite : Lighthouse ≥ 90 (100 aujourd'hui), LCP < 2,5 s,
CLS < 0,1, JS ≤ 50 Ko. Scène : ≤ 3 Mo avant interaction, interactive < 5 s sur mobile, 60 / 30 i/s,
de jour comme de nuit.

**Constraints**: aucune requête tierce ; au plus deux familles de polices servies par le site ;
script de thème en ligne < 1 Ko dans `<head>` (seul moyen d'éviter le flash) ; maquettes absentes
de la construction de production ; contenu inchangé

**Scale/Scope**: environ 15 pages par langue, 9 composants et 4 composants de scène à revoir ;
2 styles × 2 thèmes en maquette ; 1 pièce définitive × 2 ambiances

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Exigence | Comment le plan la respecte | État |
|---|---|---|---|
| I. Source unique, deux expériences | Contenu décrit une fois ; mêmes informations des deux côtés | Aucun contenu touché ; les maquettes lisent `getSite()` ; un seul jeu de valeurs de design pour le site et l'interface de la scène | ✅ |
| II. Écrit d'abord | HTML complet sans JS ; sémantique ; indexable | Le thème sans JS suit `prefers-color-scheme` ; le bouton n'apparaît qu'avec JS ; HTML et données structurées inchangés ; maquettes hors `dist/` et non indexables | ✅ |
| III. 3D fluide, mobile | 60 / 30 i/s, repli, qualité adaptative | La nuit passe par les mêmes niveaux de qualité : lumières ponctuelles coupées en qualité basse, matériaux émissifs à la place ; budgets mesurés de nuit | ✅ |
| IV. Hébergement léger | Statique, ressources compressées | Polices et modèles servis par le site ; une seule pièce publiée (jour et nuit dans le même `.glb`) | ✅ |
| V. Vie privée | Aucun traceur, cookie ni requête tierce | Préférence en `localStorage`, jamais envoyée ; polices `@fontsource` ; test réseau existant | ✅ |
| VI. Bilingue | Deux langues, même niveau de détail | Libellés du bouton de thème en FR / EN (`ui.ts`) ; préférence commune aux deux langues | ✅ |
| Budgets écrits | Lighthouse ≥ 90, JS ≤ 50 Ko | Script de thème < 1 Ko en ligne + petit module du bouton ; police supplémentaire seulement si « atelier » est retenu, en un seul fichier préchargé | ✅ |
| Budgets 3D | ≤ 3 Mo, < 5 s | Budget de `room.glb` inchangé (≤ 1,5 Mo) ; aucune texture de lumière précalculée pour la nuit | ✅ |
| Flux et contrôles | Effet sur les deux expériences et les deux langues | La spec le précise ; contrôles automatiques + vérification sur vrai téléphone dans les deux thèmes | ✅ |

Aucune violation : la section Complexity Tracking est vide.

**Re-check après Phase 1** : le contrat du script de thème en ligne
([contracts/theme.md](contracts/theme.md)) est la seule entorse à « tout le JS dans des
modules ». Il fait moins de 1 Ko, il est compté dans le budget de 50 Ko et il est nécessaire à
SC-006 (aucun flash). Les maquettes passent par une route injectée seulement en développement
([contracts/mockups.md](contracts/mockups.md)), donc rien ne change pour l'hébergement. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-visual-design-pass/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── design-tokens.md     # Palette, rôles, paires de contraste, typographie
│   ├── theme.md             # Attribut data-theme, stockage, script en ligne, bouton, événement
│   ├── mockups.md           # Route de développement, styles candidats, exclusion de dist/
│   └── scene-ambiance.md    # Ajouts au contrat des modèles : jour / nuit, lampes, fenêtre
├── decision.md          # Écrit après la comparaison : style retenu, raisons, emprunts
├── captures/            # Captures des deux maquettes (clair, sombre, téléphone)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── styles/
│   ├── tokens.css             # Palette + rôles du style retenu, clair et sombre, data-theme
│   ├── base.css               # + impression, forced-colors, transitions sous reduced-motion
│   └── fonts.css              # Police(s) du style retenu et repli aux mêmes mesures
├── lib/theme.ts               # Logique pure : préférence -> thème effectif, lecture / écriture sûres
├── components/
│   ├── ThemeScript.astro      # Script en ligne du <head> (contracts/theme.md)
│   ├── ThemeToggle.astro      # Bouton système / clair / sombre, caché sans JS
│   ├── Header.astro, Footer.astro, ProjectCard.astro, Timeline.astro, …  # revus sur les rôles
│   └── scene/                 # ScenePanel, SceneItemList : revus sur les rôles
├── layouts/BaseLayout.astro   # + ThemeScript, ThemeToggle
├── views/*.astro              # revues sur les rôles (aucune couleur en dur)
├── scene/
│   ├── ambiance.ts            # Réglages jour / nuit (lumières, émissifs) par niveau de qualité (pur)
│   ├── renderer.ts            # Lumières tirées de ambiance.ts, fond tiré des rôles CSS
│   ├── room.ts                # URL de la pièce en paramètre (maquettes), matériaux lamp / window
│   └── scene3d.ts             # Écoute themechange : change d'ambiance sans recharger
└── i18n/ui.ts                 # + libellés du bouton de thème

mockups/                       # Exploration seulement, jamais construit pour la production
├── integration.mjs            # Intégration Astro : injecte /_maquettes/[style]/ en `astro dev`
├── MockupPage.astro           # Accueil réel + scène réelle avec les valeurs d'un style
├── styles/atelier.css, styles/bureau.css   # Valeurs de design de chaque style candidat
└── models/room-atelier.glb, room-bureau.glb  # Pièces simplifiées des styles

assets-src/models/build_models.py  # + palettes par style (STYLE=atelier|bureau), lampes, fenêtre
scripts/check-seo.mjs              # + aucune trace de maquette dans dist/
tests/
├── unit/design-tokens.test.ts, theme.test.ts, scene-ambiance.test.ts
└── e2e/theme.spec.ts, design.spec.ts (320 px, impression, sans JS, forced-colors)
```

**Structure Decision**: les maquettes vivent dans un dossier `mockups/` à la racine. Il est
branché sur Astro par une intégration qui n'injecte ses routes qu'avec `astro dev`, donc la
construction de production ne le voit jamais. Après la décision, ce dossier est supprimé : le
style retenu migre dans `src/styles/` et la pièce dans `assets-src/models/`. Le reste de la
refonte modifie les fichiers existants, sans nouvelle architecture. La seule logique nouvelle
est pure et isolée pour Vitest : thème effectif dans `lib/theme.ts`, ambiances dans
`scene/ambiance.ts`.

## Complexity Tracking

Aucune violation de la constitution à justifier.
