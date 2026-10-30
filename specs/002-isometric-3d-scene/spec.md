# Feature Specification: Scène 3D isométrique du portfolio

**Feature Branch**: `feat/002-3d-scene-spec`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Scène 3D isométrique du portfolio. Une page 3D, vue de haut en isométrique, où le visiteur découvre les projets, diplômes et expériences de Sébastien en interagissant avec le décor (par exemple une pièce : diplômes accrochés au mur, objets représentant les projets). Un clic ou un toucher sur un objet affiche d'abord ses informations dans la scène elle-même (petite pop-up ou élément 3D) : pour un diplôme, ses informations ; pour un projet, une présentation. Un bouton « En savoir plus » mène à la page détaillée du site écrit ; toutes les actions ne doivent pas rediriger vers le site classique. La scène lit la même source de contenu que la version écrite. Bilingue FR/EN. Doit rester fluide (60 i/s sur ordinateur, 30 i/s sur téléphone de milieu de gamme), utilisable au toucher, chargée progressivement après le contenu principal, avec repli vers la version écrite si WebGL manque, si la fluidité est insuffisante ou si l'utilisateur réduit les animations. Accessible depuis l'accueil du site écrit. Aucune requête tierce, hébergement statique."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorer la scène et découvrir un élément sur place (Priority: P1)

Depuis l'accueil du site écrit, un visiteur ouvre l'expérience 3D. Une scène isométrique vue de
haut s'affiche ; il repère des objets qui représentent les projets, les diplômes et les
expériences de Sébastien, en sélectionne un, et lit ses informations **dans la scène**, sans
quitter la page.

**Why this priority**: c'est la raison d'être de la scène : découvrir le portfolio en jouant
avec le décor. Sans elle, la fonctionnalité n'existe pas.

**Independent Test**: ouvrir la scène sur ordinateur, sélectionner un objet de chaque type
(projet, diplôme, expérience) et vérifier que ses informations s'affichent sur place, dans la
bonne langue, puis se referment.

**Acceptance Scenarios**:

1. **Given** l'accueil du site écrit, **When** le visiteur choisit « Explorer le portfolio en
   3D », **Then** la scène s'ouvre, avec un indicateur de chargement tant qu'elle n'est pas
   prête.
2. **Given** la scène chargée, **When** le visiteur survole (souris) ou parcourt au clavier un
   objet interactif, **Then** l'objet est mis en évidence et son nom apparaît.
3. **Given** un diplôme dans la scène, **When** le visiteur le sélectionne, **Then** un panneau
   dans la scène affiche son intitulé, l'établissement, le lieu, la période ou la date
   d'obtention, le niveau et les compétences.
4. **Given** un projet dans la scène, **When** le visiteur le sélectionne, **Then** un panneau
   affiche sa présentation : titre, résumé, rôle, période, technologies, visuel et liens.
5. **Given** une expérience dans la scène, **When** le visiteur la sélectionne, **Then** un
   panneau affiche le poste, l'organisme, le type, la période et le lieu.
6. **Given** un panneau ouvert, **When** le visiteur le ferme (bouton, touche Échap, clic hors
   du panneau), **Then** il revient à l'exploration au même endroit.

---

### User Story 2 - Aller plus loin vers le site écrit (Priority: P1)

Depuis un panneau ouvert dans la scène, le visiteur qui veut tout le détail choisit
« En savoir plus » et arrive sur la page correspondante du site écrit. Il peut revenir à la
scène là où il l'avait laissée.

**Why this priority**: c'est le lien entre les deux expériences exigé par la constitution
(principe I) ; il ne doit être qu'une option, jamais l'action par défaut.

**Independent Test**: depuis le panneau d'un projet, choisir « En savoir plus », vérifier
qu'on arrive sur la page du projet dans la même langue, puis revenir en arrière et retrouver la
scène.

**Acceptance Scenarios**:

1. **Given** un panneau ouvert, **When** le visiteur choisit « En savoir plus », **Then** il
   arrive sur la page détaillée de cet élément dans le site écrit, dans la même langue.
2. **Given** un objet sélectionné, **When** le panneau s'ouvre, **Then** aucune navigation
   vers le site écrit n'a lieu tant que le visiteur ne l'a pas demandé.
3. **Given** le visiteur revenu en arrière depuis le site écrit, **When** la scène se
   réaffiche, **Then** elle reprend sur la même vue (et, si possible, le même élément ouvert).
4. **Given** la scène, **When** le visiteur veut quitter l'expérience 3D, **Then** un lien
   toujours visible ramène à l'accueil du site écrit.

---

### User Story 3 - Utiliser la scène sur téléphone (Priority: P2)

Sur un téléphone de milieu de gamme, le visiteur explore la scène au doigt (déplacer la vue,
zoomer, toucher un objet), lit les panneaux adaptés à l'écran, en portrait comme en paysage.

