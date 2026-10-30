# Sources des modèles 3D

Les fichiers Blender (`.blend`) et les exports bruts (`.glb`) de la scène vivent ici. Ils ne sont
pas publiés : `npm run models:optimize` les compresse (Meshopt) dans `public/models/`, qui est
servi par le site. Noms, échelle et emplacements attendus :
`specs/002-isometric-3d-scene/contracts/scene-model.md`.
