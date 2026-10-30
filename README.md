# Portfolio personnel

Portfolio bilingue (français / anglais) en deux parties :

- **la version écrite** (ce dépôt, spec 001) : un site statique classique, rapide, lisible sans
  JavaScript, pensé pour les moteurs de recherche et les agents IA ;
- **la scène 3D isométrique** (spec 002, à venir) : un petit monde à explorer, qui lira le même
  contenu.

Le site est construit avec [Astro](https://astro.build) et TypeScript, sans framework
d'interface, sans traceur ni cookie.

## Démarrer

Prérequis : Node.js 24.

```bash
npm install
npm run dev        # serveur de développement sur http://localhost:4321
npm run build      # site statique dans dist/ (s'arrête si le contenu est invalide)
npm run preview    # sert dist/
```

## Le contenu

Tout le contenu (profil, projets, diplômes, expériences, textes des pages) est dans
[`content/`](content/), en YAML et Markdown, une seule fois pour les deux langues. Le guide
[`content/README.md`](content/README.md) explique comment ajouter ou modifier un élément.

Le contenu actuel est **provisoire** : à remplacer par les vrais textes, images et adresse
e-mail avant la mise en ligne.

## Ce que le site publie

| Adresse | Contenu |
|---|---|
| `/` | redirige vers `/fr/` ou `/en/` selon la langue du navigateur |
| `/fr/…`, `/en/…` | accueil, projets (et catégories), parcours, contact |
| `/sitemap.xml`, `/robots.txt` | pour les moteurs de recherche |
| `/llms.txt`, `/llms-full.txt` | pour les agents IA |
| `/data/portfolio.json` | export du contenu pour la scène 3D |

## Contrôles qualité

| Commande | Vérifie |
|---|---|
| `npx astro check` | les types |
| `npm test` | schémas, validation du contenu, adresses, JSON-LD, llms.txt, export, et deux constructions réelles sur les fixtures |
| `npm run check:seo` | après `build` : titres, descriptions, hreflang, Open Graph, JSON-LD, titres de page, textes alternatifs, sitemap |
| `npm run test:e2e` | parcours visiteur sur ordinateur, iPhone, 320 px et sans JavaScript ; langue ; vie privée |
| `npm run lhci` | après `build` : Lighthouse ≥ 90 partout, LCP < 2,5 s, CLS < 0,1, JavaScript ≤ 50 Ko |
| `npm run check:links` | les liens externes du contenu (avertissements seulement) |

La CI GitHub (`.github/workflows/ci.yml`) lance tout cela sur chaque pull request.

Sous Windows, si Lighthouse ne parvient pas à lancer Chrome (`spawn UNKNOWN`), démarrer un
Chromium avec `--remote-debugging-port=9222` et lancer
`npx lhci autorun --collect.settings.port=9222`.

## Spécifications

Le projet suit [Spec Kit](https://github.com/github/spec-kit) :

- constitution : [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- spec 001 (version écrite) : [`specs/001-portfolio-content-written/`](specs/001-portfolio-content-written/)

## Hébergement

Pas encore choisi. Le site est entièrement statique (`dist/`) et fonctionne sur n'importe quel
hébergement statique ; `site` dans `astro.config.mjs` reste à régler avec le vrai domaine.