**Why this priority**: une grande part des visites vient du téléphone (constitution,
principe III), mais la scène a déjà de la valeur sur ordinateur.

**Independent Test**: sur un téléphone réel ou émulé, déplacer la vue, zoomer, ouvrir et
fermer un panneau, tourner l'écran ; la fluidité reste au-dessus du seuil.

**Acceptance Scenarios**:

1. **Given** la scène sur téléphone, **When** le visiteur glisse un doigt, pince ou touche un
   objet, **Then** la vue se déplace, zoome ou ouvre le panneau de l'objet.
2. **Given** un panneau ouvert sur un petit écran, **When** il s'affiche, **Then** il reste
   lisible sans zoom du navigateur et se ferme d'un geste simple.
3. **Given** le téléphone tourné, **When** l'orientation change, **Then** la scène s'adapte
   sans recharger.

---

### User Story 4 - Repli vers le site écrit (Priority: P2)

Quand la 3D n'est pas adaptée (WebGL absent, appareil trop lent, animations réduites, économie
de données), le visiteur est orienté vers la version écrite, ou se voit proposer clairement de
continuer quand même.

**Why this priority**: personne ne doit rester bloqué devant une scène vide ou saccadée
(constitution, principe III).

**Independent Test**: ouvrir la scène avec WebGL désactivé, puis avec les animations réduites,
puis avec une fréquence d'images simulée trop basse ; vérifier chaque fois le message et le
lien vers la version écrite.

**Acceptance Scenarios**:

1. **Given** un navigateur sans WebGL, **When** le visiteur ouvre la scène, **Then** un message
   explique que la 3D n'est pas disponible et propose la version écrite (sans page blanche).
2. **Given** l'option « réduire les animations » ou « économie de données » activée, **When**
   le visiteur ouvre la scène, **Then** il voit d'abord une proposition : continuer en 3D (avec
   mouvements réduits) ou passer à la version écrite.
3. **Given** une fréquence d'images durablement trop basse, **When** la scène le détecte,
   **Then** elle réduit d'abord sa qualité graphique, puis, si cela ne suffit pas, propose la
   version écrite.
4. **Given** JavaScript désactivé, **When** le visiteur ouvre l'adresse de la scène, **Then** il
   voit un message et un lien vers la version écrite.

---

### User Story 5 - Accessibilité et langues (Priority: P2)

Un visiteur qui n'utilise pas la souris parcourt les objets au clavier ; un lecteur d'écran
annonce les objets et le contenu des panneaux ; chacun peut changer de langue sans perdre sa
place.

**Why this priority**: la scène ne doit pas exclure ceux qui ne voient pas ou ne pointent pas ;
le bilinguisme est exigé partout (principe VI).

**Independent Test**: parcourir tous les objets avec Tab, ouvrir un panneau avec Entrée, le
fermer avec Échap ; vérifier les annonces d'un lecteur d'écran ; changer de langue depuis la
scène.

**Acceptance Scenarios**:

1. **Given** la scène, **When** le visiteur appuie sur Tab, **Then** le focus passe d'un objet
   interactif à l'autre dans un ordre logique, avec un repère visible.
2. **Given** un objet ciblé au clavier, **When** le visiteur appuie sur Entrée, **Then** son
   panneau s'ouvre et reçoit le focus ; Échap le ferme et rend le focus à l'objet.
3. **Given** un lecteur d'écran, **When** il parcourt la scène, **Then** il annonce le nom et le
   type de chaque objet et lit le contenu du panneau ouvert.
4. **Given** la scène en français, **When** le visiteur choisit l'anglais, **Then** la scène
   passe en anglais (libellés et panneaux) sans perdre la vue courante.

---

### User Story 6 - Contenu à jour automatiquement (Priority: P3)

Quand Sébastien ajoute ou modifie un projet, un diplôme ou une expérience dans la source de
contenu, la scène le reflète à la publication suivante, sans retoucher la scène elle-même.

**Why this priority**: garantit la source unique (principe I) ; la scène peut être publiée
avec le contenu actuel avant que ce mécanisme soit complet.

**Independent Test**: ajouter un projet dans la source de contenu, republier, vérifier qu'il
apparaît dans la scène avec un panneau correct ; passer un élément en brouillon, vérifier qu'il
disparaît.

**Acceptance Scenarios**:

1. **Given** un nouveau projet publié, **When** le site est reconstruit, **Then** il apparaît
   dans la scène sous forme d'**objet générique** (par exemple un cadre, un écran ou un carton
   portant son visuel), placé automatiquement dans un emplacement libre prévu pour les projets.
3. **Given** un projet **mis en avant** qui a un objet dédié modélisé, **When** la scène se
   charge, **Then** cet objet dédié le représente à sa place réservée ; un projet mis en avant
   sans objet dédié prend un objet générique.
