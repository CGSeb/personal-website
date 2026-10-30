# Quickstart: valider le portfolio écrit

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Guide pour lancer le site et prouver que la fonctionnalité marche de bout en bout. Les noms de
scripts ci-dessous sont ceux que les tâches devront créer dans `package.json`.

## Prérequis

- Node.js 24 LTS et npm
- Navigateurs Playwright : `npx playwright install --with-deps chromium webkit`

## Lancer

```bash
npm install
npm run dev        # serveur de développement
npm run build      # construction statique dans dist/ (échoue si le contenu est invalide)
npm run preview    # sert dist/ localement
```

## Scénarios de validation

| # | Scénario | Commande / action | Résultat attendu | Couvre |
|---|---|---|---|---|
| 1 | Contenu valide | `npm run build` | construction réussie ; `dist/` contient les pages FR et EN de chaque élément | FR-001, FR-007 |
| 2 | Contenu invalide | copier `tests/fixtures/content/invalid/*` (traduction manquante, référence cassée, id dupliqué) puis `npm run build` | échec ; chaque message nomme fichier, champ et problème | FR-004, US6-2 |
| 3 | Brouillon | passer un projet en `status: draft`, construire | absent des pages, du sitemap, de `llms.txt` et de `portfolio.json` | FR-005, US6-3 |
| 4 | Ajout d'un projet | ajouter `content/projects/<id>/` complet, construire | présent dans la liste, sa page FR/EN, l'expérience liée, le sitemap, `llms.txt`, l'export | US6-1, SC-005 |
| 5 | Parcours visiteur | `npm run test:e2e` | US1 à US5 passent, sur desktop et viewport 320 px | US1–US5, FR-024 |
| 6 | Sans JavaScript | inclus dans `test:e2e` (contexte `javaScriptEnabled: false`) | toutes les pages lisibles et navigables | FR-010, SC-007 |
| 7 | Langue | inclus dans `test:e2e` | le sélecteur mène à la même page dans l'autre langue ; `lang` et `hreflang` corrects | FR-013, FR-014 |
| 8 | Vie privée | inclus dans `test:e2e` (écoute réseau) | zéro requête hors du domaine, zéro cookie, vidéo chargée seulement au clic | FR-023, SC-006 |
| 9 | Unitaires | `npm test` | schémas, validation croisée, JSON-LD, `llms.txt`, export conformes | FR-017–FR-019, FR-006 |
| 10 | Budgets | `npm run build && npm run lhci` | ≥ 90 dans les quatre catégories ; LCP, CLS et JS sous les budgets | SC-002, SC-004 |
| 11 | Données structurées | `npm run check:seo` | JSON-LD parsable et du bon type sur chaque page ; sitemap = toutes les pages HTML hors redirections | FR-016–FR-018, SC-003 |
| 12 | Redirection | ajouter une entrée dans `content/redirects.yaml`, construire, ouvrir `from` | arrivée sur `to` | FR-025 |
| 13 | E-mail protégé | `grep` de l'adresse en clair dans `dist/` | aucune occurrence ; le lien fonctionne dans le navigateur | US5-2, FR-026 |

## Vérification manuelle avant mise en ligne

- Ouvrir le site sur un vrai téléphone, en portrait et en paysage.
- Passer une page de projet dans le test des résultats enrichis de Google et le validateur
  schema.org.
- Relire les deux langues d'au moins un élément de chaque type.

## Résultats (2026-10-30, contenu provisoire)

| # | Résultat |
|---|---|
| 1 | ✅ 28 pages construites (FR et EN de chaque élément, racine, 404) |
| 2 | ✅ `tests/unit/build-content.test.ts` : la construction sur `tests/fixtures/content/invalid/` échoue en nommant fichier et champ (Astro s'arrête à la première erreur de forme ; la vérification croisée liste toutes les siennes) |
| 3 | ✅ même test : le brouillon `gamma-draft` n'apparaît dans aucune page, ni le sitemap, ni `llms.txt`, ni l'export |
| 4 | ✅ projet temporaire `qs-test` : pages FR/EN, liste, expérience liée, sitemap, `llms.txt`, export ; retiré ensuite |
| 5–8 | ✅ `npm run test:e2e` : 189 réussis, 3 sautés (redirection et vidéo sans JavaScript, par conception) |
| 9 | ✅ `npm test` : 48 réussis |
| 10 | ✅ `npm run lhci` : 100 / 100 / 100 / 100 sur les 10 pages, LCP 1,2–1,4 s, CLS 0, 0 Ko de JavaScript |
| 11 | ✅ `npm run check:seo` : 27 pages, sitemap complet |
| 12 | ✅ redirection d'essai `/fr/projets/ancien-portfolio/` → `/fr/projets/portfolio-3d/` générée (meta refresh + canonical), puis retirée |
| 13 | ✅ aucune occurrence de l'adresse en clair dans `dist/` ; le lien fonctionne dans le navigateur |

Lighthouse a d'abord mesuré un CLS de 0,32 à 0,39 dû au chargement de la police ; corrigé par
une police de secours aux métriques d'Inter et le préchargement du fichier latin.
`npm run check:links` signale 2 liens en échec, attendus avec le contenu provisoire :
`https://example.com/lessonfolk` et le dépôt GitHub du portfolio, privé.

Reste manuel avant la mise en ligne : vrai téléphone, test des résultats enrichis de Google,
relecture des deux langues avec le vrai contenu.
