# Research: Portfolio écrit bilingue et source de contenu commune

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-30

Versions vérifiées sur npm le 2026-10-30 : `astro` 7.4.4, `@astrojs/sitemap` 3.7.4,
`@playwright/test` 1.64.1, `vitest` 5.0.5 ; Node 24 LTS installé localement.

## 1. Générateur de site

- **Decision**: Astro 7 + TypeScript (strict), sortie 100 % statique (`output: 'static'`).
- **Rationale**: HTML généré à la construction sans JavaScript par défaut (principe II, budget
  JS ≤ 50 Ko) ; collections de contenu typées par schéma, qui font échouer la construction sur
  un champ ou une traduction manquant (FR-004) ; routage i18n intégré ; optimisation d'images
  intégrée (FR-022) ; les « îles » permettront d'ajouter la scène Three.js plus tard dans le
  même projet, en lisant les mêmes collections (principe I). Choix validé avec l'utilisateur.
- **Alternatives considered**: Next.js en export statique (≈ 80–100 Ko de JS par page, au-delà
  du budget) ; Eleventy (zéro JS, mais ni validation de schéma ni pipeline d'images, et un
  bundler séparé pour la 3D) ; HTML pur (aucune validation, duplication FR/EN).
- **À vérifier à l'implémentation**: le nom exact des API d'Astro 7 (chargeurs de collections,
  options i18n, `astro:assets`) dans la documentation de la version installée.

## 2. Format et emplacement de la source de contenu

- **Decision**: fichiers versionnés sous `content/`, un dossier par élément :
  `meta.yaml` (champs non traduisibles + textes courts sous la forme `{ fr, en }`) et
  `fr.md` / `en.md` (description longue en Markdown). Profil, catégories, technologies et
  redirections dans des fichiers YAML uniques. Détail : [contracts/content-source.md](contracts/content-source.md).
- **Rationale**: une seule saisie des champs communs (FR-002) ; les textes longs restent
  agréables à écrire et à relire en Markdown ; un diff git montre clairement ce qui change ;
  aucun service tiers (choix utilisateur : fichiers dans le dépôt, FR-027).
- **Alternatives considered**: un fichier Markdown par langue avec frontmatter dupliqué
  (dates et liens saisis deux fois, risque de divergence) ; tout en YAML (descriptions longues
  pénibles à écrire) ; JSON (pas de commentaires, peu lisible).

## 3. Validation du contenu

- **Decision**: schémas Zod des collections Astro + une vérification croisée exécutée à la
  construction (identifiants uniques, références entre éléments existantes, présence de
  `fr.md` et `en.md`, texte alternatif FR/EN pour chaque visuel).
- **Rationale**: FR-004 exige l'échec de la construction avec un message nommant l'élément et
  le champ ; Zod fournit ce message pour la forme, la vérification croisée couvre les liens.
- **Alternatives considered**: JSON Schema + validateur séparé (deuxième source de vérité pour
  les types) ; validation seulement en CI (trop tard, la construction locale passerait).

## 4. Routage et adresses

- **Decision**: préfixe de langue obligatoire (`/fr/…`, `/en/…`), segments traduits
  (`/fr/projets/` ↔ `/en/projects/`), identifiant d'élément commun aux deux langues, slug
  traduit optionnel. Table complète : [contracts/routes.md](contracts/routes.md).
- **Rationale**: adresses lisibles dans chaque langue (FR-013) ; l'identifiant commun permet au
  sélecteur de langue de retrouver la page équivalente (FR-014) ; `hreflang` symétrique.
- **Alternatives considered**: anglais sans préfixe (racine ambiguë, `hreflang` plus fragile) ;
  sous-domaines par langue (configuration DNS, inutile ici).

## 5. Racine du site et langue préférée

- **Decision**: `/` est une page statique légère `x-default` : liens vers `/fr/` et `/en/`,
  balises `hreflang`, et un script en ligne (< 1 Ko) qui redirige selon `navigator.languages`
  (français → `/fr/`, sinon `/en/`). Sans JavaScript, le visiteur choisit sa langue.
- **Rationale**: FR-015 sans dépendre d'un hébergeur (l'hébergement est décidé à la mise en
  ligne) ; les robots indexent les deux versions grâce aux `hreflang`.
- **Alternatives considered**: redirection serveur selon `Accept-Language` (dépend de
  l'hébergeur, à ajouter plus tard si disponible) ; racine = contenu anglais (pénalise le
  public francophone).

## 6. Redirections

- **Decision**: table `content/redirects.yaml` (ancienne adresse → nouvelle), injectée dans la
  configuration `redirects` d'Astro, qui génère des pages de redirection statiques
  (meta refresh + `rel=canonical`). Un fichier natif de l'hébergeur sera généré depuis la même
  table une fois l'hébergeur choisi.
- **Rationale**: FR-025 portable sur n'importe quel hébergement statique.
- **Alternatives considered**: redirections déclarées seulement chez l'hébergeur (bloquant
  tant qu'il n'est pas choisi).

## 7. Référencement et IA

