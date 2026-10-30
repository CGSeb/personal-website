# Contract: Page de la scène

## Adresses

| Langue | Page | Exemple avec élément ouvert |
|---|---|---|
| Français | `/fr/explorer/` | `/fr/explorer/#projet/lesson-folk`, `#diplome/master-informatique`, `#experience/freelance-dev` |
| Anglais | `/en/explore/` | `/en/explore/#project/lesson-folk`, `#education/master-informatique`, `#experience/freelance-dev` |

- Type de page `scene` dans `src/i18n/routes.ts` ; `hreflang`, canonique, Open Graph et sitemap
  comme les autres pages.
- Fragment : `#<type-traduit>/<id>`. Types : `projet|project`, `diplome|education`,
  `experience|experience`. Un fragment inconnu est ignoré (scène sans panneau).
- Le sélecteur de langue de l'en-tête pointe vers la page de l'autre langue **avec le fragment
  traduit** (mis à jour par le script quand un panneau s'ouvre ou se ferme).
- L'accueil du site écrit affiche le lien « Explorer le portfolio en 3D » vers cette page
  (emplacement `SHOW_3D_ENTRY` de la spec 001, activé).

## Contenu HTML (avant tout JavaScript)

Dans cet ordre, dans `<main>` :

1. `<h1>` + une phrase d'introduction + lien « Voir la version écrite ».
2. Le conteneur de la scène (`#scene`, avec indicateur de chargement, rôle `application` une
   fois la 3D prête, nom accessible).
3. `<nav aria-label="…">` **liste des éléments**, groupée par type, un `<button>` par élément
   (`data-key="<type>/<id>"`) ; sans JavaScript, chaque entrée est un lien vers la page écrite.
4. Un `<article id="panel-<type>-<id>" hidden>` par élément : contenu du panneau (FR-009 à
   FR-011) et lien « En savoir plus » vers la page écrite.
5. `<noscript>` : message et lien vers la version écrite.
6. Le manifeste : `<script type="application/json" id="scene-manifest">` (tableau de
   `SceneItem`, voir [../data-model.md](../data-model.md)).

## Comportement

- Ouvrir un élément (objet, bouton de liste, fragment) : affiche son article comme panneau
  (dialogue non modal, `aria-labelledby` sur son titre), met à jour le fragment
  (`history.replaceState`), déplace le focus sur le panneau.
- Fermer (bouton, Échap, clic hors panneau) : cache l'article, retire le fragment, rend le focus
  à l'élément d'origine.
- Écran de choix (mouvements réduits / économie de données) : deux boutons, « Continuer en 3D »
  et « Version écrite » ; mémorisé dans `scene.choice`.
- Repli (WebGL absent, échec de chargement, lenteur persistante) : le conteneur affiche un
  message, « Réessayer » si c'est un échec réseau, et le lien vers la version écrite ; la liste
  et les panneaux restent utilisables.

## Crochet de test

En développement et dans les tests seulement (`import.meta.env.DEV` ou attribut
`data-scene-test` posé par Playwright avant le chargement) :

```ts
window.__scene = {
  ready: Promise<void>,
  screenPosition(key: string): { x: number; y: number } | null, // centre de l'objet, en px CSS
  quality(): 'high' | 'medium' | 'low',
  frames(): number, // images rendues depuis le chargement
};
```

Jamais présent dans la construction publiée sans cet attribut.
