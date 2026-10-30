# Research: Scène 3D isométrique du portfolio

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-30

Versions vérifiées sur npm le 2026-10-30 : `three` 0.187.0 (`@types/three` 0.187.0),
`meshoptimizer` 1.3.0, `gltfpack` 1.3.0, `@gltf-transform/cli` 4.5.1. Base existante : Astro 7.4,
TypeScript strict, Vitest, Playwright, Lighthouse CI (spec 001).

## 1. Moteur de rendu

- **Decision**: Three.js « nu » (sans framework d'interface), dans un module chargé uniquement
  par la page de la scène.
- **Rationale**: bibliothèque WebGL la plus répandue et la mieux documentée ; caméra
  orthographique, sélection par rayon, chargeur glTF et décodeur Meshopt fournis ; pas de
  surcoût de framework (le site n'en a aucun) ; ≈ 150 Ko compressés après élagage, loin du
  budget de 3 Mo.
- **Alternatives considered**: React Three Fiber (ajoute React, ≈ 45 Ko et un second modèle
  mental) ; Threlte / Svelte (même raison) ; Babylon.js (plus lourd, ≈ 1 Mo) ; PlayCanvas
  (éditeur en ligne, dépendance tierce).

## 2. Vue isométrique et contrôles

- **Decision**: `OrthographicCamera` orientée en isométrique (azimut 45°, élévation ≈ 35,26°),
  `MapControls` limité : déplacement (glisser, un doigt) et zoom (molette, pincement) bornés au
  décor, **rotation désactivée**. Bouton « Recentrer » qui anime (ou, en mouvements réduits,
  place directement) la caméra au cadrage initial.
- **Rationale**: c'est exactement la navigation « caméra seule » choisie ; une vue fixe garde
  la lisibilité isométrique et évite qu'on se perde au doigt.
- **Alternatives considered**: rotation par pas de 90° (utile plus tard, pas nécessaire pour une
  pièce) ; caméra perspective à focale longue (moins nette en isométrie).

## 3. Panneaux d'information et accessibilité

- **Decision**: les panneaux sont du **HTML** superposé au canevas, rendus à la construction
  par Astro dans la page de la scène (un `<article>` par élément, caché, dans la langue de la
  page). Sélectionner un objet affiche son article, ancré près de l'objet sur grand écran, en
  feuille glissée depuis le bas sur téléphone. Une **liste HTML** des éléments (boutons) sert de
  couche accessible : Tab parcourt la liste, chaque focus met l'objet en évidence dans la
  scène, Entrée ouvre le panneau, Échap le ferme et rend le focus.
- **Rationale**: texte net, traduisible, lisible par un lecteur d'écran et par les moteurs, sans
  texture de texte en 3D ; le contenu existe sans JavaScript (FR-020, FR-027, repli) ; un seul
  rendu pour l'écran et l'accessibilité.
- **Alternatives considered**: panneaux en 3D (texte en texture ou en géométrie : flou, lourd,
  inaccessible) ; panneaux construits en JavaScript depuis l'export (contenu absent sans JS et
  pour les robots).

## 4. Source des données

- **Decision**: la page de la scène est générée par Astro depuis **les mêmes collections** que
  le site écrit (`getSite()`) : elle sert les articles des panneaux et un petit manifeste JSON en
  ligne (`<script type="application/json">`) qui relie chaque élément à son type, son
  identifiant, son visuel optimisé et son adresse écrite. L'export `/data/portfolio.json` est
  **complété** (compétences des diplômes, technologies des expériences, galerie, type de projet)
  pour les autres programmes, sans changer `schemaVersion`.
- **Rationale**: source unique (principe I), aucune requête de plus au chargement, données
  toujours synchrones avec la construction ; FR-016 est tenu pour les consommateurs externes.
- **Alternatives considered**: lire `/data/portfolio.json` au chargement (une requête et un
  format à maintenir pour les mêmes données) ; dupliquer les textes dans la scène (interdit).

## 5. Modèles 3D et production

- **Decision**:
  - La pièce est un fichier **glTF binaire** (`.glb`) modélisé dans Blender, avec des **objets
    vides nommés** qui servent d'emplacements (`slot.project.NN`, `slot.diploma.NN`,
    `slot.experience.NN`, `featured.<id-projet>`). Contrat :
    [contracts/scene-model.md](contracts/scene-model.md).
  - Les objets génériques (cadre de diplôme, écran ou cadre de projet, fiche de tableau) sont
    de petits `.glb` instanciés autant de fois que nécessaire ; leur « écran » reçoit le visuel
    de l'élément (projet) ou une texture générée (diplôme, expérience : intitulé court).
  - Compression : géométrie **Meshopt** (`gltfpack`), textures **WebP** (KTX2 plus tard si la
    mémoire GPU devient un problème), cache long par empreinte de fichier.
  - Tant que le modèle de la pièce n'existe pas, une **pièce provisoire générée en code**
    (sol, deux murs, étagère, tableau, emplacements) permet de tout développer et tester.
- **Rationale**: Sébastien maîtrise Blender (et le projet peut piloter Blender) ; le contrat
  d'emplacements découple la modélisation du code ; Meshopt a un décodeur minuscule ; la pièce
  provisoire évite que le code attende les modèles.
