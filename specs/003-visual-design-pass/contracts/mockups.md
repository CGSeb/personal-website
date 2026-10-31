# Contract: Maquettes des styles

## Adresses (développement seulement)

| Adresse | Contenu |
|---|---|
| `/_maquettes/atelier/` | style « atelier » |
| `/_maquettes/bureau/` | style « bureau moderne » |
| `/_maquettes/<style>/?vue=scene` | la pièce seule, en plein écran |

- Les routes sont injectées par `mockups/integration.mjs`, enregistrée dans `astro.config.mjs`.
  L'intégration n'appelle `injectRoute` que si `command === 'dev'`.
- Chaque page porte `<meta name="robots" content="noindex, nofollow">` et un bandeau
  « Maquette : <style> », avec un lien vers l'autre maquette.
- Consultation sur téléphone : `npm run dev -- --host`, puis l'adresse du réseau local.

## Contenu d'une maquette

1. L'accueil réel (`HomeView`, langue choisie avec `?lang=fr|en`, `fr` par défaut), avec les
   valeurs de `mockups/styles/<style>.css` chargées après `tokens.css`.
2. La scène réelle (`SceneView`) avec la pièce `mockups/models/room-<style>.glb`, passée par la
   propriété `roomUrl` (sinon `/models/room.glb`). Elle contient : le mur des diplômes,
   l'étagère avec des plantes, le support des projets du style, une lampe et une fenêtre
   (ambiances jour / nuit), et les mêmes emplacements nommés que la pièce actuelle.
3. Le bouton de thème, qui bascule les deux parties.

## Exclusion de la production

- `astro build` n'exécute pas la route ; rien sous `mockups/` n'est importé depuis `src/`.
- `scripts/check-seo.mjs` échoue si `dist/` contient un chemin ou un texte `_maquettes`, ou un
  fichier `room-atelier` / `room-bureau`.
- Après la décision (`decision.md`), `mockups/` et son enregistrement dans `astro.config.mjs`
  sont supprimés.
