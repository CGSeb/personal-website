# Contract: Adresses publiques

Toutes les adresses se terminent par `/` (sauf fichiers). `<slug>` = slug de la langue, sinon
l'`id` de l'élément. Chaque page HTML porte `<html lang>`, une URL canonique et des liens
`hreflang` vers `fr`, `en` et `x-default` (= `/`).

| Page | Français | Anglais |
|---|---|---|
| Racine (`x-default`) | `/` | `/` |
| Accueil | `/fr/` | `/en/` |
| Liste des projets | `/fr/projets/` | `/en/projects/` |
| Projets d'une catégorie | `/fr/projets/categorie/<cat-id>/` | `/en/projects/category/<cat-id>/` |
| Projet | `/fr/projets/<slug>/` | `/en/projects/<slug>/` |
| Parcours | `/fr/parcours/` | `/en/career/` |
| Diplôme | `/fr/parcours/diplomes/<slug>/` | `/en/career/education/<slug>/` |
| Expérience | `/fr/parcours/experiences/<slug>/` | `/en/career/experience/<slug>/` |
| Contact | `/fr/contact/` | `/en/contact/` |
| Introuvable | `/404.html` (langue détectée d'après le préfixe de l'adresse demandée quand l'hébergeur le permet ; sinon bilingue) | idem |

## Fichiers générés

| Adresse | Contenu |
|---|---|
| `/sitemap-index.xml` (+ `sitemap-*.xml`) | toutes les pages HTML publiques, avec alternates `hreflang` |
| `/robots.txt` | autorise tout, référence le sitemap |
| `/llms.txt` | résumé pour agents IA, format llmstxt.org, sections FR puis EN, liens absolus |
| `/llms-full.txt` | tout le contenu publié en Markdown, deux langues |
| `/data/portfolio.json` | export documenté dans [portfolio-export.md](portfolio-export.md) |

## Sélecteur de langue

Le lien vers l'autre langue pointe vers la page de **même type et même `id`** dans l'autre
langue (slug de cette langue). Pour la racine et la 404 : l'accueil de l'autre langue.

## Redirections

Chaque entrée de `content/redirects.yaml` produit une page statique à `from` qui redirige vers
`to` (meta refresh immédiat + `rel=canonical` vers `to`). Les redirections sont exclues du
sitemap.

## Règle de stabilité

Une adresse publiée ne disparaît pas : un changement de slug, d'`id` ou de segment exige une
redirection.
