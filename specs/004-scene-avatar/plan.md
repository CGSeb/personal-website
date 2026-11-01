# Implementation Plan: Avatar low-poly dans la scène 3D

**Branch**: `feat/004-avatar-spec` | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-scene-avatar/spec.md`

## Summary

Une figurine low-poly de Sébastien est assise au bureau, chaise tournée vers la pièce. Elle salue au
survol ; au clic, au toucher ou depuis la liste, elle salue et ouvre une bulle de bienvenue, sans
lien, qu'on peut fermer.

Le travail se fait en deux temps, séparés par une validation de Sébastien.

1. **Modèle** : la figurine est construite par le script Blender existant, sous forme de pièces
   rigides, avec un bras articulé à l'épaule. La chaise pivote et la pièce est de nouveau
   précalculée, de jour et de nuit, avec la figurine présente au moment du calcul pour que son ombre
   tombe dans les textures de la pièce. Sébastien valide la ressemblance sur des rendus avant
   l'intégration (SC-001).
2. **Intégration** : un petit module charge `avatar.glb` à part, sans bloquer la scène, et l'éclaire
   comme les objets placés. Le salut est calculé par le code, sans squelette ni clip d'animation, et
   ne demande des images que pendant le geste. La bulle est un élément HTML accroché à la tête, comme
   les panneaux, et son état vit dans le fragment de l'adresse (`#bienvenue` / `#welcome`) pour
   survivre au changement de langue.

