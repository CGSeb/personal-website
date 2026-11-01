# Feature Specification: Avatar low-poly dans la scène 3D

**Feature Branch**: `feat/004-avatar-spec`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "Avatar low-poly dans la scène 3D isométrique du portfolio. Un petit personnage 3D low-poly qui représente Sébastien, assis au bureau devant l'écran principal de la pièce « tour » (specs 002 et 003). Il reste à sa place : le visiteur ne le dirige pas, la règle FR-004 de la spec 002 (caméra seule) ne change pas. Apparence : figurine stylisée à grosse tête qui ressemble à Sébastien (coupe, barbe, lunettes, couleurs reconnaissables), à partir de sa photo de profil, modélisée dans Blender avec les autres modèles. Animation : pose fixe par défaut, courte animation (petit salut) au clic ou au survol ; la scène reste en rendu à la demande et ne se redessine que pendant le geste ; pas d'animation si le visiteur demande moins de mouvements. Clic : une courte bulle de texte de présentation au-dessus de sa tête, dans la langue de la page (FR / EN), sans panneau ; le texte vient de la source de contenu unique, et reste accessible au clavier et aux lecteurs d'écran. L'avatar s'intègre à la lumière précalculée jour et nuit de la pièce, avec sa propre ombre au sol, et respecte les budgets de la scène (≤ 3 Mo avant interaction, 60 / 30 i/s), Lighthouse et le repli sans WebGL (où il n'apparaît pas et rien ne manque)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconnaître Sébastien dans sa pièce (Priority: P1)

Un visiteur ouvre la scène 3D. Au bureau, une petite figurine low-poly est assise dans la chaise,
visage visible depuis la vue de départ. On reconnaît Sébastien : lunettes, barbe, coupe, t-shirt
rouge brique. De jour comme de nuit, la figurine semble faire partie de la pièce.

**Why this priority**: c'est la raison d'être de la fonctionnalité : donner un visage à la pièce.
La figurine seule, sans aucune réaction, apporte déjà cette valeur.

**Independent Test**: ouvrir la scène en clair et en sombre, sur ordinateur et sur téléphone, et
vérifier que la figurine est à sa place, que son visage se voit depuis la vue de départ, et que
tous les objets autour restent visibles et sélectionnables.

**Acceptance Scenarios**:

1. **Given** la scène chargée, **When** le visiteur regarde la vue de départ, **Then** la figurine
   est assise au bureau, près de l'écran principal, tournée de sorte que son visage soit visible.
2. **Given** la figurine affichée, **When** Sébastien compare son rendu à sa photo de profil,
   **Then** les traits retenus (lunettes, barbe, coupe, couleur des cheveux, t-shirt rouge brique)
   sont reconnaissables, dans un style cohérent avec les autres objets de la pièce.
3. **Given** la scène en thème clair, **When** le visiteur passe en thème sombre, **Then** la
   figurine prend l'ambiance de nuit de la pièce, sans rechargement et sans changer de place.
4. **Given** la figurine à sa place, **When** le visiteur regarde le sol et la chaise autour
   d'elle, **Then** elle a une ombre cohérente avec la lumière de la pièce et ne flotte pas.
5. **Given** la figurine à sa place, **When** le visiteur sélectionne un objet proche (écran,
   objet du bureau), **Then** cet objet réagit comme avant : la figurine ne le masque pas et ne
   capte pas son clic.

---

### User Story 2 - Être salué et lire une présentation (Priority: P1)

Le visiteur survole la figurine : elle fait un petit salut de la main. En cliquant dessus (ou en la
touchant sur un téléphone), le salut se joue et une courte bulle apparaît au-dessus de sa tête :
un mot de bienvenue qui invite à explorer la pièce, et un bouton pour la fermer.

**Why this priority**: c'est ce qui rend la figurine vivante et lui donne un rôle dans la
découverte du portfolio, sans ajouter de panneau.

**Independent Test**: survoler puis cliquer la figurine, dans les deux langues, sur ordinateur et
sur téléphone, et vérifier le salut, le texte de la bulle et sa fermeture.

**Acceptance Scenarios**:

1. **Given** un ordinateur avec souris, **When** le visiteur survole la figurine, **Then** elle
   salue une fois, puis revient à sa pose ; aucune bulle ne s'ouvre.
2. **Given** la figurine au repos, **When** le visiteur clique dessus ou la touche, **Then** elle
   salue et une bulle s'ouvre au-dessus de sa tête, avec le mot de bienvenue dans la langue de la
   page et un bouton de fermeture, sans aucun lien.
