# Sources des modèles 3D

Les fichiers Blender (`.blend`) et les exports bruts (`.glb`) de la scène vivent ici. Ils ne sont
pas publiés : `npm run models:optimize` les compresse (Meshopt) dans `public/models/`, qui est
servi par le site. Noms, échelle et emplacements attendus :
`specs/002-isometric-3d-scene/contracts/scene-model.md`.

Les modèles sont générés par [`build_models.py`](build_models.py), à relancer après chaque
modification du script (pièce, objets génériques, objets dédiés des projets mis en avant) :

```bash
blender --background --python assets-src/models/build_models.py
npm run models:optimize
```

Le script enregistre la source de chaque modèle (`<nom>.blend`) et son export brut
(`<nom>.glb`) ici ; `models:optimize` produit les fichiers servis dans `public/models/`. Pour un
nouveau projet mis en avant, ajouter son objet vide `featured.<id>` dans `build_room()` et une
fonction de construction dans `MODELS`.

La pièce candidate « tour » de la spec 003 est construite par [`tower_room.py`](tower_room.py)
(chargé par `build_models.py`) et sa lumière est précalculée avec Cycles (GPU) :

```bash
blender --background --python assets-src/models/build_models.py -- --style tour --out mockups/models/raw
node scripts/optimize-models.mjs mockups/models/raw mockups/models
```
