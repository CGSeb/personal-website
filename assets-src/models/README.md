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

Lampes, baie, LED et ville éclairée sont précalculés dans la texture de nuit (`AMBIANCES` dans
`tower_room.py`) ; le code passe d'une texture à l'autre avec le thème. Les emplacements
`light.lamp.NN` placent les lumières chaudes qui éclairent les objets placés la nuit. Noms et
règles : [`contracts/scene-ambiance.md`](../../specs/003-visual-design-pass/contracts/scene-ambiance.md).

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

La figurine (`avatar`, spec 004) est construite dans `tower_room.py` avec les autres objets, à partir
de pièces rigides, son bras sous le nœud `avatar.arm` que le code fait pivoter pour le salut. Elle est
présente dans la scène Blender pendant les deux précalculs, puis retirée avant l'export : `room.glb`
n'en garde que l'ombre, dans ses textures, et le marqueur `avatar.seat`. **Changer sa pose ou la chaise
demande donc un nouveau précalcul** (`--only avatar --only room`). `render_avatar.py` produit les rendus
de contrôle, sans précalcul, dans `specs/004-scene-avatar/captures/`. Contrat :
[`contracts/avatar.md`](../../specs/004-scene-avatar/contracts/avatar.md).

Pour un nouveau projet mis en avant : son emplacement `featured.<id>` dans `tower_markers()` et sa
fonction de construction dans `TOWER_OBJECTS` (`tower_room.py`).
