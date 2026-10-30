# Contract: Modèles 3D de la scène

Ce que les fichiers `.glb` doivent contenir pour que le code place les éléments. C'est le
contrat entre la modélisation (Blender) et le code.

## Fichiers

| Fichier (servi) | Contenu | Budget compressé |
|---|---|---|
| `public/models/room.glb` | la pièce : sol, murs, mobilier, lumières cuites, emplacements | ≤ 1,5 Mo |
| `public/models/generic-project.glb` | objet générique d'un projet (écran ou cadre) | ≤ 150 Ko |
| `public/models/generic-education.glb` | cadre de diplôme | ≤ 100 Ko |
| `public/models/generic-experience.glb` | fiche épinglée au tableau | ≤ 100 Ko |
| `public/models/overflow.glb` | carton « Autres … » | ≤ 100 Ko |
| `public/models/featured/<id-projet>.glb` | objet dédié d'un projet mis en avant (facultatif) | ≤ 300 Ko chacun |

Les sources (`.blend`, exports bruts) vont dans `assets-src/models/` et ne sont pas publiées.
Optimisation : `gltfpack -cc -tc` (Meshopt) ou équivalent ; textures en WebP, 1024 px au plus
(2048 pour la pièce).

## Repère et échelle

- Unité : **1 = 1 mètre** ; axe Y vers le haut (convention glTF) ; la pièce tient dans un carré
  d'environ 8 × 8 m centré sur l'origine, sol à `y = 0`.
- Les deux murs visibles sont au nord et à l'ouest (`-z` et `-x`), pour la vue isométrique
  orientée depuis le sud-est.

## Emplacements (objets vides)

| Nom | Sens | Règle |
|---|---|---|
| `slot.project.NN` | emplacement d'un projet générique | `NN` = 01, 02… ; ordre de remplissage |
| `slot.education.NN` | emplacement d'un diplôme (au mur) | idem |
| `slot.experience.NN` | emplacement d'une expérience (au tableau) | idem |
| `featured.<id-projet>` | place réservée d'un projet mis en avant | `<id-projet>` = `id` du projet dans `content/` |
| `camera.home` | cadrage initial (position et cible = l'objet vide et son axe -Z) | un seul |
| `bounds` | boîte englobante des déplacements de caméra (objet vide mis à l'échelle) | un seul |

- L'origine de l'objet vide est le point d'ancrage ; son axe **+Z** pointe vers l'avant de
  l'objet posé (vers la pièce).
- Les objets génériques sont modélisés avec leur origine au point d'ancrage et leur face
  avant vers +Z, à l'échelle réelle (un cadre A4 ≈ 0,3 × 0,21 m).

## Surfaces remplaçables

| Nom de matériau | Où | Rempli par |
|---|---|---|
| `screen` | objet générique de projet | visuel du projet (`SceneItem.image`), sinon visuel par défaut |
| `label` | cadre de diplôme, fiche d'expérience | texture générée avec `SceneItem.badge` |

## Interaction

- Toute la hiérarchie d'un objet placé est sélectionnable ; le code ajoute lui-même une forme
  invisible plus large pour faciliter le toucher sur téléphone.
- Les noms d'objets ne sont jamais affichés ; les libellés viennent du manifeste.

## Pièce provisoire

Tant que `room.glb` n'existe pas, `src/scene/room.ts` génère une pièce simple en code avec les
mêmes noms d'emplacements (6 projets, 4 diplômes, 4 expériences, `camera.home`, `bounds`), ce
qui garde le code et les tests indépendants des modèles.
