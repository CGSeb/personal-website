# Data Model: Scène 3D isométrique du portfolio

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-30

Les éléments de contenu (projet, diplôme, expérience) sont ceux de la spec 001
([../001-portfolio-content-written/data-model.md](../001-portfolio-content-written/data-model.md)).
Cette fonctionnalité ajoute des données de présentation, jamais de contenu.

## Élément de scène (`SceneItem`, manifeste de la page)

Généré à la construction depuis `getSite()`, un par élément publié, dans la langue de la page.

| Champ | Type | Règles |
|---|---|---|
| `key` | string | `<type>/<id>`, unique ; sert de clé partout (fragment, panneau, objet) |
| `type` | `project \| education \| experience` | |
| `id` | Id | identifiant de la source de contenu |
| `label` | string | nom court affiché au survol et annoncé (titre du projet ; intitulé du diplôme ; poste — organisme) |
| `order` | entier ≥ 0 | ordre du site (projets) ou chronologique inverse (diplômes, expériences) |
| `featured` | booléen | projets seulement |
| `image` | URL ou `null` | visuel optimisé (projet : couverture ; sinon `null`) pour l'écran de l'objet |
| `badge` | string ≤ 40 | texte court peint sur l'objet générique (année, sigle) ; jamais le contenu complet |
| `href` | chemin | page écrite de l'élément, même langue (« En savoir plus ») |
| `panelId` | string | `id` HTML de l'article du panneau dans la page |

## Emplacement (`Slot`, lu dans le modèle de la pièce)

| Champ | Type | Règles |
|---|---|---|
| `name` | string | nom de l'objet vide dans le `.glb` (contrat [scene-model.md](contracts/scene-model.md)) |
| `kind` | `project \| education \| experience \| featured` | déduit du nom |
| `index` | entier ≥ 1 | `NN` du nom ; ordre de remplissage |
| `featuredId` | Id ou absent | pour `featured.<id>` |
| `transform` | position, rotation, échelle | de l'objet vide |

## Placement (`Placement`, sortie de `layout()`)

| Champ | Type | Règles |
|---|---|---|
| `key` | string | élément placé, ou `overflow/projects` pour le carton « Autres projets » |
| `slot` | nom d'emplacement | chaque emplacement reçoit au plus un élément |
| `model` | `generic-project \| generic-education \| generic-experience \| featured:<id> \| overflow` | objet à instancier |

Règles de `layout(items, slots)` :

1. Projets mis en avant avec un emplacement `featured.<id>` correspondant → cet emplacement,
   modèle `featured:<id>` (si le fichier du modèle existe, sinon modèle générique au même
   endroit).
2. Autres projets, dans l'ordre `order` → `slot.project.NN` libres par `NN` croissant.
3. S'il reste des projets et plus d'emplacement : le dernier `slot.project.NN` devient
   `overflow/projects` (modèle `overflow`) et le projet qu'il portait rejoint les restants.
4. Diplômes → `slot.education.NN` ; expériences → `slot.experience.NN`, dans l'ordre ; au-delà,
   même règle de carton (`overflow/education`, `overflow/experience`).
5. Emplacements inutilisés : rien n'est affiché (le décor reste cohérent).
6. Résultat déterministe pour une même entrée (testé).

## Objet interactif (état d'exécution)

| État | Entrée | Sortie |
|---|---|---|
| `idle` | — | survol / toucher / focus liste → `highlighted` |
| `highlighted` | contour + nom affiché | sortie → `idle` ; clic / Entrée → `selected` |
| `selected` | panneau ouvert, fragment mis à jour | fermeture → `highlighted` (si focus) ou `idle` ; autre sélection → l'autre devient `selected` |

Un seul objet `selected` à la fois.

## Niveau de qualité (`QualityLevel`)

| Niveau | Ratio de pixels max | Ombres | Antialiasing | Usage |
|---|---|---|---|---|
| `high` | 2 | oui | oui | ordinateur au départ |
| `medium` | 1,5 | non | oui | téléphone au départ |
| `low` | 1 | non | non | dernier niveau avant de proposer la version écrite |

Régulateur : moyenne glissante de la durée d'image sur 2 s, mesurée à partir de 3 s après
l'affichage et seulement pendant les images rendues ; seuil 30 i/s (téléphone) ou 50 i/s
(ordinateur) ; une descente au plus toutes les 3 s ; jamais de remontée automatique pendant la
session.

## Préférences du visiteur (session)

| Clé `sessionStorage` | Valeur | Rôle |
|---|---|---|
| `scene.choice` | `3d \| written` | choix fait sur l'écran « mouvements réduits / économie de données » |
| `scene.camera` | `{ x, z, zoom }` | vue à restaurer au retour depuis le site écrit |
| `scene.quality` | niveau | niveau retenu, pour ne pas repartir trop haut |

Toutes les lectures sont protégées (navigation privée) : en cas d'échec, valeurs par défaut.
