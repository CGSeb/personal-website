# Contract: Champs ajoutés à `/data/portfolio.json`

Complète [../../001-portfolio-content-written/contracts/portfolio-export.md](../../001-portfolio-content-written/contracts/portfolio-export.md)
pour que l'export contienne tout ce que montrent les panneaux de la scène (FR-016). Ajouts
seulement : `schemaVersion` reste `1`, et `src/lib/export.schema.json` est mis à jour.

| Objet | Champ ajouté | Type | Source |
|---|---|---|---|
| projet | `kind` | `software \| creative` | `meta.yaml` |
| projet | `gallery` | tableau d'images `{ url, alt }` | `meta.yaml` |
| projet | `links[].label` | texte FR/EN ou absent | `meta.yaml` |
| diplôme | `skills` | tableau de textes FR/EN | `meta.yaml` |
| diplôme | `obtained` | booléen | `meta.yaml` |
| diplôme | `institutionUrl` | URL ou `null` | `meta.yaml` |
| expérience | `organizationUrl` | URL ou `null` | `meta.yaml` |
| tous | `scene` | `{ fr: string, en: string }` | adresse de la scène avec l'élément ouvert |

Les descriptions longues restent hors de l'export (dans `/llms-full.txt` et les pages écrites).
