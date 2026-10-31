# Contract: Valeurs de design

Le contrat entre `src/styles/tokens.css` et tout ce qui affiche quelque chose : pages, composants,
interface de la scène et code 3D.

## Règles

- Les composants, les vues et le code de la scène n'utilisent que des **rôles** ; jamais une
  couleur de palette, jamais une couleur littérale.
- Chaque rôle a une valeur claire et une valeur sombre. Les valeurs sombres sont déclarées
  deux fois dans `tokens.css` (voir [theme.md](theme.md)) :
  - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`
  - `:root[data-theme="dark"] { … }`
- Un style candidat (`mockups/styles/<id>.css`) redéfinit la palette et tous les rôles, rien
  d'autre.

## Rôles de couleur

| Rôle | Usage |
|---|---|
| `--color-bg` | fond de page |
| `--color-surface` | cartes, en-tête, panneaux de la scène |
| `--color-surface-raised` | survol des cartes, menus, infobulles |
| `--color-text` | texte principal |
| `--color-muted` | texte secondaire (dates, métadonnées) |
| `--color-border` | séparateurs décoratifs |
| `--color-border-strong` | bordures de contrôles (boutons, champs, étiquettes) |
| `--color-accent` | fond des boutons principaux, marqueurs |
| `--color-on-accent` | texte sur `--color-accent` |
| `--color-accent-text` | liens et texte d'accent sur `--color-bg` / `--color-surface` |
| `--color-focus` | anneau de focus clavier |
| `--color-ongoing` | badge « en cours » |
| `--scene-bg` | fond de la scène 3D (lu par le code au chargement et à chaque `themechange`) |
| `--scene-highlight` | contour de mise en évidence d'un objet |

## Paires de contraste vérifiées (deux thèmes)

| Premier plan | Fond | Seuil |
|---|---|---|
| `--color-text` | `--color-bg`, `--color-surface`, `--color-surface-raised` | 4,5:1 |
| `--color-muted` | `--color-bg`, `--color-surface` | 4,5:1 |
| `--color-accent-text` | `--color-bg`, `--color-surface` | 4,5:1 |
| `--color-on-accent` | `--color-accent` | 4,5:1 |
| `--color-ongoing` | `--color-surface` | 3:1 (badge, grand texte gras) |
| `--color-border-strong` | `--color-bg`, `--color-surface` | 3:1 |
| `--color-focus` | `--color-bg`, `--color-surface` | 3:1 |

L'anneau de focus est décalé de 2 px (`outline-offset`) : il se lit sur le fond autour du
contrôle, jamais sur `--color-accent`. `--scene-highlight` teinte les objets eux-mêmes (émission),
pas le fond : il n'a pas de paire.

Le test `tests/unit/design-tokens.test.ts` lit `tokens.css`, résout chaque rôle dans chaque thème
et échoue si une paire est sous son seuil. Il échoue aussi si une couleur littérale apparaît
dans `src/` hors de `tokens.css`. Exceptions : `src/scene/ambiance.ts` (lumières et ciel,
[scene-ambiance.md](scene-ambiance.md)), `src/scene/objects.ts`, `src/scene/room.ts`,
`src/scene/lighting.ts` et `src/scene/timeline.ts` (matériaux et textures des objets 3D
construits en code : halo des lampes de tableau, fil rouge des expériences), `src/pages/og/[lang].png.ts` (image de partage).

## Autres valeurs

| Groupe | Noms | Remarque |
|---|---|---|
| Typographie | `--font-sans`, `--font-display` (facultatif) | `--font-display` absent = `--font-sans` |
| Tailles | `--step--1` … `--step-3` | existantes, valeurs ajustables |
| Espacements | `--space-2xs` … `--space-2xl` | existants |
| Arrondis | `--radius`, `--radius-s`, `--radius-pill` | |
| Ombres | `--shadow-1`, `--shadow-2` | une valeur claire et une sombre |
| Durées | `--duration-fast`, `--duration-theme` | ramenées à `0s` sous `prefers-reduced-motion` |
| Largeurs | `--content-width`, `--text-width`, `--gutter` | existantes |

## Polices

- Une ou deux familles `@fontsource-variable/*`, sous-ensemble latin, préchargées dans
  `BaseLayout` (le fichier latin de la famille du texte seulement).
- Chaque famille a une police de repli `local()` ajustée (`size-adjust`, `ascent-override`,
  `descent-override`), comme `Inter Fallback` aujourd'hui.
