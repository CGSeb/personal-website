# Quickstart: valider la scène 3D

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Prérequis, lancement et contrôles généraux : voir le [quickstart de la spec 001](../001-portfolio-content-written/quickstart.md).
Les scripts ci-dessous sont ceux que les tâches devront créer ou étendre.

## Lancer

```bash
npm run dev          # puis http://localhost:4321/fr/explorer/
npm run build && npm run preview
```

## Scénarios de validation

| # | Scénario | Commande / action | Résultat attendu | Couvre |
|---|---|---|---|---|
| 1 | Accès | depuis `/fr/`, « Explorer le portfolio en 3D » | arrivée sur `/fr/explorer/`, indicateur puis pièce affichée | US1-1, FR-001 |
| 2 | Sans JavaScript | `test:e2e` (projet `chromium-nojs`) | titre, liste des éléments en liens vers les pages écrites, message `<noscript>` | US4-4, FR-020, FR-027 |
| 3 | Panneau au clic | `test:e2e` (`scene.spec.ts`, crochet de test) | clic sur la position d'un projet → son panneau, fragment `#projet/<id>` | US1-3/4/5, FR-008 |
| 4 | Clavier | `test:e2e` | Tab parcourt la liste, Entrée ouvre, Échap ferme et rend le focus | US5-1/2, FR-019 |
| 5 | En savoir plus | `test:e2e` | lien du panneau → page écrite de l'élément, même langue ; retour → scène et panneau | US2, FR-012 |
| 6 | Lien partagé | ouvrir `/en/explore/#education/master-informatique` | scène en anglais, panneau du diplôme ouvert | FR-014 |
| 7 | Langue | sélecteur depuis un panneau ouvert | même élément ouvert dans l'autre langue | US5-4, FR-018 |
| 8 | WebGL absent | `scene-fallback.spec.ts` (Chromium `--disable-webgl --disable-3d-apis`) | message + lien version écrite ; liste et panneaux utilisables | US4-1, SC-007 |
| 9 | Mouvements réduits | `scene-fallback.spec.ts` (`reducedMotion: 'reduce'`) | écran de choix ; « Continuer en 3D » → scène sans animation de caméra | US4-2, FR-024 |
| 10 | Fluidité | `scene-perf.spec.ts` (processeur ralenti ×4) | ≥ 30 i/s pendant le parcours, ou baisse de qualité puis proposition de la version écrite | SC-003, FR-022 |
| 11 | Placement | `npm test` (`layout.test.ts`) | 0, 1, beaucoup de projets ; carton « Autres projets » ; objets dédiés | FR-005–FR-007, cas limites |
| 12 | Nouveau projet | ajouter un projet dans `content/`, construire | objet générique dans la scène, panneau correct | US6-1, SC-005 |
| 13 | Vie privée | `test:e2e` (`privacy.spec.ts` étendu) | aucune requête tierce, aucun cookie sur la scène | FR-026, SC-008 |
| 14 | Budget | `npm run build && npm run check:scene` | ressources avant interaction ≤ 3 Mo ; chaque `.glb` sous son budget | SC-002 |
| 15 | Lighthouse | `npm run lhci` | page de la scène : accessibilité, bonnes pratiques, SEO ≥ 90 | FR-027 |

## Vérification manuelle

- Téléphone Android de milieu de gamme réel : glisser, pincer, toucher un objet, tourner
  l'écran ; fluidité ressentie.
- iPhone (Safari) : même parcours.
- Lecteur d'écran (NVDA ou VoiceOver) : annonces de la liste et des panneaux.

## Résultats (31/10/2026, après les PR #14, #15 et #16)

Construction de `main` avec les vrais modèles (`room.glb` et objets, 98 Ko en tout).

| # | Résultat | Comment |
|---|---|---|
| 1 | ✅ | `scene.spec.ts` (US1-1), 4 projets Playwright |
| 2 | ✅ | `scene-nojs.spec.ts` (projet `chromium-nojs`) |
| 3 | ✅ | `scene.spec.ts` (US1-3 à US1-6) |
| 4 | ✅ | `scene.spec.ts` (US5-1, US5-2) |
| 5 | ✅ | `scene.spec.ts` (US2) |
| 6 | ✅ | test ponctuel : `/en/explore/#education/master-informatique` ouvre le panneau du diplôme, page en anglais (ordinateur et iPhone) |
| 7 | ✅ | `scene.spec.ts` (US5-4) |
| 8 | ✅ | `scene-nowebgl.spec.ts`, `scene-fallback.spec.ts` |
| 9 | ✅ | `scene-fallback.spec.ts` ; vu aussi dans le navigateur de l'app, qui demande les mouvements réduits |
| 10 | ✅ | `scene-perf.spec.ts` : en CI (rendu logiciel, 5 i/s) la qualité baisse puis la version écrite est proposée ; en local ≥ 30 i/s |
| 11 | ✅ | `npm test` (`scene-layout.test.ts`), 79 tests unitaires |
| 12 | ✅ | test ponctuel : projet ajouté dans `content/`, construit, objet générique placé, clic → son panneau et `#projet/<id>` (ordinateur et iPhone) ; projet retiré ensuite |
| 13 | ✅ | `privacy.spec.ts` : scène chargée et panneau ouvert, aucune requête tierce, aucun cookie |
| 14 | ✅ | `check:scene` : 299 Ko avant la première interaction / 3 Mo ; chaque `.glb` sous son budget (pièce 69 Ko / 1,5 Mo) |
| 15 | ✅ | `npm run lhci` : `/fr/explorer/` et `/en/explore/` à 1 en performance, accessibilité, bonnes pratiques et SEO |

Suite complète : 250 tests de bout en bout réussis (37 ignorés par projet : sans JavaScript, tactile, Chromium seul), `check:seo` sur 29 pages.

### Vérification manuelle (à faire)

- [x] Téléphone Android de milieu de gamme réel : la scène fonctionne (31/10/2026)
- [ ] iPhone (Safari)
- [ ] Lecteur d'écran (NVDA ou VoiceOver)
