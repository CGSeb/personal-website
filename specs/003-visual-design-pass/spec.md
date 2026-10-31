# Feature Specification: Passe graphique et design du portfolio

**Feature Branch**: `feat/003-design-spec`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "Passe graphique et design de tout le portfolio : version écrite (accueil, projets, parcours, contact, en-tête, pied de page, page introuvable) et scène 3D isométrique (pièce, objets, matériaux, lumière, panneaux, écran de choix et replis), avec une direction artistique commune aux deux. Démarche : explorer d'abord deux styles, « atelier » (chaleureux, bois, artisan) et « bureau moderne » (épuré, contemporain), chacun sous forme de maquettes en ligne consultables côte à côte (au minimum l'accueil de la version écrite et la pièce 3D), avec sa propre palette et sa couleur d'accent. Sébastien compare et choisit un seul style, l'autre est abandonné ; le style retenu est ensuite appliqué à tout le site et à toute la scène. Typographie sans-serif moderne, très lisible (polices servies localement). Thèmes clair et sombre : suivent le réglage du système, avec un bouton pour changer, choix mémorisé ; en sombre, la pièce 3D passe en ambiance de nuit (lampes allumées, fenêtre sombre). Dans la pièce, quel que soit le style : un mur des diplômes et une étagère avec des plantes ; le support des projets (bureau, établi, étagère…) est libre selon le style. Contraintes conservées : Lighthouse ≥ 90 (aujourd'hui 100), budgets de la scène (≤ 3 Mo avant interaction, interactive < 5 s sur mobile, 60 / 30 i/s), accessibilité (contrastes AA dans les deux thèmes, mouvements réduits), fonctionnement sans JavaScript de la version écrite, aucun traceur, contenu inchangé (source unique). Les maquettes d'exploration ne sont pas indexées et ne sont pas publiées avec le site."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comparer deux styles et en choisir un (Priority: P1)

Sébastien ouvre deux maquettes, l'une dans le style « atelier » (chaleureux, bois, artisan),
l'autre dans le style « bureau moderne » (épuré, contemporain). Chacune montre au moins
l'accueil de la version écrite et la pièce 3D, avec ses vrais contenus, en clair et en sombre.
Il les compare côte à côte, sur ordinateur et sur téléphone, puis choisit un style ; le choix
et ses raisons sont consignés.

**Why this priority**: tout le reste de la passe graphique dépend de ce choix ; le décider sur
des maquettes concrètes évite de refaire le site deux fois.

**Independent Test**: ouvrir les deux maquettes dans deux onglets, passer de l'une à l'autre,
basculer clair / sombre dans chacune, et vérifier que chacune montre un accueil et une pièce
complets, avec une palette et une couleur d'accent distinctes.

**Acceptance Scenarios**:

1. **Given** les deux maquettes prêtes, **When** Sébastien ouvre l'une puis l'autre, **Then**
   chacune présente un accueil de la version écrite et la pièce 3D dans son style, avec le
   contenu réel du portfolio.
2. **Given** une maquette ouverte, **When** il passe du thème clair au thème sombre, **Then**
   l'accueil et la pièce changent d'ambiance (la pièce passe de nuit).
3. **Given** une maquette ouverte sur un téléphone, **When** il la parcourt, **Then** l'accueil
   et la pièce sont lisibles et utilisables en portrait.
4. **Given** les deux maquettes comparées, **When** Sébastien choisit un style, **Then** le
   choix, ses raisons et les éléments repris de l'autre style (s'il y en a) sont consignés
   dans le dossier de la fonctionnalité.
5. **Given** les maquettes, **When** un moteur de recherche ou un visiteur explore le site
   publié, **Then** il ne les trouve pas : elles ne font pas partie du site publié et ne sont
   pas indexables.

---

### User Story 2 - Un site écrit au style retenu (Priority: P1)

Un visiteur parcourt la version écrite : accueil, projets (liste, catégories, page d'un
projet), parcours (diplômes, expériences), contact et page introuvable. Toutes les pages,
l'en-tête et le pied de page partagent la même identité visuelle, celle du style retenu :
palette, typographie, espacements, images, états des liens et boutons.

**Why this priority**: la version écrite est la porte d'entrée principale (constitution,
principe II) ; c'est elle que voient d'abord recruteurs et moteurs.