Décisions détaillées : [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 6 (strict) sur Node.js 24, Astro 7.4 (existant) ; Python 3 dans
Blender 5.1 ou plus récent pour les modèles (existant, essai fait avec Blender 5.2)

**Primary Dependencies**: existantes (`three` 0.187, `gltfpack`, `sharp`). Aucune nouvelle dépendance.

**Storage**: aucun ; l'état de la bulle est dans le fragment de l'adresse, comme le panneau ouvert

**Testing**: Vitest (courbe du salut, position de la bulle, fragment) ; Playwright (figurine, salut,
bulle, langue, thème, clavier, réduction des mouvements, échec de chargement, 320 px, absence
d'images au repos) ; Lighthouse CI et `check:scene` (existants)

**Target Platform**: celle des specs 001 à 003 (deux dernières versions des navigateurs courants, iOS
Safari compris)

**Project Type**: ajout à la scène du site statique existant (même projet Astro)

**Performance Goals**: inchangés pour la scène : ≤ 3 Mo avant interaction (1,40 Mo aujourd'hui),
interactive < 5 s sur mobile, 60 / 30 i/s. Aucune image calculée au repos. Pas de limite propre à la
figurine pour cette version (décision de Sébastien) : son poids est mesuré et affiché.

**Constraints**: aucune requête tierce ; rendu à la demande conservé ; la figurine ne gêne aucun objet
existant ; site écrit inchangé ; l'échec du chargement de la figurine ne touche pas la scène

**Scale/Scope**: 1 modèle à pièces rigides, 1 pièce à précalculer de nouveau × 2 ambiances, 1 module de
scène et 1 module de bulle, environ 8 fichiers existants retouchés

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe / section | Exigence | Comment le plan la respecte | État |
|---|---|---|---|
| I. Source unique, deux expériences | Contenu décrit une fois ; un objet qui présente un contenu pointe vers sa page ; exception pour le décoratif | La figurine et son mot de bienvenue sont des éléments propres à la scène, sans contenu du portfolio : ni donnée de contenu, ni page correspondante, ni lien | ✅ |
| II. Écrit d'abord | HTML complet sans JS ; la 3D n'est jamais le seul chemin | Site écrit inchangé ; l'entrée de liste reste cachée sans JavaScript ; aucune information perdue sans 3D | ✅ |
| III. 3D fluide, mobile | 60 / 30 i/s, toucher, repli, qualité adaptative | Géométrie simple, un seul nœud animé, rendu à la demande ; zone de toucher agrandie ; réduction des mouvements respectée ; aucune ombre en temps réel | ✅ |
| IV. Hébergement léger | Statique, ressources compressées | `avatar.glb` passe par `models:optimize` (Meshopt) et il est servi par le site | ✅ |
| V. Vie privée | Aucun traceur ni requête tierce | Aucune nouvelle requête tierce ; la photo sert seulement de référence à la modélisation | ✅ |
| VI. Bilingue | Deux langues ; le sélecteur conserve l'objet consulté | Textes dans `ui.ts` en FR / EN ; le fragment traduit garde la bulle ouverte au changement de langue | ✅ |
| Budgets écrits | Lighthouse ≥ 90, JS ≤ 50 Ko | Le code ajouté est chargé avec la scène, jamais par le site écrit ; `SceneView.astro` n'ajoute que des textes et un élément HTML caché | ✅ |
| Budgets 3D | ≤ 3 Mo, < 5 s ; dépassement justifié | Il reste 1,6 Mo de marge ; `check:scene` échoue toujours au-delà de 3 Mo au total ; seul le plafond par fichier est levé pour la figurine, à la demande de Sébastien | ✅ |
| Flux et contrôles | Effet sur les deux expériences et les deux langues | Précisé dans la spec ; contrôles automatiques + vérifications manuelles du quickstart | ✅ |

Aucune violation : la section Complexity Tracking est vide.

**Re-check après Phase 1** : le contrat ([contracts/avatar.md](contracts/avatar.md)) ne change aucune de
ces réponses. Le seul assouplissement est le plafond par fichier de `check-scene-budget.mjs` pour
`avatar.glb`, décidé par Sébastien ; le budget total reste bloquant, ce qui respecte la constitution.

## Project Structure

### Documentation (this feature)

```text
specs/004-scene-avatar/
├── spec.md
├── plan.md              # This file
├── research.md          # Décisions : modèle, salut, ombre, bulle, fragment
├── data-model.md        # Figurine, bulle, états
├── quickstart.md        # Scénarios de validation
├── contracts/
│   └── avatar.md        # Modèle, marqueur, interface de scène, textes, crochet de test
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
assets-src/models/
├── tower_room.py        # Chaise tournée, figurine, marqueur avatar.seat, figurine présente au précalcul
├── build_models.py      # Marqueur avatar.seat dans room_markers
└── README.md            # Figurine et rendus de contrôle

public/models/
├── avatar.glb           # Nouveau
├── room.glb, room-day.webp, room-night.webp   # Refaits : chaise tournée, ombre de la figurine

src/scene/
├── avatar.ts            # Nouveau : charge, place, éclaire, fait saluer la figurine
├── wave.ts              # Nouveau : courbe du salut (pure, testée)
├── bubble.ts            # Nouveau : ouverture, fermeture, focus, fragment, position de la bulle
├── objects.ts           # Forme de sélection et états réutilisables par la figurine
├── picking.ts           # Un vrai objet passe avant la figurine
├── panels.ts            # Mise à jour du sélecteur de langue accessible à la bulle
├── hash.ts              # Fragment #bienvenue / #welcome
├── labels.ts            # Textes de la figurine
├── room.ts              # Lecture du marqueur avatar.seat
├── scene3d.ts           # Branchement : survol, sélection, bulle, entrée de liste
└── test-hook.ts         # __scene.avatar()

src/components/scene/SceneItemList.astro   # Entrée cachée, révélée quand la figurine est là
src/views/SceneView.astro                  # Élément de la bulle, styles, textes
src/i18n/ui.ts                             # Textes FR / EN
scripts/check-scene-budget.mjs             # avatar.glb mesuré, sans plafond par fichier

tests/unit/scene-wave.test.ts, scene-bubble.test.ts, scene-hash.test.ts
tests/e2e/scene-avatar.spec.ts
```

**Structure Decision**: même projet Astro. Le code de la figurine reste dans `src/scene/`, chargé avec
la scène ; le modèle suit le chemin de tous les autres (`tower_room.py` → `models:optimize` →
`public/models/`). `specs/002-isometric-3d-scene/contracts/scene-model.md` renvoie vers
[contracts/avatar.md](contracts/avatar.md) pour le nouveau marqueur.

## Ordre de réalisation

1. **Modèle seul** : figurine et rendus de contrôle (face, trois-quarts, vue de la scène à la taille
   réelle sur téléphone). **Validation de la ressemblance par Sébastien.**
2. **Pièce** : chaise tournée, marqueur, précalcul jour et nuit avec la figurine. Vérification de la
   place de la chaise par rapport au bureau.
3. **Présence** (US1) : chargement, éclairage, sélection qui ne gêne pas les objets.
4. **Salut et bulle** (US2), puis **accès et replis** (US3).
5. **Contrôles** (US4) : images au repos, budgets, Lighthouse, quickstart.

## Complexity Tracking

Aucune violation à justifier.