3. **Given** une bulle ouverte, **When** le visiteur déplace ou zoome la vue, **Then** la bulle
   reste accrochée à la figurine et entièrement à l'écran.
4. **Given** une bulle ouverte, **When** le visiteur utilise son bouton de fermeture, clique
   ailleurs, appuie sur Échap ou clique à nouveau sur la figurine, **Then** la bulle se ferme.
5. **Given** une bulle ouverte, **When** le visiteur sélectionne un autre objet, **Then** la bulle
   se ferme et le panneau de cet objet s'ouvre ; à l'inverse, ouvrir la bulle ferme un panneau
   ouvert.
6. **Given** une bulle ouverte, **When** le visiteur change de langue, **Then** la bulle reste
   ouverte, dans la nouvelle langue.
7. **Given** une bulle ouverte, **When** le visiteur change de thème, **Then** la bulle reste
   ouverte et lisible dans le nouveau thème.

---

### User Story 3 - Le même accès pour tout le monde (Priority: P2)

Un visiteur au clavier ou au lecteur d'écran atteint la figurine comme les autres objets de la
scène et lit le même mot de bienvenue. Un visiteur qui a demandé moins de mouvements lit la bulle
sans voir de salut. Sans 3D, personne ne perd d'information : la bulle ne fait qu'accueillir dans
la pièce et ne contient aucun contenu du portfolio.

**Why this priority**: l'accessibilité et les replis sont des engagements du projet ; ils ne
doivent pas régresser, mais la figurine a de la valeur avant qu'ils soient terminés.

**Independent Test**: parcourir la scène au clavier et avec un lecteur d'écran, puis avec la
réduction des mouvements activée, puis sans WebGL et sans JavaScript.

**Acceptance Scenarios**:

1. **Given** la scène au clavier, **When** le visiteur parcourt les objets, **Then** la figurine
   fait partie du parcours et Entrée ouvre sa bulle ; le bouton de fermeture s'atteint au clavier
   et la fermeture, par ce bouton ou par Échap, rend le focus à l'élément qui a ouvert la bulle.
2. **Given** un lecteur d'écran, **When** la bulle s'ouvre, **Then** son texte est annoncé dans la
   langue de la page.
3. **Given** la liste textuelle des éléments de la scène, **When** le visiteur la consulte,
   **Then** elle propose une entrée pour Sébastien qui ouvre la bulle ; sans JavaScript, cette
   entrée n'apparaît pas.
4. **Given** la réduction des mouvements activée et la scène ouverte malgré tout, **When** le
   visiteur survole ou sélectionne la figurine, **Then** aucun salut ne se joue ; la sélection
   ouvre la bulle directement.
5. **Given** un appareil sans WebGL, ou la version écrite choisie, **When** le visiteur parcourt
   le site, **Then** la figurine n'apparaît pas et aucune information ne manque.

---

### User Story 4 - Une figurine qui ne coûte rien à la scène (Priority: P2)

Un visiteur sur un téléphone de milieu de gamme ne voit aucune différence de fluidité ou de temps
de chargement. La scène reste immobile et silencieuse pour l'appareil tant que rien ne bouge.

**Why this priority**: la fluidité sur appareils modestes est un principe du projet ; une figurine
décorative ne doit pas la dégrader.

**Independent Test**: lancer les contrôles de budget, de fréquence d'images et Lighthouse existants,
et mesurer que rien n'est calculé au repos ni après la fin d'un salut.

**Acceptance Scenarios**:

1. **Given** la scène au repos, **When** le visiteur n'interagit pas, **Then** aucune image n'est
   calculée, figurine comprise.
2. **Given** un salut qui se termine, **When** la figurine revient à sa pose, **Then** le calcul des
   images s'arrête.
3. **Given** un visiteur qui passe plusieurs fois sur la figurine, **When** un salut est en cours,
   **Then** il n'est ni relancé ni empilé ; il se termine, puis un nouveau survol peut le rejouer.
4. **Given** le fichier de la figurine en échec de chargement, **When** la scène s'affiche, **Then**
   elle reste utilisable sans figurine, et la liste textuelle ne propose pas d'entrée pour la bulle.

---

### Edge Cases

- **Figurine hors de l'écran** : si le visiteur déplace la vue ou zoome, la figurine peut sortir de
  l'écran ; une bulle ouverte se ferme alors plutôt que de flotter sans ancrage.