**Independent Test**: parcourir chaque type de page dans les deux langues et les deux thèmes,
et vérifier l'identité commune, la lisibilité, les contrastes et le score Lighthouse.

**Acceptance Scenarios**:

1. **Given** le style retenu appliqué, **When** le visiteur ouvre chaque type de page,
   **Then** toutes utilisent les mêmes couleurs, typographies, composants (cartes, étiquettes,
   boutons, liens) et la même mise en page de l'en-tête et du pied de page.
2. **Given** un projet sans visuel, **When** sa carte ou sa page s'affiche, **Then** un visuel
   par défaut au style retenu remplace l'image.
3. **Given** JavaScript désactivé, **When** le visiteur parcourt le site, **Then** tout reste
   lisible et navigable, dans le thème du système.
4. **Given** un écran de 320 px de large, **When** le visiteur parcourt chaque page, **Then**
   rien ne déborde et aucun défilement horizontal n'apparaît.

---

### User Story 3 - Une pièce 3D au style retenu (Priority: P1)

Un visiteur ouvre l'expérience 3D. La pièce, ses objets, ses matériaux et sa lumière suivent
le style retenu. Il y retrouve un mur des diplômes et une étagère avec des plantes ; les
projets reposent sur le support propre au style (établi, bureau, étagère…). Les panneaux
d'information, les boutons, l'écran de choix et les écrans de repli ont la même identité que
la version écrite.

**Why this priority**: la scène est l'expérience qui distingue le portfolio ; une scène au
style différent du site donnerait l'impression de deux sites.

**Independent Test**: ouvrir la scène, sélectionner un objet de chaque type, provoquer chaque
repli (WebGL absent, animations réduites, économie de données, lenteur), et comparer chaque
écran à la version écrite.

**Acceptance Scenarios**:

1. **Given** la scène chargée, **When** le visiteur la parcourt, **Then** il reconnaît le mur
   des diplômes, l'étagère avec des plantes et le support des projets, dans le style retenu.
2. **Given** un objet sélectionné, **When** son panneau s'ouvre, **Then** le panneau reprend la
   typographie, la palette et les composants de la version écrite.
3. **Given** un cas de repli, **When** l'écran de choix ou le message de repli s'affiche,
   **Then** il a l'identité visuelle du site et reste lisible dans les deux thèmes.
4. **Given** un nouveau projet ajouté à la source de contenu, **When** la scène est
   reconstruite, **Then** il apparaît sur le support des projets sans modifier la pièce.

---

### User Story 4 - Choisir son thème, clair ou sombre (Priority: P2)

Le site suit d'abord le réglage clair / sombre du système. Le visiteur peut changer de thème
avec un bouton visible, sur la version écrite comme dans la scène ; son choix est gardé d'une
page à l'autre et d'une visite à l'autre. En sombre, la pièce passe en ambiance de nuit :
lampes allumées, fenêtre sombre.

**Why this priority**: le thème sombre existe déjà, sans bouton ; le bouton et la pièce de nuit
améliorent le confort et le charme, mais le site est utilisable sans.

**Independent Test**: régler le système en sombre, ouvrir le site (sombre), passer en clair
avec le bouton, changer de page puis rouvrir le site : il reste en clair ; ouvrir la scène et
basculer : la pièce passe du jour à la nuit.

**Acceptance Scenarios**:

1. **Given** aucun choix enregistré, **When** le visiteur ouvre le site, **Then** le thème suit
   le réglage du système.
2. **Given** le visiteur choisit un thème avec le bouton, **When** il change de page, de
   langue, ou revient plus tard, **Then** son choix est conservé, sans flash de l'autre thème
   au chargement.
