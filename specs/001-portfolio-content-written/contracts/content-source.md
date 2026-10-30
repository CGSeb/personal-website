# Contract: Source de contenu

Ce que Sébastien édite, et ce que toute la chaîne (version écrite, export, future 3D) lit.
Champs et règles : [../data-model.md](../data-model.md).

## Arborescence

```text
content/
├── profile.yaml
├── categories.yaml
├── technologies.yaml
├── redirects.yaml
├── pages/
│   ├── home/{fr.md,en.md}
│   ├── career/{fr.md,en.md}
│   └── contact/{fr.md,en.md}
├── projects/
│   └── <id>/
│       ├── meta.yaml
│       ├── fr.md
│       ├── en.md
│       └── *.{jpg,png,webp,avif}    # visuels référencés par meta.yaml (chemins relatifs)
├── education/<id>/{meta.yaml,fr.md,en.md}
└── experience/<id>/{meta.yaml,fr.md,en.md}
```

## Exemple : projet

`content/projects/portfolio-3d/meta.yaml`

```yaml
id: portfolio-3d
title:
  fr: Portfolio 3D isométrique
  en: Isometric 3D portfolio
summary:
  fr: Un portfolio à explorer comme un petit monde en 3D, vu de haut.
  en: A portfolio you explore like a small 3D world, seen from above.
role:
  fr: Conception et développement
  en: Design and development
period: { start: 2026-10 }
categories: [web]
technologies: [astro, threejs, typescript]
cover:
  src: ./cover.webp
  alt:
    fr: Vue isométrique du bureau virtuel
    en: Isometric view of the virtual desk
links:
  - { kind: code, url: https://github.com/example/portfolio }
featured: true
```

`content/projects/portfolio-3d/fr.md`

```markdown
## Contexte

…
```

## Exemple : expérience

```yaml
id: studio-x-dev
position: { fr: Développeur web, en: Web developer }
organization: Studio X
location: { fr: Lyon, France, en: Lyon, France }
type: employment
period: { start: 2023-09 }
technologies: [typescript]
```

## Publier un changement

1. Modifier ou ajouter les fichiers sous `content/`.
2. Lancer la construction : elle échoue avec un message précis si une règle est violée.
3. Enregistrer les fichiers dans le dépôt ; la publication suit le dépôt.

## Stabilité

- Les noms de champs et l'arborescence sont un contrat : un changement incompatible exige une
  migration du contenu existant et une mise à jour de [portfolio-export.md](portfolio-export.md).
- Ajouter un champ optionnel est compatible.
