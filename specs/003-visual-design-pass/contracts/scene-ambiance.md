# Contract: Ambiances de la pièce (ajouts au contrat des modèles)

Ce contrat complète
[`specs/002-isometric-3d-scene/contracts/scene-model.md`](../../002-isometric-3d-scene/contracts/scene-model.md).
Les emplacements, le repère et les budgets décrits là restent valables.

## Nouveaux éléments du modèle de la pièce

| Nom | Type | Règle |
|---|---|---|
| matériau `lamp` | matériau | abat-jour et ampoules ; le code règle son émission (0 de jour) |
| matériau `window` | matériau | vitre ; le code règle sa couleur émise (ciel de jour, ciel de nuit) |
| `light.lamp.NN` | objet vide | position d'une lumière ponctuelle de nuit (chaude), au centre d'une lampe ; 1 à 3 |
| `light.neon.NN` | objet vide | position d'une lueur de nuit dans la couleur du matériau `neon` (sous un meuble éclairé par LED) ; 0 à 2, en qualité haute seulement |
| `decor.shelf` | groupe | étagère avec plantes (au moins 2 plantes), non interactive |
| matériau `neon` | matériau | bandes LED (facultatif) ; le code le fait briller dans sa propre couleur, un peu de jour, fort de nuit |

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
  neonEmissive: number; // > 0 by day, higher at night
  neonLight: { intensity: number; distance: number } | null; // night, high quality only
  bakedNight: number; // baked rooms: 0 day texture, 1 night texture
  window: { color: string; intensity: number };
  pointLight: { color: string; intensity: number; distance: number } | null;
}
function ambianceFor(theme: 'light' | 'dark'): Ambiance;
function settingsFor(ambiance: Ambiance, quality: 'low' | 'medium' | 'high'): AmbianceSettings;
function blend(a: AmbianceSettings, b: AmbianceSettings, t: number): AmbianceSettings;
```

- `pointLight` est `null` en qualité `low` (FR-027).
- `neonLight` est `null` le jour et en qualité `medium` et `low` : sur téléphone, seules les
  lampes éclairent la nuit.
- Une pièce peut placer ses propres emplacements (`slot.project.NN`, `slot.education.NN`,
  `slot.experience.NN`, `featured.<id>`) : la pièce « tour » met tous les projets sur un long
  bureau face à la baie (mis en avant au centre), les diplômes et les expériences sur le mur
  ouest ; le code ne dépend que des noms.
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

## Pièce précalculée (lumière cuite)

Une pièce peut porter sa lumière dans des textures plutôt que dans des lumières temps réel
(pièce « tour », spec 003) :

- toute la géométrie fixe est fusionnée en un maillage dont le matériau s'appelle `baked`
  (gltfpack retire les noms des maillages, pas ceux des matériaux) ; ses coordonnées de texture
  couvrent un atlas ;
- deux textures, `<pièce>-day.webp` et `<pièce>-night.webp`, à côté du `.glb` (ou passées par la
  page : `SceneView` `bakedMaps`), contiennent la couleur éclairée de jour et de nuit ;
- le code (`src/scene/baked.ts`) affiche ce maillage sans éclairage et mélange les deux textures
  selon `bakedNight` (0 le jour, 1 la nuit, interpolé pendant le fondu) ; les objets placés
  (projets, diplômes, expériences) restent éclairés en temps réel par les réglages ci-dessus ;
- budget : modèle et textures ensemble ≤ 1,5 Mo ; textures en 2048 px au plus.