3. **Given** la scène ouverte, **When** le visiteur bascule le thème, **Then** la pièce passe
   du jour à la nuit (ou l'inverse) sans recharger la page ni perdre la vue ou le panneau
   ouvert.
4. **Given** le bouton de thème, **When** il est utilisé au clavier ou par un lecteur d'écran,
   **Then** il est atteignable, son état est annoncé et son libellé existe dans les deux
   langues.
5. **Given** un choix enregistré, **When** le visiteur veut revenir au réglage du système,
   **Then** il le peut depuis le même bouton.

---

### User Story 5 - Garder la qualité acquise (Priority: P2)

Après la passe graphique, Sébastien relance tous les contrôles existants : scores Lighthouse,
budgets de poids et de fluidité de la scène, accessibilité, vie privée, deux langues, sans
JavaScript. Tout passe comme avant.

**Why this priority**: une refonte visuelle qui dégrade la vitesse ou l'accessibilité perdrait
ce qui fait la force du site.

**Independent Test**: lancer la suite de contrôles et le quickstart des specs 001 et 002 sur le
site refait.

**Acceptance Scenarios**:

1. **Given** le site refait, **When** les contrôles de qualité sont lancés, **Then** ils passent
   tous, dans les deux thèmes.
2. **Given** la scène refaite, **When** ses budgets sont mesurés, **Then** elle reste sous
   3 Mo avant interaction, interactive en moins de 5 s sur mobile, à 60 / 30 i/s.

---

### Edge Cases

- Le visiteur a activé « réduire les animations » : aucune transition de thème animée, aucun
  effet de mouvement décoratif, sur le site comme dans la scène.
- Le stockage du navigateur est bloqué ou effacé (navigation privée) : le bouton de thème
  fonctionne pour la page en cours, puis le site revient au réglage du système.
- Le réglage du système change pendant la visite sans choix enregistré : le site suit le
  changement.
- Contraste élevé forcé par le système (mode contraste de Windows) : le texte et les contrôles
  restent lisibles et le focus visible.
- Les polices ne se chargent pas ou tardent : une police de repli aux mesures proches
  s'affiche sans décalage visible de la mise en page.
- Photo de profil, visuels de projets ou diplômes clairs sur fond clair (ou sombres sur fond
  sombre) : ils restent distincts du fond dans les deux thèmes.
- Pièce de nuit sur un appareil modeste : l'éclairage nocturne ne fait pas passer la scène sous
  30 i/s ; la qualité s'ajuste comme de jour.
- Impression d'une page de la version écrite : texte lisible en noir sur blanc, sans décor
  inutile, quel que soit le thème.
- Un style comporte un élément trop lourd (texture, modèle) : il est simplifié pour tenir le
  budget plutôt que de le dépasser.

## Requirements *(mandatory)*

### Functional Requirements

**Exploration des styles**

- **FR-001**: Deux maquettes MUST être produites, une par style : « atelier » (chaleureux, bois,
  artisan) et « bureau moderne » (épuré, contemporain), chacune avec sa propre palette et sa
  couleur d'accent, dans les deux thèmes.
- **FR-002**: Chaque maquette MUST montrer au minimum l'accueil de la version écrite et la pièce
  3D (mur des diplômes, étagère avec plantes, support des projets, un panneau ouvert), avec le
  contenu réel du portfolio, consultables dans un navigateur sur ordinateur et sur téléphone.
- **FR-003**: Les maquettes MUST pouvoir s'ouvrir côte à côte (deux onglets ou deux fenêtres)
  pour comparer les mêmes écrans.
- **FR-004**: Les maquettes MUST être exclues du site publié : absentes du plan du site, du
  résumé pour les IA et de la construction de production, et non indexables.
- **FR-005**: Le style retenu, les raisons du choix et les éléments éventuellement repris de
  l'autre style MUST être consignés dans le dossier de la fonctionnalité ; le style abandonné
  ne laisse aucun reste dans le site publié.

**Direction artistique commune**

- **FR-006**: Le style retenu MUST être décrit par un ensemble unique de valeurs de design
  (couleurs des deux thèmes, typographies, tailles, espacements, arrondis, ombres, états
  interactifs) utilisé à la fois par la version écrite et par l'interface de la scène.
- **FR-007**: La typographie MUST être une sans-serif moderne, très lisible, avec au plus deux
  familles, servies depuis le site lui-même, avec une police de repli aux mesures proches.
- **FR-008**: Les couleurs de la pièce 3D (matériaux, lumière) MUST s'accorder avec la palette
  du site, de sorte que la scène et la version écrite se reconnaissent comme un même site.

**Version écrite**

- **FR-009**: Le style retenu MUST être appliqué à toutes les pages de la version écrite :
  accueil, liste des projets et pages de catégorie, page d'un projet, parcours, page d'un
  diplôme, page d'une expérience, contact, page introuvable, ainsi qu'à l'en-tête, au pied de
  page, au sélecteur de langue et à l'accès vers la 3D.
- **FR-010**: Les composants communs (cartes de projet, étiquettes de technologie et de
  catégorie, boutons, liens, listes chronologiques, visuel par défaut) MUST avoir chacun un
  seul aspect, partagé par toutes les pages.
- **FR-011**: Chaque page MUST rester entièrement lisible et navigable sans JavaScript ; sans
  JavaScript, le thème suit le réglage du système.
- **FR-012**: Les pages MUST s'adapter de 320 px à 1920 px de large sans défilement horizontal.
- **FR-013**: Les pages MUST s'imprimer lisiblement (texte foncé sur fond clair, sans décor
  inutile).

