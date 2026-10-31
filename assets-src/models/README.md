# Sources des modèles 3D

Les fichiers Blender (`.blend`) et les exports bruts (`.glb`) de la scène vivent ici. Ils ne sont
pas publiés : `npm run models:optimize` les compresse (Meshopt) dans `public/models/`, qui est
servi par le site. Noms, échelle et emplacements attendus :
`specs/002-isometric-3d-scene/contracts/scene-model.md`.

La pièce est celle du style « tour » retenu dans la spec 003
([`decision.md`](../../specs/003-visual-design-pass/decision.md)) : un petit bureau en haut d'un
immeuble, construit par [`tower_room.py`](tower_room.py) (chargé par
[`build_models.py`](build_models.py)). Sa lumière est précalculée avec Cycles (GPU), de jour et
de nuit : la géométrie fixe est réunie en un seul maillage, `room.baked`, et la lumière va dans
deux textures, `room-day.png` et `room-night.png`. Les objets placés (diplômes, fiches
d'expérience, écrans, objets des projets mis en avant) gardent un éclairage en temps réel.

Les modèles sont générés par le script, à relancer après chaque modification (Blender 5.1 ou
plus récent, avec le GPU réglé dans les préférences pour Cycles) :

```bash
blender --background --python assets-src/models/build_models.py
npm run models:optimize
```

Pour un seul modèle, `-- --only <nom>` (répétable), par exemple
`-- --only room --only featured/voxelshift`.

Le script enregistre la source de chaque modèle (`<nom>.blend`) et son export brut (`<nom>.glb`)
ici ; `models:optimize` produit les fichiers servis dans `public/models/`, dont `room-day.webp`
et `room-night.webp`. Les textures brutes (`room-day.png`, `room-night.png`, quelques Mo) ne sont
pas suivies par git : relancer le précalcul (`--only room`) avant `models:optimize` sur une autre
machine.

Pour un nouveau projet mis en avant : son emplacement `featured.<id>` dans `tower_markers()` et sa
fonction de construction dans `TOWER_OBJECTS` (`tower_room.py`).
