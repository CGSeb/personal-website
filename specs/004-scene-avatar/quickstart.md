# Quickstart: Avatar low-poly dans la scène 3D

Comment vérifier que la fonctionnalité marche. Détails : [spec.md](spec.md),
[contracts/avatar.md](contracts/avatar.md).

## Prérequis

Blender 5.1 ou plus récent, avec le GPU réglé pour Cycles. Régénérer les modèles :

```bash
blender --background --python assets-src/models/build_models.py -- --only avatar --only room
```

```bash
npm run models:optimize
```

## A. Validation du modèle (avant l'intégration)

| # | Scénario | Attendu | Réf. |
|---|---|---|---|
| 1 | Rendus de `avatar` : face et trois-quarts, à côté de la photo de profil | Sébastien se reconnaît : lunettes, barbe, cheveux, t-shirt | FR-006, SC-001 |
| 2 | Rendu de la scène à la taille réelle d'un téléphone et d'un ordinateur | les traits se lisent encore ; le style va avec la pièce | FR-005 |
| 3 | Rendu de la chaise tournée, sous plusieurs vues | ni le dossier ni la figurine ne traversent le bureau | FR-002 |

La validation de Sébastien est consignée ici avant de passer à la suite.

**Validation du 01/11/2026 (scénarios 1 et 2)** : Sébastien valide la figurine sur les rendus de
[captures/](captures/README.md). Ajustements demandés avant de valider : moins de volume dans la barbe, puis un menton plus
marqué, à la même hauteur mais pointé vers l'avant. Ces rendus sont faits dans Blender, sans précalcul et avec une lumière
qui imite celle du site. Le regard final sur le site reste à faire (scénarios 23 et 25). Le scénario 3 reste à faire avec T009.

## B. Contrôles automatiques

```bash
npm test
```

```bash
npm run build
```

```bash
npm run check:scene
```

```bash
npm run test:e2e
```

```bash
npm run lhci
```

| # | Scénario | Attendu | Réf. |
|---|---|---|---|
| 4 | Scène ouverte, jour et nuit, portrait et paysage | figurine présente, position écran visible | FR-001, SC-002 |
| 5 | Sélection de chaque objet existant à sa position écran | son panneau s'ouvre, pas la bulle | FR-004, SC-006 |
| 6 | Survol de la figurine | `waving` passe à vrai puis à faux en 2 s au plus ; pas de bulle | FR-008 |
| 7 | Survols répétés pendant un salut | un seul salut | FR-008 |
| 8 | Scène au repos, et après un salut | `frames()` ne bouge plus | FR-010, SC-005 |
| 9 | Clic, puis toucher sur téléphone | salut et bulle : texte de la langue, un bouton, **aucun lien** | FR-009, FR-012, FR-013 |
| 10 | Déplacer et zoomer avec la bulle ouverte | elle suit la tête ; elle se ferme si la figurine sort de la vue | FR-015 |
| 11 | Fermer : bouton, Échap, clic ailleurs, nouveau clic sur la figurine | la bulle se ferme ; le fragment disparaît | FR-016 |
| 12 | Ouvrir un panneau avec la bulle, puis la bulle avec le panneau | un seul reste ouvert | FR-016 |
| 13 | Changer de langue avec la bulle ouverte | adresse `#welcome` / `#bienvenue`, bulle ouverte dans l'autre langue, sans salut | FR-017 |
| 14 | Changer de thème avec la bulle ouverte | bulle ouverte, lisible | FR-017, FR-018 |
| 15 | Entrée de la liste au clavier | ouvre la bulle, focus dedans ; Échap rend le focus à l'entrée | FR-019, FR-020 |
| 16 | Réduction des mouvements | aucun salut ; la sélection ouvre la bulle | FR-011 |
| 17 | Sans WebGL, sans JavaScript | ni figurine, ni bulle, ni entrée de liste | FR-021 |
| 18 | `avatar.glb` en échec (requête bloquée) | scène utilisable, pas d'entrée de liste, pas d'erreur bloquante | FR-022 |
| 19 | 320 px, dans les deux langues | bulle entière, sans débordement | SC-007 |
| 20 | Requêtes réseau | aucun domaine tiers | FR-023 |
| 21 | Site écrit : tous les contrôles existants | aucun changement | FR-024, SC-008 |
| 22 | `check:scene` | poids de `avatar.glb` affiché ; total ≤ 3 Mo, sinon signalé à Sébastien | SC-003 |

## C. Vérifications manuelles