**Scène 3D**

- **FR-014**: La pièce, ses objets, leurs matériaux et la lumière MUST suivre le style retenu.
- **FR-015**: La pièce MUST contenir un mur des diplômes et une étagère avec des plantes ; les
  projets MUST reposer sur un support propre au style (bureau, établi, étagère…), qui accueille
  automatiquement les projets génériques et garde les places des projets mis en avant.
- **FR-016**: En thème sombre, la pièce MUST passer en ambiance de nuit (lampes allumées,
  fenêtre sombre) ; en clair, en ambiance de jour.
- **FR-017**: Les panneaux d'information, les boutons de la scène, la liste textuelle des
  objets, l'indicateur de chargement, l'écran de choix et les écrans de repli MUST reprendre
  l'identité visuelle de la version écrite.
- **FR-018**: Les objets interactifs MUST rester reconnaissables par type et leur mise en
  évidence (survol, toucher, focus) MUST rester visible dans les deux ambiances.

**Thèmes clair et sombre**

- **FR-019**: Sans choix du visiteur, le site MUST suivre le réglage clair / sombre du système,
  et suivre ses changements pendant la visite.
- **FR-020**: Un bouton visible dans l'en-tête de la version écrite et dans la scène MUST
  permettre de choisir le thème clair, le thème sombre, ou de revenir au réglage du système.
- **FR-021**: Le choix MUST être gardé dans le navigateur du visiteur seulement (aucun cookie,
  rien envoyé au serveur), appliqué à toutes les pages et dans les deux langues, sans flash de
  l'autre thème au chargement.
- **FR-022**: Basculer le thème dans la scène MUST changer l'ambiance de la pièce sans
  recharger la page ni perdre la vue, le panneau ouvert ou la langue.
- **FR-023**: Le bouton de thème MUST être utilisable au clavier, annoncer son état aux lecteurs
  d'écran et avoir ses libellés dans les deux langues.

**Qualité conservée**

