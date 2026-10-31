# Research: Passe graphique et design du portfolio

## 1. Où montrer les maquettes sans les publier

- **Decision**: une intégration Astro locale (`mockups/integration.mjs`) appelle `injectRoute`
  pour `/_maquettes/[style]/` seulement quand `command === 'dev'`. La page de maquette réutilise
  les vraies vues (`HomeView`, `SceneView`) et charge la feuille de valeurs du style et sa pièce
  par des imports Vite (`?url`) situés dans `mockups/`. On peut la consulter sur téléphone avec
  `astro dev --host` sur le réseau local.
- **Rationale**: `astro build` n'exécute jamais la route. Rien de `mockups/` n'entre dans `dist/`,
  ni dans le sitemap, ni dans `llms.txt` (FR-004). Les maquettes montrent le vrai contenu et les
  vrais composants, donc la comparaison porte sur le style et pas sur une imitation. Deux
  onglets suffisent pour les voir côte à côte (FR-003).
- **Alternatives considered**: des pages dans `src/pages/_maquettes/` (Astro ignore le préfixe
  `_`, mais alors il n'y a pas de route en développement non plus) ; une seconde construction
  publiée sur un aperçu privé (il faudrait un hébergement, qui n'est pas encore choisi) ; des
  images figées (pas de bascule de thème, pas de 3D réelle).

## 2. Comment décrire un style : deux niveaux de valeurs

- **Decision**: `tokens.css` passe à deux niveaux. Une **palette** brute par style
  (`--palette-wood-600`, `--palette-sand-50`…) et des **rôles** sémantiques
  (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`,
  `--color-accent`, `--color-accent-text`, `--color-on-accent`, `--color-focus`, `--color-ongoing`,
  plus quelques rôles de la scène comme `--scene-bg`). Les composants n'utilisent que les rôles.
  Un style candidat redéfinit la palette et les rôles. Le thème sombre ne redéfinit que les
  rôles.
- **Rationale**: les noms de rôles existent déjà (`--color-*`) et sont utilisés partout. Les
  garder limite la refonte à des valeurs, plus le nettoyage des couleurs en dur. Une seule
  liste de paires rôle texte / rôle fond suffit à tester les contrastes des deux thèmes
  (FR-024, SC-004). SC-002 se vérifie en cherchant toute couleur littérale hors de `tokens.css`.
- **Alternatives considered**: un fichier JSON transformé en CSS (une étape de construction de
  plus, pour une vingtaine de valeurs) ; des classes utilitaires (style d'écriture différent du
  reste du dépôt).

## 3. Thème clair / sombre sans flash et sans JS

- **Decision**: l'attribut `data-theme="light|dark"` sur `<html>` est posé par un script en ligne
  de moins de 1 Ko, placé en tête du `<head>`, avant les feuilles de style. Ce script lit
  `localStorage.theme` dans un `try/catch`. Le CSS déclare les valeurs sombres deux fois :
  sous `@media (prefers-color-scheme: dark)` avec `:root:not([data-theme="light"])`, et sous
  `:root[data-theme="dark"]`. `color-scheme` suit le thème effectif. Sans JS, aucun attribut
  n'est posé et le système décide (FR-011). Le bouton (`ThemeToggle`) est rendu avec `hidden`
  et révélé par son module.
- **Rationale**: c'est la seule façon d'appliquer un choix enregistré avant le premier rendu
  (SC-006). Le double sélecteur garde le comportement « système » sans JS et sans choix. Le
  `try/catch` couvre le stockage bloqué (cas limite de la spec).
- **Alternatives considered**: un cookie lu côté serveur (impossible en statique, et interdit
  par le principe V) ; appliquer le thème dans un module différé (flash visible) ; une feuille
  de style par thème (deux téléchargements).

## 4. Forme du bouton de thème

- **Decision**: un seul bouton qui fait tourner trois états, système → clair → sombre →
  système. Son nom accessible annonce l'état et l'action, par exemple « Thème : système.
  Passer au thème clair ». Une icône change avec l'état. Il est placé dans l'en-tête, à côté du
  sélecteur de langue, et dans la barre d'outils de la scène. Chaque changement émet un
  événement `themechange` sur `document`. Sans choix enregistré, un écouteur de
  `matchMedia('(prefers-color-scheme: dark)')` suit les changements du système (FR-019).
- **Rationale**: un seul contrôle compact tient en 320 px. Le retour au système passe par le
  même bouton (scénario 5 de l'US4). L'état est annoncé en toutes lettres plutôt que par
  `aria-pressed`, qui ne décrit que deux états.
- **Alternatives considered**: un menu à trois options (plus de code et de place pour un
  réglage rare) ; un interrupteur à deux états (on ne peut plus revenir au système).

## 5. Typographie

- **Decision**: chaque style garde une seule famille sans-serif variable, servie par
  `@fontsource-variable`, en sous-ensemble latin, préchargée, avec une police de repli ajustée
  aux mêmes mesures (comme pour Inter aujourd'hui). Candidates : **Inter** (existante) pour
  « bureau moderne », **Figtree** pour « atelier » (plus ronde et plus chaleureuse). Une
  seconde famille n'est permise que pour les titres, et seulement si le style retenu la
  justifie (FR-007 : deux au plus).
- **Rationale**: le choix reste dans la « sans-serif moderne » validée par Sébastien. Une seule
  famille variable fait un seul fichier d'environ 30 à 50 Ko, sans effet sur le LCP. La police
  de repli ajustée garde le CLS proche de 0 (cas limite « polices lentes »).
- **Alternatives considered**: les polices système seules (pas d'identité) ; une serif pour
  les titres (écartée par Sébastien).

## 6. Pièces des maquettes

- **Decision**: `build_models.py` prend un paramètre de style (`-- --style atelier|bureau --out <dossier>`) qui
  choisit la palette `ROOM_PALETTE` et le support des projets : un établi en bois pour
  l'atelier, un bureau blanc à plateau fin pour le bureau moderne. Les emplacements nommés ne
  changent pas. Les pièces des maquettes sont simplifiées (formes, matériaux, lumière, mur des
  diplômes, étagère avec plantes) et exportées dans `mockups/models/`. Seule la pièce du style
  retenu est finie, dans `assets-src/models/` puis `public/models/`.
- **Rationale**: le script reconstruit déjà toute la pièce avec des palettes nommées. Une
  variante par style coûte une table de couleurs et une fonction de mobilier, pas une seconde
  pièce faite à la main. Le contrat des emplacements de la spec 002 est gardé, donc la scène
  fonctionne avec l'une ou l'autre pièce.
- **Alternatives considered**: changer seulement les couleurs dans le code de la scène (le
  bois et le mobilier sont ce qui distingue l'atelier, pas une teinte) ; modéliser deux pièces
  complètes (le travail perdu pour le style abandonné serait trop grand).

## 7. Jour et nuit dans la pièce

- **Decision**: une seule pièce (`room.glb`) sert aux deux ambiances. Le code tient deux
  réglages dans `scene/ambiance.ts` : couleur et intensité de la lumière d'ambiance et du
  soleil, fond, et intensité émissive des matériaux nommés `lamp` (abat-jour, ampoules) et
  `window` (vitre). De nuit, le soleil devient une faible lumière bleutée, la vitre s'assombrit
  et les lampes deviennent émissives. En qualité moyenne et haute, une `PointLight` sans ombre
  est ajoutée par objet vide `light.lamp.NN` ; en qualité basse, il n'y a que l'émissif. Le
  changement est instantané avec « réduire les animations », et suit sinon un fondu d'environ
  400 ms rendu à la demande.
- **Rationale**: la pièce est à peu près trois fois moins lourde que son budget, sans texture
  de lumière précalculée. Deux jeux de lumières dynamiques ne coûtent presque rien en poids.
  Sans point lumineux en qualité basse, la nuit garde 30 i/s sur téléphone (FR-027). Garder la
  même pièce conserve la vue et le panneau ouvert à la bascule (FR-022).
- **Alternatives considered**: deux `.glb` jour / nuit (poids doublé et rechargement) ;
  précalculer la lumière des deux ambiances (textures lourdes, contre le budget) ; assombrir
  seulement le fond (ne donne pas l'effet « lampes allumées » demandé).

## 8. Vérifier les contrastes dans les deux thèmes

- **Decision**: un test Vitest lit `tokens.css`, résout les rôles dans chaque thème et calcule le
  rapport WCAG 2 de chaque paire listée dans [contracts/design-tokens.md](contracts/design-tokens.md)
  (4,5:1 pour le texte, 3:1 pour les grands textes, les bordures d'interface et le focus).
  Lighthouse continue de tourner en clair. Un test Playwright émule le thème sombre et vérifie
  que les couleurs calculées des éléments clés sont bien celles des rôles sombres.
- **Rationale**: le test des paires est exhaustif, rapide et sans dépendance. Le test du
  navigateur garantit qu'aucun composant n'échappe aux rôles en sombre. Ensemble, ils couvrent
  SC-004 sans faire tourner Lighthouse une seconde fois.
- **Alternatives considered**: `@axe-core/playwright` sur chaque page dans chaque thème (une
  dépendance de plus, et un doublon d'audit avec Lighthouse) ; faire tourner Lighthouse en
  sombre (lhci n'émule pas `prefers-color-scheme` simplement).

## 9. Impression, contraste forcé, mouvements réduits

- **Decision**: `base.css` gagne trois blocs. `@media print` force le texte foncé sur fond
  blanc, cache l'en-tête, le bouton de thème, l'accès 3D et les décors, et affiche l'URL des
  liens externes. `@media (forced-colors: active)` remet les bordures des cartes et le focus
  en `CanvasText` / `Highlight`. `@media (prefers-reduced-motion: reduce)` coupe toutes les
  transitions décoratives, dont celle du thème.
- **Rationale**: ces trois blocs couvrent FR-013, FR-025 et les cas limites, en CSS seulement,
  sans JS.
- **Alternatives considered**: une feuille d'impression séparée (une requête de plus pour un
  usage rare).

## 10. Garder la trace de la décision

- **Decision**: `decision.md` dans le dossier de la fonctionnalité. Il contient le style retenu,
  la date, les raisons, les emprunts à l'autre style, et les captures des deux maquettes dans
  `captures/`, prises en clair, en sombre et à 375 px. Ensuite, `mockups/` est supprimé en
  entier. Les valeurs retenues migrent dans `src/styles/`, et la palette et le mobilier du
  style retenu dans `build_models.py`, qui perd l'autre variante.
- **Rationale**: FR-005 demande que le style abandonné ne laisse aucune trace dans le site
  publié. Les captures gardent la mémoire visuelle du choix sans garder de code mort.
- **Alternatives considered**: garder `mockups/` pour de futurs essais (code non testé qui
  vieillit ; l'historique git suffit).
