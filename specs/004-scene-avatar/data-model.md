# Data Model: Avatar low-poly dans la scène 3D

Aucune donnée de contenu n'est ajoutée : ni `content/`, ni manifeste de la scène, ni
`/data/portfolio.json`. Les seuls « objets » sont ceux de la scène.

## Figurine

| Champ | Origine | Règle |
|---|---|---|
| modèle | `public/models/avatar.glb` | présent dans `scene-models` ; sinon pas de figurine |
| place | marqueur `avatar.seat` de la pièce | position et rotation ; sinon pas de figurine |
| bras | nœud `avatar.arm` | pivot à l'épaule, seule pièce mobile |
| tête | nœud `avatar.head` | sa position donne l'ancrage de la bulle |
| clé | `avatar` | identifie la figurine pour la sélection et la position écran ; jamais dans le manifeste |

### États du geste

```text
repos ──(survol, clic, toucher, entrée de liste)──▶ salut ──(fin, 2 s au plus)──▶ repos
```

- Pendant `salut`, une nouvelle demande est ignorée.
- Avec la réduction des mouvements, on reste toujours au `repos`.
- Le rendu n'est demandé que pendant `salut`.

### États de mise en évidence

Comme les autres objets (`idle`, `highlighted`, `selected`) : `highlighted` au survol et au focus de l'entrée de
liste, `selected` tant que la bulle est ouverte.

## Bulle

| Champ | Origine | Règle |
|---|---|---|
| texte | `scene.avatar.welcome` (`ui.ts`) | FR-012, une version par langue |
| fermeture | `scene.close` (`ui.ts`, existant) | seule action de la bulle |
| fragment | `#bienvenue` (fr), `#welcome` (en) | présent tant qu'elle est ouverte |
| ancrage | position écran de `avatar.head` | recalculée à chaque image, bloquée dans la scène |

### États

```text
fermée ──(clic, toucher, entrée de liste : salut + ouverture)──▶ ouverte
fermée ──(arrivée avec le fragment : sans salut)──▶ ouverte
ouverte ──(bouton, Échap, clic ailleurs, re-sélection, panneau ouvert, figurine sortie de la vue)──▶ fermée
```

- Changer de thème ou de langue ne la ferme pas (`.language-switcher` et `[data-theme-toggle]` sont exclus du « clic
  ailleurs », comme pour les panneaux).
- Le survol ne l'ouvre jamais.
- Une seule entre la bulle et un panneau est ouverte à la fois.
- À la fermeture, le focus revient à l'élément qui l'a ouverte et le fragment disparaît.
