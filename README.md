# Portfolio personnel

Portfolio bilingue (français / anglais) en deux parties :

- **la version écrite** (ce dépôt, spec 001) : un site statique classique, rapide, lisible sans
  JavaScript, pensé pour les moteurs de recherche et les agents IA ;
- **la scène 3D isométrique** (spec 002, `/fr/explorer/`, `/en/explore/`) : une pièce à explorer
  en [Three.js](https://threejs.org), construite à partir du même contenu ; chaque objet ouvre
  un panneau, et un bouton « En savoir plus » mène à la version écrite.

Les deux parties partagent le même style, « tour » (spec 003) : un petit bureau en haut d'un
immeuble, noyer et lin, lueur ambrée des LED. Le site existe en thème clair et sombre ; la pièce
passe du jour à la nuit avec lui.

Le site est construit avec [Astro](https://astro.build) et TypeScript, sans framework
d'interface, sans traceur ni cookie. La 3D n'est chargée que sur la page de la scène, et
chaque problème (pas de WebGL, chargement raté, appareil trop lent, mouvement réduit) ramène
vers la version écrite.

## Démarrer

Prérequis : Node.js 24.

```bash
npm install
npm run dev        # serveur de développement sur http://localhost:4321
npm run build      # site statique dans dist/ (s'arrête si le contenu est invalide)
npm run preview    # sert dist/
```

## Le contenu

Tout le contenu (profil, projets, diplômes, expériences, textes des pages) est dans
[`content/`](content/), en YAML et Markdown, une seule fois pour les deux langues. Le guide
[`content/README.md`](content/README.md) explique comment ajouter ou modifier un élément.

Le contenu actuel est **provisoire** : à remplacer par les vrais textes, images et adresse
e-mail avant la mise en ligne.

## Ce que le site publie

| Adresse | Contenu |
|---|---|
| `/` | redirige vers `/fr/` ou `/en/` selon la langue du navigateur |
| `/fr/…`, `/en/…` | accueil, projets (et catégories), parcours, contact |
| `/fr/explorer/`, `/en/explore/` | la scène 3D ; `#projet/<id>` ouvre un élément |
| `/sitemap.xml`, `/robots.txt` | pour les moteurs de recherche |
| `/llms.txt`, `/llms-full.txt` | pour les agents IA |
| `/data/portfolio.json` | export public du contenu (ce que montrent les panneaux de la scène) |

## Le style et le thème

Toutes les couleurs, rayons, ombres et durées sont dans
[`src/styles/tokens.css`](src/styles/tokens.css), en deux étages : une palette
(`--palette-<teinte>-<niveau>`) et des rôles (`--color-bg`, `--color-surface`, `--color-text`,
`--color-accent`, `--scene-bg`…). Les composants n'utilisent que les rôles ; le thème sombre
redéfinit les rôles, pas les composants. La liste des rôles et les contrastes exigés sont dans
[`contracts/design-tokens.md`](specs/003-visual-design-pass/contracts/design-tokens.md) ;
`tests/unit/design-tokens.test.ts` vérifie les contrastes et refuse toute couleur littérale
ailleurs (sauf les lumières de la scène). Polices : Inter pour le texte, Space Grotesk pour les
titres, servies par le site.

Le bouton de thème (en-tête, et barre d'outils de la scène) passe de « système » à « clair »,
puis « sombre », puis de nouveau « système ». Le choix est gardé dans `localStorage.theme`
(aucun cookie) ; un petit script en tête de page l'applique avant le premier rendu, sans flash.
Sans JavaScript, le réglage du système décide. Contrat :
[`contracts/theme.md`](specs/003-visual-design-pass/contracts/theme.md).

Dans la scène, le thème clair donne le jour et le sombre la nuit (lampes allumées, ville
éclairée derrière la baie), avec un fondu, instantané si les animations sont réduites.

## Les modèles 3D

Le contrat entre Blender et le code est dans
[`specs/002-isometric-3d-scene/contracts/scene-model.md`](specs/002-isometric-3d-scene/contracts/scene-model.md)
(échelle, emplacements `slot.*`, `featured.<id>`, `camera.home`, `bounds`, matériaux `screen`
et `label`, budgets), complété pour le jour et la nuit par
[`specs/003-visual-design-pass/contracts/scene-ambiance.md`](specs/003-visual-design-pass/contracts/scene-ambiance.md)
(lampes, fenêtre, pièce à lumière précalculée), et pour la figurine de Sébastien assise au bureau
par [`specs/004-scene-avatar/contracts/avatar.md`](specs/004-scene-avatar/contracts/avatar.md)
(`avatar.glb`, marqueur `avatar.seat`, salut et bulle). La pièce et ses objets sont générés par
script dans Blender : voir [`assets-src/models/README.md`](assets-src/models/README.md).

1. Modéliser dans `assets-src/models/*.blend` (sources, non publiées).
2. Exporter en glTF binaire dans `assets-src/models/` (`room.glb`, `avatar.glb`,
   `generic-project.glb`, `generic-education.glb`, `generic-experience.glb`, `overflow.glb`,
   `featured/<id>.glb`).
3. `npm run models:optimize` : compresse avec gltfpack (Meshopt, textures) vers
   `public/models/`.
4. `npm run build && npm run check:scene` : vérifie les budgets.

Un modèle absent n'empêche rien : la scène utilise une pièce et des objets provisoires générés
en code, avec les mêmes emplacements.

## Contrôles qualité

| Commande | Vérifie |
|---|---|
| `npx astro check` | les types |
| `npm test` | schémas, validation du contenu, adresses, JSON-LD, llms.txt, export, et deux constructions réelles sur les fixtures |
| `npm run check:seo` | après `build` : titres, descriptions, hreflang, Open Graph, JSON-LD, titres de page, textes alternatifs, sitemap |
| `npm run test:e2e` | parcours visiteur sur ordinateur, iPhone, 320 px et sans JavaScript ; langue ; style des pages dans les deux thèmes ; bouton de thème ; vie privée ; scène 3D (panneaux, téléphone, replis, clavier, jour et nuit, fréquence d'images) |
| `npm run check:scene` | après `build` : taille de chaque modèle, et ≤ 3 Mo compressés avant la première interaction sur la scène |
| `npm run lhci` | après `build` : Lighthouse ≥ 90 partout, LCP < 2,5 s, CLS < 0,1, JavaScript ≤ 50 Ko sur la version écrite ; sur la scène, accessibilité, bonnes pratiques et SEO ≥ 90, poids total ≤ 3 Mo |
| `npm run check:links` | les liens externes du contenu (avertissements seulement) |

`npm run ci` lance les types, les tests unitaires, la construction, les tests de bout en bout, le
SEO et le budget de la scène, à lancer à la main avant de fusionner : rien ne le fait
automatiquement sur les pull requests. Un serveur de développement ouvert sur le port 4321 serait
réutilisé par les tests et le site ne serait pas reconstruit : le fermer avant.

Le même contrôle existe sur GitHub, sous Linux, à lancer à la main (onglet Actions → CI → Run
workflow) : à faire avant une mise en ligne, car Windows ne voit pas une erreur de majuscules dans
un chemin de fichier. Il lance aussi `check:links`.

Lighthouse reste à part : ses scores varient d'un passage à l'autre, il tourne donc chaque lundi
sur `main` et à la demande (`.github/workflows/lighthouse.yml`, onglet Actions → Lighthouse → Run
workflow), et toujours avant une mise en ligne.

Sous Windows, si Lighthouse ne parvient pas à lancer Chrome (`spawn UNKNOWN`), démarrer un
Chromium avec `--remote-debugging-port=9222` et lancer
`npx lhci autorun --collect.settings.port=9222`.

## Spécifications

Le projet suit [Spec Kit](https://github.com/github/spec-kit) :

- constitution : [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- spec 001 (version écrite) : [`specs/001-portfolio-content-written/`](specs/001-portfolio-content-written/)
- spec 002 (scène 3D) : [`specs/002-isometric-3d-scene/`](specs/002-isometric-3d-scene/)
- spec 003 (style, thème clair / sombre, pièce de jour et de nuit) :
  [`specs/003-visual-design-pass/`](specs/003-visual-design-pass/)

## Hébergement

Domaine : `https://sebastienmichon.fr` (`site` dans `astro.config.mjs` : adresses canoniques,
hreflang, sitemap, Open Graph, JSON-LD). L'hébergeur n'est pas encore choisi : le site est
entièrement statique (`dist/`) et fonctionne sur n'importe quel hébergement statique.