- **Alternatives considered**: tout modéliser en code (pas assez beau, long) ; Draco (décodeur
  WASM plus lourd que Meshopt pour peu de gain ici) ; bibliothèques d'objets en ligne
  (licences, cohérence visuelle) ; génération 3D (possible pour des objets dédiés, à évaluer au
  cas par cas, licence à vérifier).

## 6. Placement automatique

- **Decision**: fonction pure `layout(items, slots)` : diplômes et expériences triés du plus
  récent au plus ancien sont affectés aux emplacements de leur type dans l'ordre de leur numéro ;
  chaque projet mis en avant qui a un objet dédié (`featured.<id>`) y est placé, les autres
  projets prennent les `slot.project.NN` libres dans l'ordre du site. S'il y a plus d'éléments
  que d'emplacements, le dernier emplacement de projets devient un **carton « Autres projets »**
  qui ouvre la liste des projets restants (même panneau-liste que la couche accessible).
- **Rationale**: FR-005 à FR-007 ; un nouveau projet apparaît sans retoucher la scène ; le cas
  « 30 projets » (cas limite) reste lisible.
- **Alternatives considered**: grille calculée en code sans emplacements (perd la composition
  artistique de la pièce) ; pagination dans la scène (plus d'interface).

## 7. Qualité adaptative et repli

- **Decision**:
  - **Avant** de charger la 3D : test WebGL2 (sinon WebGL1, sinon repli) ; si
    `prefers-reduced-motion: reduce` ou `navigator.connection.saveData`, écran de choix
    « Continuer en 3D » / « Version écrite » (mémorisé pour la session).
  - **Pendant** : niveau de qualité initial selon l'appareil (ratio de pixels plafonné à 2,
    ombres sur ordinateur seulement) ; un régulateur mesure la durée des images sur une fenêtre
    glissante de 2 s après les 3 premières secondes ; sous 30 i/s (téléphone) ou 50 i/s
    (ordinateur) il descend d'un niveau (ratio de pixels, ombres, antialiasing) ; au niveau le
    plus bas et toujours trop lent, il propose la version écrite.
  - Rendu **à la demande** : on ne redessine que si la caméra bouge, si un objet change d'état
    ou pendant une animation ; arrêt complet quand l'onglet est caché.
- **Rationale**: principe III et FR-021 à FR-025 ; le rendu à la demande économise batterie et
  laisse de la marge sur mobile.
- **Alternatives considered**: boucle de rendu continue (gaspille la batterie pour une scène
  surtout statique) ; détection par liste d'appareils (fragile).

## 8. Adresses et état

- **Decision**: une page par langue, `/fr/explorer/` et `/en/explore/` (segments traduits,
  `hreflang` comme le reste du site). L'élément ouvert est reflété dans le **fragment**
  (`#projet/lesson-folk`, `#project/lesson-folk`, `#diplome/…`, `#education/…`,
  `#experience/…`) : partageable, sans rechargement, compatible avec l'hébergement statique. La
  vue de caméra est gardée dans `sessionStorage` pour le retour depuis le site écrit. Le
  sélecteur de langue conserve le fragment traduit.
- **Rationale**: FR-001, FR-014, FR-018 et US2-3, sans serveur.
- **Alternatives considered**: une page par élément (multiplie les pages sans valeur pour les
  robots) ; paramètres de requête (moins naturels sans serveur).

## 9. Chargement progressif et budget

- **Decision**: la page affiche immédiatement le titre, l'introduction, la liste des éléments
  et le lien vers la version écrite (HTML, < 2,5 s) ; le module 3D est importé ensuite
  (`import()` dynamique), puis la pièce (premier modèle, objectif < 1,5 Mo), puis les objets et
  visuels. Budget suivi : ressources jusqu'à la première interaction ≤ 3 Mo ; contrôle
  automatique sur la construction (taille des fichiers `.glb`, des textures et du module 3D).
- **Rationale**: SC-001, SC-002, FR-002 et FR-003.
- **Alternatives considered**: tout charger d'un bloc (premier affichage lent).

## 10. Tests

- **Decision**:
  - **Vitest** : placement automatique, régulateur de qualité (avec des durées d'image
    simulées), lecture / écriture du fragment, choix du repli, manifeste.
  - **Playwright** : page et liste sans JavaScript ; ouverture d'un panneau au clavier ; « En
    savoir plus » vers la bonne page ; fragment partagé qui ouvre le panneau ; repli WebGL
    absent (Chromium lancé avec `--disable-webgl --disable-3d-apis`) ; écran de choix en
    mouvements réduits ; aucune requête tierce ; un **clic dans le canevas** sur un objet grâce
    à un crochet de test qui donne sa position à l'écran (exposé seulement en développement et
    en test).
  - **Mesure de fluidité** : script Playwright qui ralentit le processeur (×4 via le protocole
    Chrome) et mesure les images pendant un parcours de caméra ; vérification manuelle sur un
    vrai téléphone avant mise en ligne.
  - **Lighthouse** : la page de la scène est ajoutée avec ses propres seuils (accessibilité,
    bonnes pratiques et SEO ≥ 90 ; poids total ≤ 3 Mo ; performance mesurée sur le contenu
    HTML initial).
- **Rationale**: chaque contrôle de la constitution est automatisé quand c'est possible.
- **Alternatives considered**: tests de capture d'écran du canevas (fragiles d'une machine à
  l'autre ; gardés pour plus tard).