2. **Given** un élément passé en brouillon, **When** le site est reconstruit, **Then** il
   n'apparaît plus dans la scène.

---

### Edge Cases

- Beaucoup de projets (30 et plus) : la scène reste lisible et fluide (regroupement, pagination
  dans le décor, ou défilement), sans objets superposés.
- Aucun diplôme ou aucune expérience publiés : la zone correspondante reste cohérente (pas de
  mur vide incompréhensible).
- Texte long dans un panneau (titre, résumé) : le panneau défile ou se coupe proprement, sans
  déborder de l'écran.
- Image d'un projet absente : visuel par défaut dans le panneau.
- Chargement interrompu (connexion coupée) : message d'erreur avec « réessayer » et lien vers
  la version écrite.
- Onglet mis en arrière-plan : la scène suspend son rendu pour ne pas consommer de batterie.
- Écran très large ou très petit (320 px) : la vue s'adapte, le cadrage reste centré sur le
  décor.
- Double clic, clics rapides ou toucher pendant un déplacement : pas d'ouverture involontaire
  de panneau.

## Requirements *(mandatory)*

### Functional Requirements

**Accès et chargement**

- **FR-001**: Le site MUST proposer l'accès à la scène depuis l'accueil du site écrit
  (emplacement déjà prévu) dans les deux langues, et la scène MUST avoir une adresse propre par
  langue.