- **Petit écran (320 px)** : la bulle tient sans débordement et ne cache pas les contrôles de la
  scène ; son texte passe à la ligne.
- **Texte plus long dans une langue** : la bulle s'adapte à la longueur réelle des deux langues.
- **Toucher** : il n'y a pas de survol ; le toucher joue le salut et ouvre la bulle en un seul geste.
- **Qualité basse** : la qualité adaptative peut simplifier l'ombre de la figurine, mais la figurine
  reste visible et sélectionnable.
- **Salut en cours et changement de thème ou de langue** : le geste continue ou s'arrête proprement,
  sans laisser la figurine dans une pose intermédiaire.
- **Hauteur de la chaise** : la figurine et la chaise tournée ne doivent pas traverser le bureau, le
  tapis, l'écran ni les autres objets.

## Requirements *(mandatory)*

### Functional Requirements

**Présence dans la pièce**

- **FR-001**: La scène MUST montrer une figurine low-poly de Sébastien, assise dans la chaise du
  bureau, près de l'écran principal.
- **FR-002**: La chaise MUST être tournée vers la pièce, de sorte que le visage de la figurine soit
  visible depuis la vue de départ (aujourd'hui, la chaise tourne le dos à la caméra).
- **FR-003**: La figurine MUST rester à sa place. Le visiteur contrôle seulement la caméra et
  sélectionne les objets (FR-004 de la spec 002 inchangé).
- **FR-004**: La figurine MUST ne masquer aucun objet interactif depuis la vue de départ et MUST ne
  pas capter le clic destiné à un objet visible.

**Apparence**

- **FR-005**: La figurine MUST être stylisée (grosse tête, formes simples, facettes visibles), dans
  le style low-poly des objets de la pièce (spec 003).
- **FR-006**: La figurine MUST reprendre les traits reconnaissables de la photo de profil : lunettes,
  barbe, coupe et couleur des cheveux, t-shirt rouge brique. Sébastien MUST valider la ressemblance
  sur des rendus avant l'intégration.
- **FR-007**: La figurine MUST s'accorder à la lumière de la pièce de jour et de nuit, et MUST avoir
  une ombre cohérente au sol ou sur la chaise.

**Réaction**

- **FR-008**: Au survol avec une souris, la figurine MUST jouer un court salut une fois, puis revenir
  à sa pose exacte. Le salut MUST durer au plus 2 secondes et MUST ne pas se relancer tant qu'il
  n'est pas terminé.
- **FR-009**: À la sélection (clic, toucher, clavier), la figurine MUST jouer le salut et ouvrir une
  bulle au-dessus de sa tête.
- **FR-010**: La scène MUST ne calculer aucune image au repos et MUST cesser d'en calculer dès la fin
  du salut.
- **FR-011**: Si le visiteur a demandé moins de mouvements, aucun salut MUST ne se jouer ; la bulle
  s'ouvre directement à la sélection.

**Bulle**

- **FR-012**: La bulle MUST contenir seulement un mot de bienvenue qui invite à explorer la pièce :
  « Bonjour, c’est Sébastien, bienvenue sur mon portfolio 3D. Navigue dans la pièce pour la
  découvrir. » / « Hi, it’s Sébastien, welcome to my 3D portfolio. Move around the room to
  discover it. »
- **FR-013**: La bulle MUST ne contenir aucun lien ; sa seule action est un bouton de fermeture avec
  un nom accessible.
- **FR-014**: La bulle MUST être présentée dans la langue de la page. Son texte est un élément
  d'interface de la scène, pas un contenu du portfolio (constitution, principe I).
- **FR-015**: La bulle MUST rester accrochée à la figurine pendant les déplacements et zooms, rester
  entière à l'écran, et se fermer si la figurine sort de la vue.
- **FR-016**: La bulle MUST se fermer par son bouton, clic ailleurs, Échap ou nouvelle sélection de
  la figurine. Une seule entre la bulle et un panneau MUST être ouverte à la fois.
- **FR-017**: La bulle MUST rester ouverte après un changement de thème ou de langue, comme un panneau
  (constitution, principe VI : le sélecteur conserve l'objet consulté).
- **FR-018**: Le style de la bulle MUST reprendre celui de l'interface de la scène, avec des contrastes
  AA dans les deux thèmes.

**Accessibilité et replis**

- **FR-019**: La figurine MUST faire partie du parcours au clavier des objets de la scène, avec un nom
  accessible dans la langue de la page. Le contenu de la bulle MUST être annoncé par les lecteurs
  d'écran et le focus MUST revenir à l'élément qui a ouvert la bulle à la fermeture.
- **FR-020**: Quand la figurine est affichée, la liste textuelle des éléments de la scène MUST proposer
  une entrée pour Sébastien, qui ouvre la bulle ; sans JavaScript, cette entrée MUST ne pas apparaître.
- **FR-021**: Sans WebGL, sans JavaScript ou dans la version écrite, la figurine et la bulle MUST ne pas
  apparaître, sans perte d'information : la bulle ne porte aucun contenu du portfolio.
- **FR-022**: Si la figurine ne se charge pas, la scène MUST rester utilisable sans elle, sans bulle ni
  entrée correspondante dans la liste textuelle.

**Budgets et vie privée**

- **FR-023**: La figurine SHOULD rester légère, sans limite de poids propre pour cette première
  version : son poids est mesuré, puis affiné s'il est trop lourd. Elle MUST ne faire aucune requête
  vers un domaine tiers. La photo de profil sert de référence à la modélisation et MUST ne pas être
  embarquée dans la scène pour cet usage.
- **FR-024**: Le site écrit MUST rester inchangé : mêmes pages, mêmes textes, mêmes scores Lighthouse.

### Key Entities

- **Figurine** : présence de Sébastien dans la pièce ; un emplacement fixe, une pose assise, un salut,
  une ambiance de jour et de nuit.
- **Bulle** : mot de bienvenue accroché à la figurine ; un texte par langue et un bouton de fermeture.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sébastien confirme la ressemblance sur des rendus (face, trois-quarts, vue de la scène)
  avant l'intégration ; la validation est consignée dans le dossier de la fonctionnalité.
- **SC-002**: Le visage de la figurine est visible depuis la vue de départ, en portrait et en paysage,
  de jour et de nuit.
- **SC-003**: Le poids ajouté par la figurine est mesuré et consigné ; s'il fait dépasser le budget de
  3 Mo avant la première interaction, il est signalé à Sébastien pour décider d'un affinage.
- **SC-004**: La scène reste interactive en moins de 5 s sur mobile et tient 60 / 30 images par seconde
  (ordinateur / téléphone de milieu de gamme), y compris pendant un salut.
- **SC-005**: Aucune image n'est calculée au repos, ni dans la seconde qui suit la fin d'un salut.
- **SC-006**: 100 % des objets interactifs existants restent sélectionnables depuis la vue de départ.
- **SC-007**: La bulle s'ouvre en moins de 100 ms après la sélection et tient sans débordement à
  320 px de large, dans les deux langues.
- **SC-008**: Lighthouse reste à ≥ 90 dans chaque catégorie (cible 100) sur chaque page contrôlée, et
  tous les contrôles existants passent : tests, SEO, budgets, parcours, vie privée.
- **SC-009**: Un visiteur au clavier ou au lecteur d'écran obtient le même texte que les autres et peut
  fermer la bulle, dans les deux langues.

## Assumptions

- **Effet sur les deux expériences** : la figurine n'existe que dans la scène. Le site écrit ne change
  pas. La figurine et son mot de bienvenue sont des éléments propres à la scène, sans contenu du
  portfolio : ils n'ont pas de page correspondante (constitution, principe I).
- **Deux langues** : le mot de bienvenue et le nom du bouton de fermeture existent en français et en
  anglais, avec les autres textes d'interface de la scène.
- **Chaise tournée** : un personnage assis face à l'écran montre le dos à la caméra, donc son visage ne
  se verrait pas. La chaise pivote vers la pièce, ce qui suppose de reprendre la pièce et son éclairage
  précalculé jour et nuit, comme à la spec 003.
- **Modélisation** : la figurine est construite dans Blender avec les autres modèles de la pièce, à
  partir de la photo de profil (`content/profile-photo.webp`) ; contexte existant du projet (specs 002
  et 003), pas une exigence pour le visiteur.
- **Poids** : décision de Sébastien (01/11) : viser léger sans limite chiffrée, mesurer, affiner ensuite
  si besoin. Un dépassement du budget de 3 Mo serait à justifier dans le plan (constitution).
- **Hors périmètre** : déplacer ou diriger la figurine, tenue ou expressions variables selon l'objet
  consulté, autres animations que le salut, voix ou son, dialogue ou réponses, personnalisation par le
  visiteur.
- **Dépendances** : specs 002 (scène, repli, liste textuelle, parcours clavier) et 003 (style « tour »,
  ambiances jour et nuit). La mise en ligne du site reste à faire séparément.
