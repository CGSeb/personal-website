# Quickstart: Passe graphique et design

Le guide de validation de bout en bout. Prérequis : Node 24 et `npm ci` ; Blender 5.1 pour
régénérer les pièces ; navigateurs Playwright installés.

## A. Exploration des styles (avant la décision)

```bash
blender --background --python assets-src/models/build_models.py -- --style atelier --out mockups/models/raw
blender --background --python assets-src/models/build_models.py -- --style bureau --out mockups/models/raw
node scripts/optimize-models.mjs mockups/models/raw mockups/models
npm run dev -- --host
```

| # | Scénario | Comment | Attendu | Couvre |
|---|---|---|---|---|
| 1 | Deux maquettes | ouvrir `/_maquettes/atelier/` et `/_maquettes/bureau/` dans deux onglets | accueil réel et pièce, palette et accent distincts, bandeau « Maquette » | FR-001–003, US1 |
| 2 | Thèmes | bouton de thème dans chaque maquette | accueil et pièce passent en sombre, la pièce de nuit | US1-2, FR-016 |
| 3 | Téléphone | adresse du réseau local sur un téléphone, en portrait | accueil lisible, pièce utilisable au toucher | US1-3 |
| 4 | Hors production | `npm run build && npm run check:seo` | aucune trace de `_maquettes` ni de `room-atelier` / `room-bureau` dans `dist/` | FR-004, SC-008 |
| 5 | Décision | remplir `decision.md`, captures dans `captures/` | style retenu, raisons, emprunts ; 16 captures (2 styles × 2 thèmes × ordinateur / 375 px × accueil / pièce) | FR-005, SC-001 |

## B. Style retenu appliqué

```bash
npm test
npm run build
npm run check:seo
npm run check:scene
npm run test:e2e
npm run lhci
```

| # | Scénario | Comment | Attendu | Couvre |
|---|---|---|---|---|
| 6 | Contrastes | `design-tokens.test.ts` | toutes les paires de [design-tokens.md](contracts/design-tokens.md) au seuil, deux thèmes ; aucune couleur littérale hors `tokens.css` | FR-024, SC-002, SC-004 |
| 7 | Toutes les pages | `design.spec.ts` : chaque type de page, FR / EN, clair / sombre | couleurs calculées = rôles du thème ; pas de défilement horizontal à 320 px | FR-009–012, SC-002 |
| 8 | Sans JS | `design.spec.ts`, JavaScript désactivé, système sombre | page sombre, bouton de thème absent, tout navigable | FR-011 |
| 9 | Impression | `design.spec.ts`, `emulateMedia({ media: 'print' })` | texte foncé sur fond blanc, en-tête et bouton cachés | FR-013 |
| 10 | Contraste forcé | `design.spec.ts`, `forcedColors: 'active'` | bordures des cartes et focus visibles | cas limite |
| 11 | Bouton de thème | `theme.spec.ts` : clic, autre page, autre langue, nouveau contexte avec le même stockage | choix conservé ; « système » efface la clé ; nom accessible FR / EN | FR-019–023, SC-006 |
| 12 | Aucun flash | `theme.spec.ts` : `theme=dark` enregistré, système clair, fond lu au premier rendu | déjà sombre | SC-006 |
| 13 | Stockage bloqué | `theme.spec.ts`, `localStorage` qui lève une exception | le bouton change le thème de la page, aucune erreur | cas limite |
| 14 | Pièce jour / nuit | `scene.spec.ts` : panneau ouvert, bascule du thème | `__scene.ambiance()` passe à `night`, panneau et vue conservés, pas de rechargement | FR-016, FR-022 |
| 15 | Mouvements réduits | `scene.spec.ts`, `reducedMotion: 'reduce'` | bascule jour / nuit instantanée | FR-025 |
| 16 | Fluidité de nuit | `scene-perf.spec.ts`, thème sombre, processeur ralenti ×4 | ≥ 30 i/s, ou baisse de qualité puis proposition de la version écrite | FR-027, SC-005 |
| 17 | Budgets | `check:scene` et `lhci` | `room.glb` ≤ 1,5 Mo, scène ≤ 3 Mo ; Lighthouse ≥ 90 (objectif 100), LCP < 2,5 s, CLS < 0,1, JS ≤ 50 Ko | FR-026–027, SC-003, SC-005 |
| 18 | Vie privée | `privacy.spec.ts` (existant), deux thèmes | aucune requête tierce, aucun cookie | FR-028, SC-008 |
| 19 | Contrôles précédents | quickstart des specs 001 et 002 | tous verts | SC-009 |

## C. Vérification manuelle

| # | Scénario | Attendu | Couvre |
|---|---|---|---|
| 20 | Vrai téléphone Android, deux thèmes | site lisible ; pièce de jour et de nuit fluide | FR-027 |
| 21 | Passage écrit ↔ scène | même identité : couleurs, police, boutons, panneaux | SC-007 |
| 22 | Lecteur d'écran (NVDA) sur le bouton de thème | état et action annoncés, dans les deux langues | FR-023 |
