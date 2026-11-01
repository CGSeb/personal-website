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
