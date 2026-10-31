# Maquettes des styles (spec 003)

Exploration seulement : trois styles candidats du portfolio, « atelier », « bureau moderne » et
« tour » (bureau moderne en haut d'un immeuble, sci-fi),
montrés sur l'accueil réel et la scène réelle. Contrat :
[`specs/003-visual-design-pass/contracts/mockups.md`](../specs/003-visual-design-pass/contracts/mockups.md).
Captures et comparaison :
[`specs/003-visual-design-pass/captures/`](../specs/003-visual-design-pass/captures/README.md).

- Adresses, servies **seulement** par `npm run dev` (sur téléphone : `npm run dev -- --host`) :
  `/_maquettes/atelier/`, `/_maquettes/bureau/` et `/_maquettes/tour/`, la pièce en `…/scene/`, l'anglais en
  `…/en/`. `astro build` ne les construit jamais.
- `styles/<style>.css` : palette et rôles du style, limités à `:root[data-style='<style>']`.
- `models/room-<style>.glb` : pièce simplifiée du style.

```bash
blender --background --python assets-src/models/build_models.py -- --style atelier --out mockups/models/raw
blender --background --python assets-src/models/build_models.py -- --style bureau --out mockups/models/raw
blender --background --python assets-src/models/build_models.py -- --style tour --out mockups/models/raw
node scripts/optimize-models.mjs mockups/models/raw mockups/models
```

Ce dossier est supprimé une fois le style choisi (`specs/003-visual-design-pass/decision.md`).
