# Data Model: Passe graphique et design du portfolio

Cette fonctionnalité ne touche pas au modèle de contenu (spec 001). Les entités ci-dessous
décrivent des valeurs de design, des préférences et des décisions, pas des contenus.

## Style candidat

| Champ | Type | Règle |
|---|---|---|
| `id` | `atelier` \| `bureau` \| `tour` | identifiant dans l'adresse de la maquette (`/_maquettes/<id>/`) |
| `name` | texte FR | « Atelier », « Bureau moderne », « Tour (sci-fi) » |
| `palette` | jeu de couleurs nommées | défini dans `mockups/styles/<id>.css` |
| `roles.light`, `roles.dark` | rôles → couleurs de la palette | tous les rôles de [design-tokens.md](contracts/design-tokens.md), paires AA respectées |
| `accent` | couleur de la palette | propre au style |
| `font` | une famille `@fontsource-variable` | au plus deux familles avec celle des titres |
| `roomPalette` | table de matériaux Blender | `ROOM_PALETTE` du style dans `build_models.py` |
| `projectSupport` | `workbench` \| `desk` \| `console` \| `shelf` | mobilier qui porte les `slot.project.NN` |
| `state` | `trial` → `chosen` \| `dropped` | voir transitions |

**Transitions** : les deux styles sont en `trial` pendant l'exploration. La décision fait passer
l'un en `chosen` et l'autre en `dropped`, en même temps. Une fois le choix fait, `mockups/` est
supprimé : `chosen` migre dans `src/styles/` et `assets-src/models/`, et `dropped` ne laisse que
ses captures.

## Valeurs de design (style retenu)

- **Palette** : couleurs brutes `--palette-<teinte>-<niveau>`, utilisées seulement dans
  `tokens.css`.
- **Rôles** : `--color-*` et `--scene-*`, avec une valeur claire et une valeur sombre chacun ;
  seuls noms autorisés dans les composants.
- **Échelles** : tailles de texte (`--step-*`), espacements (`--space-*`), arrondis (`--radius*`),
  ombres (`--shadow-*`), durées (`--duration-*`), largeurs (`--content-width`, `--text-width`).
- **Typographie** : `--font-sans` (et `--font-display` si une seconde famille est retenue).

**Validation** : chaque paire de contraste listée dans le contrat atteint son seuil dans les deux
thèmes ; aucune couleur littérale (`#…`, `rgb(…)`, `hsl(…)`) hors de `tokens.css` dans `src/`.
Seules exceptions : les couleurs de repli de la scène, documentées dans
[scene-ambiance.md](contracts/scene-ambiance.md).

## Préférence de thème du visiteur

| Champ | Où | Valeurs |
|---|---|---|
| `theme` | `localStorage` du navigateur | `light`, `dark`, ou absent (= système) |

- **Thème effectif** = `theme` s'il est présent et valide, sinon `prefers-color-scheme`.
- Une valeur inconnue est ignorée et traitée comme absente.
- Si le stockage est inaccessible, le choix ne vaut que pour la page en cours.
- **Cycle du bouton** : système → clair → sombre → système (« système » efface la clé).

## Ambiance de la pièce

| Champ | Type | Jour | Nuit |
|---|---|---|---|
| `background` | couleur | rôle `--scene-bg` (clair) | rôle `--scene-bg` (sombre) |
| `hemisphere` | couleur ciel, couleur sol, intensité | lumineuse et chaude | faible et bleutée |
| `sun` | couleur, intensité | soleil de fenêtre | lune très faible |
| `lampEmissive` | intensité | 0 | > 0 |
| `windowEmissive` | couleur, intensité | ciel clair | ciel nocturne sombre |
| `pointLights` | par `light.lamp.NN` | éteintes | allumées en qualité moyenne et haute, absentes en basse |

**Transitions** : jour ↔ nuit sur l'événement `themechange` ou sur un changement du système sans
choix enregistré. Avec « réduire les animations », le passage est instantané ; sinon il suit un
fondu interpolé sur `--duration-theme`. La vue, le panneau ouvert, la langue et le niveau de
qualité ne changent pas.

## Décision de style

Fichier `decision.md` : style retenu, date, raisons (3 à 5 points), emprunts à l'autre style
(liste, éventuellement vide), liens vers les captures de `captures/`
(`<style>-<thème>-<largeur>.png`).