| # | Scénario | Attendu | Réf. |
|---|---|---|---|
| 23 | Vrai téléphone Android, jour et nuit | figurine reconnaissable, toucher facile, salut fluide | SC-004 |
| 24 | NVDA, dans les deux langues | entrée de liste et texte de la bulle annoncés | SC-009 |
| 25 | Regard d'ensemble, jour et nuit | la figurine ne paraît ni trop sombre ni collée sur la pièce, l'ombre est juste | FR-007 |

## Résultats

À remplir pendant la réalisation.

**Scénario 3 (01/11/2026)** : chaise tournée de π/4, à sa place d'origine, contrôlée de dessus, de l'est et du sud
([captures](captures/README.md)). Ni le dossier, ni les roulettes, ni la figurine ne traversent le bureau. Le haut du dossier
passe à environ 1 cm du bord du bureau, au-dessus de son plateau.

**Précalcul avec la figurine (T012, 01/11/2026)** : `room.glb` ne contient que le matériau `baked` et le marqueur
`avatar.seat`.

| Fichier (`public/models/`) | Poids |
|---|---|
| `avatar.glb` | 40 Ko (brut : 200 Ko) |
| `room.glb` | 525 Ko |
| `room-day.webp` | 254 Ko |
| `room-night.webp` | 366 Ko |
| Total de la scène avant interaction | 1,42 Mo / 3 Mo |

Regardée sans la figurine, la texture montre son ombre sur l'assise et, sous les chaussures, deux rectangles très sombres sur
le tapis. La figurine les recouvre. Si son chargement échoue, ils restent visibles, plus nettement que ce que prévoyait
research § 5 : à revoir au scénario 18.

**Contrôles automatiques (B, 01/11/2026)**, sur le site construit :

| Contrôle | Résultat |
|---|---|
| `npm test` | 145 tests réussis |
| `npm run build` | 42 pages |
| `npm run check:seo` | 41 pages vérifiées, sitemap complet |
| `npm run check:scene` | `avatar.glb` 40 Ko ; total avant interaction 1,43 Mo / 3 Mo sur `/fr/explorer/` et `/en/explore/` |
| `npm run test:e2e` | 370 réussis, 156 ignorés (cas sans objet pour un projet : toucher, sans JavaScript, mesure faite sur un seul navigateur), aucun échec |
| `npm run lhci` | 100 dans chaque catégorie sur les 12 adresses |

Les scénarios 4 à 20 sont couverts par `tests/e2e/scene-avatar.spec.ts`, `scene-nojs.spec.ts`, `scene-nowebgl.spec.ts`,
`scene-perf.spec.ts` (avec un salut pendant la mesure) et `privacy.spec.ts`. Ce dernier refuse déjà toute requête hors du
site : il n'a pas de liste à compléter. Le scénario 21 est couvert par les contrôles existants, qui passent sans changement.
Le temps d'ouverture de la bulle (SC-007) est mesuré du clic sur l'entrée de liste à la bulle affichée dans la page, sans
compter le dessin de l'image à l'écran.

**Premier regard sur le vrai site (FR-007)** : jour, nuit et téléphone ([captures](captures/README.md)), avec un rendu logiciel
(SwiftShader), pas sur un vrai processeur graphique. La figurine se reconnaît et la peau reste juste de jour comme de nuit :
la lumière des objets placés n'a pas été retouchée. Deux corrections sont venues de ce regard :

- la teinte de mise en évidence des objets (0,3 et 0,45) rendait la figurine d'une seule couleur orangée, sans visage, tant
  que la bulle était ouverte. La figurine a sa propre teinte, faible (0,05 et 0,08) ;
- l'info-bulle se plaçait sur le visage pendant le salut. Pour la figurine, elle se place au-dessus de la tête.

Le salut monte la main à côté de la tête, puis deux battements vers le bas et vers l'avant, avec l'axe contrôlé du bras levé.
Il se lit plutôt comme une main qui s'agite de haut en bas que comme un geste de côté : à juger au scénario 25.

**Scénario 18 (fichier bloqué)** : la scène reste utilisable, sans entrée de liste, sans bulle et sans erreur. La chaise reste
avec l'ombre de la figurine sur l'assise et, sur le tapis devant le piètement, les deux rectangles très sombres
([jour](captures/site-blocked-day.png), [nuit](captures/site-blocked-night.png)). Ils se voient sans gêner : de jour, sombres
sur un tapis gris ; de nuit, nettement noirs sur le tapis clair. Ils ressemblent à deux petits blocs posés devant la chaise.
Cela n'arrive que si le chargement échoue. Pas de nouveau précalcul sans décision de Sébastien.

**Vérifications manuelles (C)** : scénarios 23 à 25 à faire par Sébastien (T037).