- **Decision**:
  - `@astrojs/sitemap` avec les alternates `hreflang` ; `robots.txt` généré qui y renvoie.
  - JSON-LD par type de page : `Person` + `ProfilePage` (accueil), `CreativeWork` ou
    `SoftwareSourceCode` (projet), `EducationalOccupationalCredential` (diplôme),
    `EmployeeRole` / `OrganizationRole` rattaché à `Person` (expérience), `BreadcrumbList`
    partout ; typage avec `schema-dts`.
  - `llms.txt` (format llmstxt.org) et `llms-full.txt` (tout le contenu en Markdown) générés
    par langue depuis les collections.
  - Balises Open Graph / Twitter et image d'aperçu par page (image du projet ou image par
    défaut générée à la construction).
- **Rationale**: FR-016 à FR-019 ; tout dérive de la source unique.
- **Alternatives considered**: microdonnées dans le HTML (plus verbeuses, mélangées au
  balisage) ; `llms.txt` écrit à la main (se périme).

## 8. Images et polices

- **Decision**: `astro:assets` (AVIF + WebP, `srcset`, `loading="lazy"` hors écran, largeur et
  hauteur fixées) ; polices auto-hébergées (fichiers WOFF2 dans le projet, sous-ensemble latin),
  `font-display: swap`, au plus deux familles.
- **Rationale**: FR-022, CLS < 0,1, aucune requête tierce (FR-023, principe V).
- **Alternatives considered**: Google Fonts (requête tierce interdite) ; CDN d'images
  (dépendance externe).

## 9. Styles et JavaScript

- **Decision**: CSS natif (propriétés personnalisées, styles scopés des composants Astro,
  `clamp()` pour la typographie fluide), aucun framework UI. JavaScript limité au script de la
  racine (§ 5) et au chargement des vidéos tierces au clic (façade, FR-023).
- **Rationale**: budget JS, fonctionnement sans JS (FR-010), mise en page 320–2560 px (FR-024).
- **Alternatives considered**: Tailwind (possible, mais une dépendance de plus pour un site de
  quelques gabarits) ; un framework d'îles (React/Svelte) inutile pour cette fonctionnalité.

## 10. Filtrage des projets sans JavaScript

- **Decision**: une page statique par catégorie (`/fr/projets/categorie/<id>/`), liée depuis la
  liste ; pas de filtre dynamique dans cette version.
- **Rationale**: FR-009 respecté sans JS ; pages indexables par catégorie en bonus.
- **Alternatives considered**: filtre en JS avec liste complète en repli (plus de code pour un
  gain faible avec peu de projets).

## 11. Protection de l'adresse e-mail

- **Decision**: lien `mailto:` dont l'adresse et le texte sont encodés en entités HTML
  numériques ; aucune image, aucun service tiers.
- **Rationale**: fonctionne sans JavaScript (FR-010) et bloque les collecteurs naïfs qui lisent
  le HTML brut (User Story 5, scénario 2). Protection volontairement simple.
- **Alternatives considered**: adresse assemblée en JS (inutilisable sans JS) ; image de
  l'adresse (inaccessible) ; formulaire (exclu par la clarification).

## 12. Export pour la future scène 3D

- **Decision**: la scène 3D, dans le même projet Astro, lira directement les collections. En
  plus, la construction publie `/data/portfolio.json` (tout le contenu publié, deux langues,
  URL des pages), décrit par [contracts/portfolio-export.md](contracts/portfolio-export.md).
- **Rationale**: FR-006 (format documenté, lisible par un autre programme) et principe I ; le
  JSON sert aussi au débogage et à d'éventuels outils externes.
- **Alternatives considered**: seulement les collections (pas lisible hors d'Astro) ; une API
  dynamique (contraire au principe IV).

## 13. Tests et contrôles qualité

- **Decision**:
  - **Vitest** : schémas, vérification croisée, générateurs (`llms.txt`, export JSON, JSON-LD).
  - **Playwright** : parcours des User Stories, en contexte JavaScript désactivé ; sélecteur de
    langue ; audit réseau (aucune requête hors domaine, aucun cookie) ; viewport 320 px.
  - **Lighthouse CI** (`@lhci/cli`) : seuils ≥ 90 sur les quatre catégories et budgets
    (LCP, CLS, JS) sur une page de chaque type, profil mobile.
  - Vérification de construction : HTML valide, données structurées parsables, sitemap
    complet ; vérification des liens externes en avertissement.
- **Rationale**: chaque contrôle avant mise en production de la constitution est automatisé.
- **Alternatives considered**: tests manuels uniquement (non reproductibles) ; Cypress (pas de
  contexte sans JS aussi simple que Playwright).

## 14. Hébergement

- **Decision**: reporté à la mise en ligne (choix utilisateur). Le plan reste neutre : sortie
  `dist/` statique, redirections portables (§ 6), aucune fonction serveur.
- **Rationale**: principe IV satisfait quel que soit l'hébergeur statique retenu.
- **Alternatives considered**: Cloudflare Pages, Netlify, GitHub Pages, VPS + Caddy, à
  comparer au moment voulu.
