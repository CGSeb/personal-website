# Contract: Maquettes des styles

## Adresses (développement seulement)

| Adresse | Contenu |
|---|---|
| `/_maquettes/atelier/` | style « atelier », accueil |
| `/_maquettes/bureau/` | style « bureau moderne », accueil |
| `/_maquettes/tour/` | style « tour » (bureau en haut d'un immeuble, sci-fi), accueil |
| `/_maquettes/<style>/scene/` | la pièce du style |
| `/_maquettes/<style>/en/`, `/_maquettes/<style>/en/scene/` | les mêmes en anglais |

- Les routes sont injectées par `mockups/integration.mjs`, enregistrée dans `astro.config.mjs`.
  L'intégration n'appelle `injectRoute` que si `command === 'dev'`. La langue et l'écran sont
  des segments de l'adresse : une page statique n'a pas de paramètres de requête.
- `MockupPage.astro` renseigne `Astro.locals.mockup`. `BaseLayout` en tire `data-style` sur
  `<html>`, `<meta name="robots" content="noindex, nofollow">` et un bandeau « Maquette :
  <style> » avec des liens vers l'accueil, la pièce, l'autre langue et l'autre style.
- Consultation sur téléphone : `npm run dev -- --host`, puis l'adresse du réseau local. Si un
  autre serveur de développement tourne déjà dans le dossier : `npm run dev -- --ignore-lock`.

## Contenu d'une maquette

1. L'accueil réel (`HomeView`) ou la scène réelle (`SceneView`), avec les deux feuilles
   `mockups/styles/<style>.css`. Chaque feuille est limitée à `:root[data-style='<style>']`,
   donc elle l'emporte sur `tokens.css` quel que soit l'ordre des feuilles.
2. La scène a la pièce `mockups/models/room-<style>.glb`, passée par la propriété `roomUrl`
   (sinon `/models/room.glb`). Elle contient : le mur des diplômes, l'étagère avec des plantes,
   le support des projets du style, une lampe et une fenêtre (ambiances jour / nuit), et les
   mêmes emplacements nommés que la pièce actuelle.
3. Le bouton de thème, qui bascule la page et la pièce.

Pièces : `build_models.py -- --style <style> --out mockups/models/raw` (ignoré par git), puis
`node scripts/optimize-models.mjs mockups/models/raw mockups/models`.

## Exclusion de la production

- `astro build` n'exécute pas la route ; rien sous `mockups/` n'est importé depuis `src/`.
- `scripts/check-seo.mjs` échoue si `dist/` contient un chemin ou un texte `_maquettes`, ou un
  fichier `room-atelier` / `room-bureau` / `room-tour`.
- Après la décision (`decision.md`), `mockups/` et son enregistrement dans `astro.config.mjs`
  sont supprimés.
