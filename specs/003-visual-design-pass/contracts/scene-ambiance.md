# Contract: Ambiances de la pièce (ajouts au contrat des modèles)

Ce contrat complète
[`specs/002-isometric-3d-scene/contracts/scene-model.md`](../../002-isometric-3d-scene/contracts/scene-model.md).
Les emplacements, le repère et les budgets décrits là restent valables.

## Nouveaux éléments du modèle de la pièce

| Nom | Type | Règle |
|---|---|---|
| matériau `lamp` | matériau | abat-jour et ampoules ; le code règle son émission (0 de jour) |
| matériau `window` | matériau | vitre ; le code règle sa couleur émise (ciel de jour, ciel de nuit) |
| `light.lamp.NN` | objet vide | position d'une lumière ponctuelle de nuit, au centre d'une lampe ; 1 à 3 |
| `decor.shelf` | groupe | étagère avec plantes (au moins 2 plantes), non interactive |

- Le mur des diplômes porte les `slot.education.NN`. Le support des projets (établi, bureau ou
  étagère selon le style) porte les `slot.project.NN` et les `featured.<id>`.
- Aucune lumière n'est exportée dans le `.glb` : les lumières viennent du code
  (`scene/ambiance.ts` pour les réglages, `scene/lighting.ts` pour leur application).
- Le cadre de la fenêtre utilise un autre matériau (`window-frame`) : seule la vitre s'éclaire.
- Budget inchangé : `room.glb` ≤ 1,5 Mo compressé ; pas de texture de lumière précalculée.

## Réglages (`src/scene/ambiance.ts`)

```ts
type Ambiance = 'day' | 'night';
interface AmbianceSettings {
  hemisphere: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number; position: [number, number, number] };
  lampEmissive: number;
  window: { color: string; intensity: number };
  pointLight: { color: string; intensity: number; distance: number } | null;
}
function ambianceFor(theme: 'light' | 'dark'): Ambiance;
function settingsFor(ambiance: Ambiance, quality: 'low' | 'medium' | 'high'): AmbianceSettings;
function blend(a: AmbianceSettings, b: AmbianceSettings, t: number): AmbianceSettings;
```

- `pointLight` est `null` en qualité `low` (FR-027).
- Les couleurs des lumières et du ciel sont les seules couleurs littérales permises dans le
  code (exception à la règle de [design-tokens.md](design-tokens.md)). Le fond de la scène vient
  de `--scene-bg`.

## Comportement

- Au chargement, l'ambiance suit le thème effectif.
- Sur `themechange`, la scène relit `--scene-bg` et passe à l'autre ambiance. Avec « réduire les
  animations », le changement est instantané ; sinon il suit un fondu interpolé avec `blend`
  sur `--duration-theme` (environ 400 ms), en rendant à la demande seulement pendant le fondu.
- La vue, le panneau ouvert, la langue et le niveau de qualité sont conservés.
- Crochet de test : `__scene.ambiance()` renvoie `'day'` ou `'night'` (développement et tests
  seulement, comme les autres crochets de `test-hook.ts`).
