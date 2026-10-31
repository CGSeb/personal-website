# Contract: Thème clair / sombre

## État dans la page

| Où | Valeur | Sens |
|---|---|---|
| `<html data-theme>` | `light`, `dark`, absent | absent = suivre le système |
| `localStorage.theme` | `light`, `dark`, absent | choix du visiteur ; absent = système |
| `color-scheme` (CSS) | `light` ou `dark` selon le thème effectif | contrôles natifs et barres de défilement |

Sans JavaScript, `data-theme` n'est jamais posé : seul `prefers-color-scheme` décide.

## Script en ligne (`ThemeScript.astro`)

- Placé en tête du `<head>` de **toutes** les pages (version écrite et scène), avant les feuilles
  de style, avec `is:inline`. Taille inférieure à 1 Ko.
- Rôle unique : lire `localStorage.theme` dans un `try/catch` et, si la valeur est `light` ou
  `dark`, poser `data-theme` sur `<html>`. Il ne fait rien d'autre et ne charge rien.

## Bouton (`ThemeToggle.astro`)

- Rendu avec `hidden`, puis révélé par son module (présent seulement avec JS).
- Un `<button type="button">` ; un clic fait passer système → clair → sombre → système.
- Nom accessible, depuis `ui.ts`, en deux langues : l'état courant et l'action suivante, par
  exemple `theme.system` « Thème : système. Passer au thème clair ». Icône décorative,
  `aria-hidden`.
- Effets d'un clic :
  1. écrire `localStorage.theme` (supprimer la clé pour « système »), dans un `try/catch` ;
  2. poser ou retirer `data-theme` ;
  3. émettre `document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))`,
     où `theme` est le thème **effectif** (`light` | `dark`).
- Sans choix enregistré, le module écoute `matchMedia('(prefers-color-scheme: dark)')` et émet
  `themechange` quand le système change.
- Emplacements : l'en-tête de la version écrite, à côté du sélecteur de langue ; la barre
  d'outils de la scène, à côté de « Recentrer ».

## Logique pure (`src/lib/theme.ts`)

```ts
type Preference = 'system' | 'light' | 'dark';
type Theme = 'light' | 'dark';
function effectiveTheme(pref: Preference, systemDark: boolean): Theme;
function nextPreference(pref: Preference): Preference; // system -> light -> dark -> system
function parsePreference(raw: string | null): Preference; // inconnu ou null -> 'system'
```

## Garanties testées

- Aucun flash : au premier rendu d'une page, avec `theme=dark` enregistré et le système en
  clair, la couleur de fond calculée est déjà celle de `--color-bg` en sombre.
- Le choix est conservé d'une page à l'autre, d'une langue à l'autre, et après fermeture du
  navigateur.
- Avec un stockage qui lève une exception, le bouton change quand même le thème de la page.
- Aucun cookie déposé ; aucune requête liée au thème.
