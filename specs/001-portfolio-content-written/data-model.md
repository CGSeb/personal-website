# Data Model: Portfolio écrit bilingue et source de contenu commune

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-10-30

Disposition des fichiers : [contracts/content-source.md](contracts/content-source.md).

## Types communs

| Type | Forme | Règles |
|---|---|---|
| `Id` | chaîne | kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`, 2–60 caractères, unique dans sa collection, ne change pas (sinon ajouter une redirection) |
| `LocalizedText` | `{ fr: string, en: string }` | les deux clés obligatoires, non vides après suppression des espaces |
| `LocalizedSlug` | `{ fr?: Id, en?: Id }` | optionnel ; par défaut le slug vaut l'`Id` ; unique par langue dans la collection |
| `YearMonth` | `AAAA-MM` | mois valide |
| `Period` | `{ start: YearMonth, end?: YearMonth }` | `end` ≥ `start` ; `end` absent = en cours (« depuis » / « present ») |
| `Image` | `{ src: chemin relatif, alt: LocalizedText }` | fichier existant (jpg, png, webp, avif) ; `alt` obligatoire sauf si `decorative: true` |
| `Link` | `{ kind: demo \| code \| video \| article \| other, url: URL https, label?: LocalizedText }` | URL absolue en `https` |
| `Status` | `published \| draft` | défaut `published` ; `draft` = exclu de tout le site public et de l'export |

## Profil (`content/profile.yaml`, unique)

| Champ | Type | Obligatoire |
|---|---|---|
| `name` | string | oui |
| `headline` | LocalizedText (activité en une ligne) | oui |
| `summary` | LocalizedText (2–3 phrases, ≤ 300 caractères) | oui |
| `photo` | Image | oui |
| `location` | LocalizedText | non |
| `languages` | liste de `{ code: ISO 639-1, level: LocalizedText }` | non |
| `email` | adresse e-mail | oui |
| `profiles` | liste de `{ network: linkedin \| github \| youtube \| x \| mastodon \| other, url, label? }` | non |
| `jobTitle` | LocalizedText (pour JSON-LD) | non |

La présentation longue vit dans `content/pages/home/fr.md` et `en.md`.

## Projet (`content/projects/<id>/`)

`meta.yaml` :

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `id` | Id | oui | = nom du dossier |
| `title` | LocalizedText | oui | ≤ 80 caractères |
| `summary` | LocalizedText | oui | 50–160 caractères (sert de meta description) |
| `role` | LocalizedText | oui | |
| `period` | Period | oui | |
| `categories` | liste d'Id de Catégorie | oui (≥ 1) | |
| `technologies` | liste d'Id de Technologie | non | |
| `cover` | Image | non | sinon visuel par défaut |
| `gallery` | liste d'Image | non | |
| `links` | liste de Link | non | une vidéo s'affiche en façade, chargée au clic |
| `experience` | liste d'Id d'Expérience | non | lien déclaré ici uniquement (FR-003) |
| `education` | liste d'Id de Diplôme | non | idem |
| `featured` | booléen | non | défaut `false` |
| `order` | entier | non | tri croissant ; à défaut, `period.start` décroissant |
| `slug` | LocalizedSlug | non | |
| `status` | Status | non | |
| `kind` | `software \| creative` | non | défaut `software` ; choisit `SoftwareSourceCode` ou `CreativeWork` en JSON-LD |

`fr.md`, `en.md` : description longue (contexte, démarche, résultats), Markdown, obligatoires.

## Diplôme (`content/education/<id>/`)

| Champ | Type | Obligatoire |
|---|---|---|
| `id` | Id | oui |
| `title` | LocalizedText | oui |
| `institution` | string (+ `institutionUrl` optionnel) | oui |
| `location` | LocalizedText | oui |
| `period` | Period (ou seulement `start` = date d'obtention avec `obtained: true`) | oui |
| `level` | LocalizedText (ex. « Master (Bac+5) ») | non |
| `skills` | liste de LocalizedText | non |
| `slug`, `status` | LocalizedSlug, Status | non |

`fr.md`, `en.md` : description, obligatoires.

## Expérience (`content/experience/<id>/`)

| Champ | Type | Obligatoire |
|---|---|---|
| `id` | Id | oui |
| `position` | LocalizedText | oui |
| `organization` | string (+ `organizationUrl` optionnel) | oui |
| `location` | LocalizedText | oui |
| `type` | `employment \| freelance \| internship \| apprenticeship \| volunteer` | oui |
| `period` | Period | oui |
| `technologies` | liste d'Id de Technologie | non |
| `slug`, `status` | LocalizedSlug, Status | non |

`fr.md`, `en.md` : missions et réalisations, obligatoires.

## Catégorie et Technologie (`content/categories.yaml`, `content/technologies.yaml`)

Liste de `{ id: Id, label: LocalizedText }`. Une catégorie sans projet publié ne génère pas de
page.

## Pages fixes (`content/pages/<page>/fr.md`, `en.md`)

`home`, `career`, `contact` : frontmatter `{ title, description }` + corps Markdown.
`description` sert de meta description (50–160 caractères).

## Redirections (`content/redirects.yaml`)

Liste de `{ from: chemin absolu, to: chemin absolu }` ; `from` unique, `to` doit correspondre à
une route générée.

## Relations

```text
Profil 1 ── * Projet / Diplôme / Expérience   (implicite : tout le contenu est celui du Profil)
Projet * ── * Expérience                      (déclaré dans Projet.experience)
Projet * ── * Diplôme                         (déclaré dans Projet.education)
Projet * ── * Catégorie, * ── * Technologie
Expérience * ── * Technologie
```

Les relations inverses (projets d'une expérience ou d'un diplôme) sont calculées à la
construction, jamais saisies.

## Règles de validation croisée (échec de construction, FR-004)

1. `id` égal au nom du dossier ; unique dans la collection.
2. `fr.md` et `en.md` présents et non vides pour chaque élément et chaque page fixe.
3. Chaque Id référencé (catégorie, technologie, expérience, diplôme) existe.
4. Un élément publié ne référence pas un élément `draft` (avertissement, la référence est
   ignorée).
5. Slugs uniques par langue et par collection.
6. Chaque `Image` pointe vers un fichier existant et a un `alt` FR/EN (ou `decorative: true`).
7. `redirects.yaml` : pas de boucle, `to` existant.

Format du message d'erreur : `content/<collection>/<id>/<fichier> : <champ> — <problème>`.

## Cycle de vie

```text
draft ──(status: published)──▶ published ──(status: draft)──▶ draft
published ──(changement d'id ou de slug)──▶ published + entrée dans redirects.yaml
```
