# Contract: Export `/data/portfolio.json`

Export statique de tout le contenu **publié** (les brouillons en sont absents), généré à chaque
construction depuis la source de contenu. Destiné à la future scène 3D et à tout programme
externe (FR-006). Encodage UTF-8, `Content-Type: application/json`.

## Forme

```jsonc
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-30T12:00:00Z",       // ISO 8601
  "site": { "baseUrl": "https://example.com", "languages": ["fr", "en"] },
  "profile": {
    "name": "…",
    "headline": { "fr": "…", "en": "…" },
    "summary": { "fr": "…", "en": "…" },
    "photo": { "url": "/_astro/…webp", "alt": { "fr": "…", "en": "…" } },
    "profiles": [{ "network": "github", "url": "https://…" }]
    // email volontairement absent (protection contre la collecte)
  },
  "categories":   [{ "id": "web", "label": { "fr": "Web", "en": "Web" } }],
  "technologies": [{ "id": "astro", "label": { "fr": "Astro", "en": "Astro" } }],
  "projects": [{
    "id": "portfolio-3d",
    "title":   { "fr": "…", "en": "…" },
    "summary": { "fr": "…", "en": "…" },
    "role":    { "fr": "…", "en": "…" },
    "period":  { "start": "2026-10", "end": null },
    "categories": ["web"],
    "technologies": ["astro"],
    "cover": { "url": "/_astro/…", "alt": { "fr": "…", "en": "…" } },   // ou null
    "links": [{ "kind": "code", "url": "https://…" }],
    "experience": ["studio-x-dev"],
    "education": [],
    "featured": true,
    "order": 0,
    "urls": { "fr": "/fr/projets/portfolio-3d/", "en": "/en/projects/portfolio-3d/" }
  }],
  "education": [{
    "id": "…", "title": {…}, "institution": "…", "location": {…},
    "period": {…}, "level": {…} /* ou null */, "projects": ["…"], "urls": {…}
  }],
  "experience": [{
    "id": "…", "position": {…}, "organization": "…", "location": {…},
    "type": "employment", "period": {…}, "technologies": [], "projects": ["…"], "urls": {…}
  }]
}
```

## Règles

- Les descriptions longues (`fr.md` / `en.md`) ne sont **pas** incluses : la scène 3D affiche
  le résumé et renvoie vers la page écrite (`urls`), conformément au principe I. Elles restent
  disponibles dans `/llms-full.txt`.
- Les relations inverses (`projects` d'un diplôme ou d'une expérience) sont incluses, calculées.
- Les URL d'images pointent vers les fichiers optimisés générés ; les URL de pages sont
  relatives à `site.baseUrl`.
- `id` est stable et identique à celui de la source de contenu.
- **Versionnage** : `schemaVersion` augmente à chaque changement incompatible (champ retiré ou
  renommé, type modifié). Ajouter un champ ne change pas la version.
- Un test unitaire valide l'export contre un schéma JSON maintenu à côté du code
  (`src/lib/export.schema.json`).
