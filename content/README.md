# Le contenu du portfolio

Tout ce que le site affiche vient de ce dossier : la version écrite, le sitemap, `llms.txt`
et l'export `/data/portfolio.json` que lira la scène 3D. On décrit chaque élément **une seule
fois**, en français et en anglais.

## Organisation

```text
content/
├── profile.yaml          Ton profil : nom, accroche, résumé, photo, e-mail, profils
├── profile-photo.webp    La photo référencée par profile.yaml
├── categories.yaml       Catégories de projets (filtre de la liste)
├── technologies.yaml     Technologies et outils
├── redirects.yaml        Anciennes adresses -> nouvelles
├── pages/                Textes fixes : home, career, contact (fr.md, en.md)
├── projects/<id>/        Un dossier par projet : meta.yaml, fr.md, en.md, images
├── education/<id>/       Un dossier par diplôme : meta.yaml, fr.md, en.md
└── experience/<id>/      Un dossier par expérience : meta.yaml, fr.md, en.md
```

- `<id>` : minuscules, chiffres et tirets (`mon-projet`). C'est l'identifiant stable de
  l'élément et, par défaut, la fin de son adresse. Le champ `id` de `meta.yaml` doit être
  identique au nom du dossier.
- `meta.yaml` : les champs courts. Les textes s'écrivent `{ fr: …, en: … }`, les dates
  `AAAA-MM`.
- `fr.md` et `en.md` : la description longue en Markdown (titres `##`, listes, liens).
  Les deux sont obligatoires.

## Ajouter un projet

1. Crée `content/projects/mon-projet/`.
2. Copie ce modèle dans `meta.yaml` et remplace les valeurs :

```yaml
id: mon-projet
title:
  fr: Titre du projet          # 80 caractères au plus
  en: Project title
summary:                       # 50 à 160 caractères : sert aussi de description Google
  fr: Une phrase qui dit ce que fait le projet et pour qui, en une ligne claire.
  en: One sentence saying what the project does and for whom, in one clear line.
role:
  fr: Conception et développement
  en: Design and development
period: { start: 2026-01 }     # ajoute end: 2026-06 si le projet est terminé
categories: [web]              # ids de categories.yaml, au moins un
technologies: [astro, typescript]  # ids de technologies.yaml
cover:                         # facultatif ; sinon un visuel par défaut
  src: ./cover.webp            # fichier dans le même dossier (jpg, png, webp, avif)
  alt:
    fr: Ce que montre l'image
    en: What the image shows
gallery: []                    # même forme que cover, autant d'images que voulu
links:                         # kind : demo, code, video, article ou other ; https seulement
  - { kind: demo, url: https://exemple.com }
experience: []                 # ids d'expériences liées (le lien apparaît des deux côtés)
education: []                  # ids de diplômes liés
featured: false                # true : affiché sur l'accueil
# order: 1                     # facultatif : force la position dans la liste
# slug: { fr: mon-projet-fr, en: my-project }  # facultatif : adresse traduite
# status: draft                # brouillon : absent de tout le site public
# kind: creative               # creative pour une œuvre (vidéo, 3D…), software par défaut
```

3. Écris `fr.md` et `en.md` (contexte, démarche, résultats).
4. Ajoute les images dans le dossier.
5. Lance `npm run build` : la construction s'arrête si quelque chose manque (voir plus bas).

Un diplôme (`education/`) ou une expérience (`experience/`) suit le même principe ; les champs
sont décrits dans `specs/001-portfolio-content-written/data-model.md`.

## Brouillon et mise en avant

- `status: draft` : l'élément n'apparaît nulle part (pages, sitemap, `llms.txt`, export). Un
  projet publié qui pointe vers un brouillon garde la référence, mais le lien est ignoré et la
  construction affiche un avertissement.
- `featured: true` : le projet s'affiche sur l'accueil, dans « Projets à la une ».

## Dans la scène 3D

La scène (`/fr/explorer/`, `/en/explore/`) se construit à partir du même contenu : un projet,
un diplôme ou une expérience publié y apparaît à la construction suivante, sans rien toucher à
la scène, et un brouillon en disparaît.

Un projet `featured: true` peut avoir sa place et son objet à lui dans la pièce :

1. dans `assets-src/models/room.blend`, ajouter un objet vide nommé `featured.<id>` (l'`id` du
   projet) à l'endroit voulu, axe +Z vers la pièce ;
2. modéliser l'objet dédié, l'exporter en `assets-src/models/featured/<id>.glb` (≤ 300 Ko une
   fois optimisé), puis `npm run models:optimize`.

Sans place réservée, le projet prend un emplacement de projet ordinaire ; sans fichier dédié
(ou s'il ne se charge pas), il garde sa place avec l'objet générique de projet.

## Changer une adresse

Une adresse publiée ne doit pas disparaître. Si tu renommes un dossier (`id`) ou un `slug`,
ajoute l'ancienne adresse dans `redirects.yaml`, une ligne par langue concernée :

```yaml
- { from: /fr/projets/ancien-nom/, to: /fr/projets/nouveau-nom/ }
- { from: /en/projects/old-name/, to: /en/projects/new-name/ }
```

## Lire une erreur de construction

Les erreurs nomment le fichier, le champ et le problème :

```text
content/projects/mon-projet/meta.yaml : categories[0] — « jeux » n'existe pas
content/projects/mon-projet/en.md : description — fichier manquant ou vide
```

Les erreurs de forme (champ manquant, traduction absente, texte trop long, image introuvable)
sont affichées par Astro avec le chemin du fichier et le champ, par exemple :

```text
[InvalidContentEntryDataError] projects → mon-projet data does not match collection schema.
  summary.en: 50 caractères au moins
```

Corrige, puis relance `npm run build`.
