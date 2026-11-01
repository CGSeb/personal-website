# Contract: Figurine et bulle de la scène

Ce contrat complète
[`specs/002-isometric-3d-scene/contracts/scene-model.md`](../../002-isometric-3d-scene/contracts/scene-model.md)
et [`specs/003-visual-design-pass/contracts/scene-ambiance.md`](../../003-visual-design-pass/contracts/scene-ambiance.md).

## Modèle `avatar.glb`

- Origine sur l'assise, face vers `+Z`, même repère et mêmes mètres que les autres objets.
- Une couleur par matériau, sans texture. Matériaux : `avatar-skin`, `avatar-hair`, `avatar-beard`, `avatar-shirt`,
  `avatar-trousers`, `avatar-glasses`, `avatar-eyes`.
- Aucun matériau `lamp`, `neon`, `glow`, `screen` ou `label`.

| Nœud | Type | Règle |
|---|---|---|
| `avatar.arm` | objet vide | épaule du bras qui salue, au repos à rotation nulle ; ses enfants (manche, main) sont rigides |
| `avatar.head` | objet vide | sommet de la tête : point d'ancrage de la bulle |
| autres | maillages | pièces fixes du corps, par matériau |

Poids : pas de plafond par fichier (`check:scene` l'affiche). Le total de 3 Mo avant interaction reste bloquant.

## Pièce `room.glb`

| Nom | Type | Règle |
|---|---|---|
| `avatar.seat` | objet vide | position et rotation de la figurine, sur l'assise de la chaise |

- La chaise est tournée d'autant que le marqueur.
- La figurine est présente pendant le précalcul et absente du fichier exporté : `room.glb` ne contient que l'ombre, dans
  ses textures.
- Budgets de la pièce inchangés.
- Une pièce sans ce marqueur n'a pas de figurine (pièce provisoire comprise).

## Module `src/scene/avatar.ts`

```ts
export const AVATAR_KEY = 'avatar';

export interface Avatar extends PlacedObject {
  /** Plays the wave unless one is running or motion is reduced. */
  wave(): void;
  waving(): boolean;
  /** How many waves have started. */
  waves(): number;
  /** World position of the `avatar.head` anchor. */
  head(): THREE.Vector3;
}

/** Null when the model or the seat is missing, or the file fails: the scene goes on without it. */
export function loadAvatar(
  room: Room,
  models: string[],
  options: { reducedMotion: boolean; requestRender(): void },
): Promise<Avatar | null>;
```

## Module `src/scene/wave.ts`

```ts
export const WAVE_MS: number; // ≤ 2000
/** Arm rotation (radians) at time `ms`: 0 at the start and from WAVE_MS on. */
export function waveAngle(ms: number): number;
```

## Module `src/scene/bubble.ts`

```ts
export class Bubble {
  constructor(lang: Lang, onChange: (open: boolean) => void);
  get isOpen(): boolean;
  open(from?: HTMLElement | null): void;
  close(): void;
  toggle(from?: HTMLElement | null): void;
  /** Follows the head; called after each frame while open. */
  reposition(anchor: { x: number; y: number }): void;
}

/** Above the anchor, centred, kept inside the scene. Pure. */
export function bubblePosition(
  anchor: { x: number; y: number },
  bubble: { width: number; height: number },
  scene: { width: number; height: number },
  margin?: number,
): { left: number; top: number };
```

## Fragment (`src/scene/hash.ts`)

```ts
export const welcomeHash: (lang: Lang) => string; // '#bienvenue' | '#welcome'
export const isWelcomeHash: (hash: string) => boolean; // in either language
```

`translateHash` traduit ce fragment comme les autres ; `parseHash` continue de renvoyer `null` pour lui.

## HTML

```html
<!-- SceneView.astro -->
<div class="scene-bubble" data-avatar-bubble role="dialog" aria-labelledby="scene-bubble-text" tabindex="-1" hidden>
  <p id="scene-bubble-text">…</p>
  <button type="button" class="close" aria-label="…">×</button>
</div>

<!-- SceneItemList.astro, en fin de liste -->
<section data-avatar-entry hidden>
  <h3>…</h3>
  <ul><li><button type="button">Sébastien</button></li></ul>
</section>
```

Aucun lien dans la bulle. Couleurs tirées des rôles de la scène (`tokens.css`), contrastes AA dans les deux thèmes.

## Textes (`src/i18n/ui.ts`)

| Clé | Français | Anglais |
|---|---|---|
| `scene.avatar.name` | Sébastien | Sébastien |
| `scene.avatar.welcome` | Bonjour, c’est Sébastien, bienvenue sur mon portfolio 3D. Navigue dans la pièce pour la découvrir. | Hi, it’s Sébastien, welcome to my 3D portfolio. Move around the room to discover it. |
| `scene.group.welcome` | Bienvenue | Welcome |

Le bouton de fermeture reprend `scene.close`. `SceneLabels` reçoit `avatar: { name, welcome }`.

## Sélection (`src/scene/picking.ts`)

Quand un rayon touche la figurine et un autre objet, l'autre objet gagne, quelle que soit la distance. Le survol et le clic
passent par `onHover` et `onSelect` avec la clé `avatar`. L'info-bulle affiche `scene.avatar.name`.

## Crochet de test (`src/scene/test-hook.ts`)

```ts
avatar(): { shown: boolean; waving: boolean; waves: number };
```

`screenPosition('avatar')` donne la position de la figurine, `frames()` sert à vérifier l'absence d'images au repos.