- **FR-002**: La page de la scène MUST afficher son titre, un indicateur de progression et un
  lien vers la version écrite avant que la 3D soit prête ; la 3D se charge ensuite
  progressivement (décor de base d'abord, détails ensuite).
- **FR-003**: La scène MUST rester utilisable si une ressource secondaire (détail, texture)
  manque ou échoue : seul l'élément concerné est simplifié.

**Exploration**

- **FR-004**: La scène MUST être présentée en vue isométrique de haut ; le visiteur MUST pouvoir
  déplacer la vue (glisser) et zoomer dans des limites qui gardent le décor à l'écran. Le
  visiteur contrôle seulement la caméra et sélectionne les objets ; il n'y a pas de personnage
  à diriger.
- **FR-005**: Le décor MUST être **une seule pièce** (bureau / atelier) vue de haut, où les
  projets, les diplômes et les expériences sont des objets interactifs distincts et
  reconnaissables par type (par exemple diplômes encadrés au mur, projets sur des étagères ou
  des écrans, expériences sur un tableau).
- **FR-006**: Chaque projet MUST être représenté par un objet générique placé
  automatiquement ; un projet mis en avant PEUT avoir un objet dédié modélisé, associé à son
  identifiant, à une place réservée. Un nouveau projet MUST apparaître sans modifier la scène.
- **FR-007**: Diplômes et expériences MUST être placés automatiquement dans leurs zones
  (mur, tableau), dans l'ordre chronologique inverse.
- **FR-008**: Chaque objet interactif MUST être mis en évidence au survol, au toucher et au
  focus clavier, avec son nom affiché.
- **FR-009**: Un bouton MUST permettre de recentrer la vue sur le cadrage initial.

**Panneaux d'information**

- **FR-010**: Sélectionner un objet MUST ouvrir un panneau dans la scène avec les informations
  de l'élément, sans quitter la page ni changer d'adresse de page (l'état peut être reflété
  dans l'adresse pour le partage et le retour).
- **FR-011**: Le panneau d'un **projet** MUST montrer : titre, résumé, rôle, période,
  catégories, technologies, visuel principal et liens (vidéo chargée seulement après un clic).
- **FR-012**: Le panneau d'un **diplôme** MUST montrer : intitulé, établissement, lieu, période
  ou date d'obtention, niveau et compétences.
- **FR-013**: Le panneau d'une **expérience** MUST montrer : poste, organisme, type, lieu,
  période (avec « en cours » le cas échéant) et technologies.
- **FR-014**: Chaque panneau MUST proposer « En savoir plus » vers la page de l'élément dans le
  site écrit (même langue) ; aucune sélection ne MUST mener directement au site écrit.
- **FR-015**: Un panneau MUST se fermer par un bouton, la touche Échap, ou un clic / toucher
  hors du panneau ; un seul panneau est ouvert à la fois.
- **FR-016**: Une adresse de la scène qui désigne un élément (par exemple partagée) MUST ouvrir
  la scène avec ce panneau ouvert.

**Contenu**

- **FR-017**: La scène MUST lire ses données dans la même source de contenu publiée que le site
  écrit ; aucun texte de contenu n'est saisi dans la scène elle-même.
- **FR-018**: L'export de contenu MUST fournir tout ce que les panneaux affichent (notamment
  compétences des diplômes, technologies des expériences, visuels) ; les champs manquants
  aujourd'hui sont ajoutés sans casser les programmes existants.
- **FR-019**: Les éléments en brouillon MUST être absents de la scène.

**Langues, accessibilité**

- **FR-020**: Tous les libellés de la scène et tous les panneaux MUST exister en français et en
  anglais ; un sélecteur de langue MUST faire passer à la scène dans l'autre langue en gardant
  la vue et l'élément ouvert.
- **FR-021**: Tous les objets interactifs MUST être atteignables et activables au clavier, dans
  un ordre logique, avec un focus visible ; les panneaux MUST être lisibles par un lecteur
  d'écran.
- **FR-022**: La scène MUST proposer une liste textuelle des objets (projets, diplômes,
  expériences) comme autre moyen de les ouvrir.

**Performance, repli, vie privée**

- **FR-023**: La scène MUST viser 60 i/s sur un ordinateur courant et au moins 30 i/s stables
  sur un téléphone Android de milieu de gamme de moins de 4 ans.
- **FR-024**: La qualité graphique MUST s'ajuster automatiquement à l'appareil (résolution,
  ombres, effets) et baisser si la fréquence d'images reste sous le seuil.
- **FR-025**: Le site MUST basculer vers la version écrite, ou le proposer clairement, quand
  WebGL manque, quand la fréquence reste trop basse après ajustement, ou quand
  « réduire les animations » / « économie de données » est activé.
- **FR-026**: Avec « réduire les animations », les déplacements de caméra et animations de la
  scène MUST être instantanés ou supprimés.
- **FR-027**: La scène MUST suspendre son rendu quand l'onglet n'est pas visible.
- **FR-028**: La scène MUST n'effectuer aucune requête vers un domaine tiers et ne déposer
  aucun cookie ; toutes ses ressources sont servies en fichiers statiques par le site.
- **FR-029**: La page de la scène MUST être indexable correctement (titre, description,
  données de partage, liens vers les deux langues) et renvoyer vers la version écrite pour le
  contenu.

### Key Entities

- **Scène** : le décor isométrique, son cadrage initial, ses limites de déplacement et de zoom,
  ses niveaux de qualité.
- **Objet interactif** : la représentation d'un élément de contenu dans le décor ; type
  (projet, diplôme, expérience), élément associé (identifiant de la source de contenu),
  position, nom affiché, état (normal, mis en évidence, sélectionné).
- **Panneau** : la fiche affichée dans la scène pour un objet sélectionné ; contenu selon le
  type, bouton « En savoir plus », adresse de la page écrite.
- **Élément de contenu** : projet, diplôme ou expérience, tels que définis dans la spec 001
  (source unique, deux langues).
- **Préférences du visiteur** : langue, animations réduites, économie de données, niveau de
  qualité retenu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur un téléphone de milieu de gamme en 4G, la page de la scène affiche son titre
  et le lien vers la version écrite en moins de 2,5 s, et la scène devient interactive en moins
  de 5 s.
- **SC-002**: Les ressources nécessaires à la première interaction pèsent 3 Mo compressés au
  plus.
- **SC-003**: La scène tient au moins 30 i/s sur un téléphone de milieu de gamme et 60 i/s sur
  un ordinateur courant, pendant 1 minute d'exploration.
- **SC-004**: Un visiteur ouvre le panneau d'un élément de chaque type en moins de 30 secondes
  après la fin du chargement, sans explication.
- **SC-005**: 100 % des éléments publiés (projets, diplômes, expériences) sont présents dans la
  scène, et 100 % des panneaux mènent à la bonne page écrite par « En savoir plus ».
- **SC-006**: 100 % des objets interactifs sont atteignables au clavier et annoncés par un
  lecteur d'écran.
- **SC-007**: Aucun visiteur ne reste devant une page blanche : dans 100 % des cas de repli
  testés (WebGL absent, animations réduites, fréquence basse, JavaScript désactivé), un message
  et un lien vers la version écrite s'affichent.
- **SC-008**: Aucune requête vers un domaine tiers et aucun cookie pendant une session
  d'exploration.

## Assumptions

- Le décor est un univers original propre au portfolio, cohérent avec l'identité visuelle du
  site écrit (couleurs, typographie).
- Les modèles 3D sont produits ou fournis par Sébastien (qui maîtrise Blender) ou générés pour
  le projet, sous licence compatible ; ils sont servis par le site, jamais par un service
  tiers.
- Pas de son ni de musique dans cette version ; ce pourra être un ajout optionnel, désactivé
  par défaut.
- Pas de mode multijoueur, de compte ni de sauvegarde côté serveur ; l'état (vue, élément
  ouvert, qualité) peut être gardé localement dans le navigateur.
- La scène fait partie du même site et de la même construction statique que la version écrite ;
  l'hébergement reste à choisir.
- Le contenu provisoire actuel sert à développer ; le vrai contenu arrivera en parallèle.
