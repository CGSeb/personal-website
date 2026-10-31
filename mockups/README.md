# Maquettes des styles (spec 003)

Exploration seulement : deux styles candidats du portfolio, « atelier » et « bureau moderne »,
montrés sur l'accueil réel et la scène réelle. Contrat :
[`specs/003-visual-design-pass/contracts/mockups.md`](../specs/003-visual-design-pass/contracts/mockups.md).

- Adresses : `/_maquettes/atelier/` et `/_maquettes/bureau/`, servies **seulement** par
  `npm run dev` (sur téléphone : `npm run dev -- --host`). `astro build` ne les construit jamais.
- `styles/<style>.css` : palette et rôles du style, chargés après `src/styles/tokens.css`.
- `models/room-<style>.glb` : pièce simplifiée du style, produite par
  `assets-src/models/build_models.py -- --style <style> --out mockups/models`.

Ce dossier est supprimé une fois le style choisi (`specs/003-visual-design-pass/decision.md`).