- **FR-024**: Dans les deux thèmes, le texte MUST respecter un contraste d'au moins 4,5:1
  (3:1 pour les grands textes et les éléments d'interface), et le focus clavier MUST rester
  visible partout.
- **FR-025**: Avec « réduire les animations », les transitions décoratives et le changement
  d'ambiance de la pièce MUST être instantanés.
- **FR-026**: La version écrite MUST garder ses budgets (score Lighthouse ≥ 90 dans chaque
  catégorie, LCP < 2,5 s, CLS < 0,1, INP < 200 ms, JavaScript ≤ 50 Ko compressé par page).
- **FR-027**: La scène MUST garder ses budgets (≤ 3 Mo compressés avant la première
  interaction, interactive en moins de 5 s sur mobile, 60 i/s sur ordinateur, 30 i/s sur
  téléphone de milieu de gamme), de jour comme de nuit.
- **FR-028**: Polices, images, textures et modèles MUST être servis par le site ; aucun traceur,
  aucune requête vers un domaine tiers, aucun cookie.
- **FR-029**: Le contenu (textes, projets, diplômes, expériences) MUST rester celui de la source
  unique, inchangé par la passe graphique ; seuls les visuels décoratifs et les textes
  d'interface nouveaux (bouton de thème) sont ajoutés, dans les deux langues.

### Key Entities

- **Style** : une direction artistique candidate (« atelier » ou « bureau moderne ») ; nom,
  ambiance, palette des deux thèmes, couleur d'accent, typographie, principes des matériaux et
  de la lumière de la pièce, support des projets ; état : en essai, retenu, abandonné.
- **Maquette** : la démonstration d'un style ; écrans montrés (accueil, pièce, panneau),
  thèmes, adresse de consultation hors site publié.
- **Valeurs de design** : l'ensemble unique des couleurs, typographies, tailles, espacements,
  arrondis, ombres et états du style retenu, partagé par le site et la scène.
- **Thème** : clair ou sombre ; pour la pièce, ambiance de jour ou de nuit.
- **Préférence de thème du visiteur** : système, clair ou sombre, gardée dans son navigateur.
- **Décision de style** : le style retenu, la date, les raisons et les emprunts à l'autre
  style.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les deux maquettes montrent chacune 100 % des écrans prévus (accueil, pièce,
  panneau ouvert) dans les deux thèmes, et Sébastien prend sa décision en une séance de
  comparaison.
- **SC-002**: 100 % des pages de la version écrite (chaque type, deux langues, deux thèmes)
  utilisent les seules valeurs de design du style retenu ; aucune couleur ou police hors de cet
  ensemble.
- **SC-003**: Le score Lighthouse reste ≥ 90 dans chaque catégorie, sur chaque type de page,
  dans les deux thèmes (objectif : rester à 100 comme aujourd'hui).
- **SC-004**: 100 % des textes et contrôles atteignent les contrastes AA dans les deux thèmes,
  sur la version écrite et dans la scène.
- **SC-005**: La scène reste sous 3 Mo avant la première interaction, devient interactive en
  moins de 5 s sur mobile, et tient 30 i/s sur téléphone de milieu de gamme et 60 i/s sur
  ordinateur, de jour comme de nuit.
- **SC-006**: Le choix de thème est conservé sur 100 % des pages et des visites suivantes du
  même navigateur, sans aucun flash de l'autre thème au chargement.
- **SC-007**: Une personne qui passe de la version écrite à la scène (ou l'inverse) reconnaît
  le même site : couleurs, typographie et boutons identiques.
- **SC-008**: Aucune page du site publié ne contient ni ne renvoie vers une maquette, et aucune
  requête vers un domaine tiers ni aucun cookie n'apparaît pendant une visite.
- **SC-009**: Tous les contrôles automatiques des specs 001 et 002 (sans JavaScript, deux
  langues, SEO, liens, vie privée, budgets, accessibilité) passent après la refonte.

## Assumptions

- Les maquettes sont consultées en local (serveur de développement ou aperçu de la
  construction) ou sur un aperçu privé ; elles vivent dans le dépôt pendant la comparaison et
  ne sont jamais construites avec le site de production. Une fois le style choisi, la maquette
  abandonnée peut être retirée du dépôt (le dossier de la fonctionnalité garde la décision et
  des captures).
- Les maquettes de la pièce peuvent être des pièces 3D simplifiées (formes, matériaux et
  lumière du style) plutôt que des modèles finis ; le modèle définitif n'est fait que pour le
  style retenu.
- Le contenu réel (spec 001, PR #18) est en place et sert aux maquettes.
- La pièce est modélisée dans Blender par Sébastien avec l'aide de Claude, en gardant les
  emplacements nommés de la spec 002 (places des projets, mur des diplômes, objets dédiés) ;
  le support des projets peut changer d'aspect et de forme, pas de principe.
- La police actuelle (sans-serif servie localement) peut être gardée ou remplacée par une autre
  sans-serif moderne sous licence libre, selon le style retenu.
- Le thème sombre existe déjà en suivant le système ; cette fonctionnalité ajoute le bouton, la
  mémorisation et la pièce de nuit.
- La préférence de thème est gardée dans le stockage local du navigateur, ce qui ne demande
  aucun bandeau de consentement (préférence fonctionnelle, aucun cookie).
- Pas de son, d'animation d'introduction, ni de nouveau contenu (blog, nouvelles pages) dans
  cette fonctionnalité.
- Le choix de l'hébergement et la mise en ligne restent hors de cette fonctionnalité.
- Après une première comparaison (31/10/2026), Sébastien a demandé un troisième candidat,
  « tour » : le bureau moderne en haut d'un immeuble, très moderne et sci-fi. Il s'ajoute aux
  deux maquettes de FR-001 et suit les mêmes règles (FR-002 à FR-005).
