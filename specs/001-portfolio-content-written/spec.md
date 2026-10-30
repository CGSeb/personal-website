# Feature Specification: Portfolio écrit bilingue et source de contenu commune

**Feature Branch**: `001-portfolio-content-written`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Portfolio écrit bilingue (FR/EN) et source de contenu commune. Une source de contenu structurée unique décrit les projets, diplômes et expériences de Sébastien ; elle sera lue plus tard par la scène 3D isométrique. La version écrite est un portfolio classique : page d'accueil/présentation, liste et pages détaillées des projets, parcours (diplômes et expériences), contact. Chaque élément a sa propre URL dans chaque langue, est indexable par les moteurs de recherche et lisible par les IA (données structurées, sitemap, llms.txt), fonctionne sans JavaScript, est fluide sur mobile, servi en statique, sans traceurs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Découvrir les projets (Priority: P1)

Une personne (recruteur, client potentiel, curieux) arrive sur le portfolio, comprend en
quelques secondes qui est Sébastien et quelle est son activité, parcourt la liste des projets et ouvre
la page détaillée de ceux qui l'intéressent.

**Why this priority**: les projets sont la raison d'être du portfolio. Une page d'accueil, une
liste de projets et leurs pages détaillées forment à elles seules un portfolio publiable.

**Independent Test**: publier le site avec seulement l'accueil et les projets, puis vérifier
qu'un visiteur trouve un projet précis et en lit le détail, sur ordinateur et sur téléphone.

**Acceptance Scenarios**:

1. **Given** un visiteur sur la page d'accueil, **When** il la lit, **Then** il voit le nom,
   l'activité, une courte présentation et un accès direct aux projets.
2. **Given** un visiteur sur la liste des projets, **When** il choisit un projet, **Then** il
   arrive sur sa page détaillée : titre, résumé, contexte, rôle tenu, technologies ou outils,
   période, visuels et liens éventuels (démo, code, vidéo).
3. **Given** un visiteur sur une page de projet, **When** il veut voir d'autres projets,
   **Then** il peut revenir à la liste ou passer au projet suivant ou précédent.
4. **Given** un visiteur dont le navigateur a JavaScript désactivé, **When** il parcourt ces
   pages, **Then** tout le contenu et toute la navigation restent disponibles.

---

### User Story 2 - Consulter le parcours (Priority: P2)

Un visiteur veut connaître la formation et les expériences professionnelles de Sébastien pour
évaluer son profil.

**Why this priority**: c'est la deuxième information la plus demandée par un recruteur, mais
le portfolio a déjà de la valeur sans elle.

**Independent Test**: ouvrir la page Parcours et vérifier que chaque diplôme et chaque
expérience apparaît, dans l'ordre chronologique inverse, avec ses informations clés et sa page
propre.

**Acceptance Scenarios**:

1. **Given** un visiteur sur la page Parcours, **When** il la lit, **Then** il voit les
   expériences et les diplômes, du plus récent au plus ancien, chacun avec son intitulé, son
   organisme, son lieu et sa période.
2. **Given** une expérience liée à des projets, **When** le visiteur ouvre sa page, **Then** il
   voit les projets associés et peut y accéder.
3. **Given** une expérience en cours, **When** elle est affichée, **Then** sa période indique
   « depuis » / « present » au lieu d'une date de fin.

---

### User Story 3 - Lire le site dans sa langue (Priority: P2)

Un visiteur anglophone ou francophone lit tout le site dans sa langue et peut changer de langue
à tout moment sans perdre la page en cours.

**Why this priority**: exigé par la constitution (principe VI) ; il touche toutes les pages,
donc il doit être prévu dès le départ.

**Independent Test**: depuis n'importe quelle page, changer de langue et vérifier qu'on arrive
sur la même page dans l'autre langue, entièrement traduite.

**Acceptance Scenarios**:

1. **Given** un visiteur sur une page en français, **When** il choisit l'anglais, **Then** il
   arrive sur la même page en anglais, à son adresse anglaise.
2. **Given** un visiteur qui arrive à la racine du site, **When** la page s'affiche, **Then**
   elle est dans la langue préférée de son navigateur si c'est le français ou l'anglais, en
   anglais sinon, et le choix de langue reste visible.
3. **Given** n'importe quelle page, **When** un moteur de recherche l'analyse, **Then** il trouve
   la langue de la page et le lien vers sa version dans l'autre langue.

---

### User Story 4 - Être trouvé par les moteurs de recherche et les IA (Priority: P2)

Quelqu'un cherche Sébastien, ou un type de projet, dans un moteur de recherche ou demande à un
assistant IA ; le portfolio et ses pages de projet apparaissent avec un résumé exact.

**Why this priority**: c'est la raison d'être de la version écrite (constitution, principe II).

**Independent Test**: passer chaque page dans un validateur de données structurées et un outil
d'audit SEO ; vérifier que le plan du site liste toutes les pages et que le résumé destiné aux
IA décrit fidèlement le contenu.

**Acceptance Scenarios**:

1. **Given** une page de projet, de diplôme ou d'expérience, **When** un robot la lit, **Then**
   il trouve un titre et une description uniques, et des données structurées valides qui
   décrivent l'élément et son auteur.
2. **Given** le site publié, **When** un robot consulte le plan du site, **Then** chaque page
   publique y figure, dans les deux langues.
3. **Given** un agent IA, **When** il lit le résumé du site qui lui est destiné, **Then** il y
   trouve qui est Sébastien, la liste des projets, du parcours et les liens vers chaque page.
4. **Given** un lien vers une page partagé sur un réseau social ou une messagerie, **When**
   l'aperçu s'affiche, **Then** il montre le bon titre, la bonne description et une image.

---

### User Story 5 - Prendre contact (Priority: P3)

Un visiteur intéressé veut contacter Sébastien ou consulter ses autres profils.

**Why this priority**: important pour convertir une visite en opportunité, mais simple et
indépendant du reste.

**Independent Test**: depuis la page Contact, joindre Sébastien par le moyen proposé et
vérifier que le message arrive.

**Acceptance Scenarios**:

1. **Given** un visiteur sur la page Contact, **When** il veut écrire, **Then** il trouve un
   lien e-mail qui ouvre sa messagerie, et des liens vers les profils externes de Sébastien
   (LinkedIn, GitHub…). Aucun formulaire : aucune donnée n'est saisie ni stockée sur le site.
2. **Given** un robot qui collecte des adresses, **When** il lit la page en HTML brut,
   **Then** l'adresse e-mail n'y apparaît pas en clair (protection simple, sans service
   tiers), tout en restant utilisable par un visiteur.
3. **Given** n'importe quelle page, **When** le visiteur cherche à prendre contact, **Then** un
   accès à la page Contact est visible dans la navigation ou le pied de page.

---

### User Story 6 - Ajouter ou modifier un contenu (Priority: P2)

Sébastien ajoute un nouveau projet, un diplôme ou une expérience, ou corrige un texte, à un seul
endroit, dans les deux langues ; le site publié reflète le changement, et la future scène 3D
pourra lire la même information.

**Why this priority**: sans elle, le contenu se périme vite ; c'est aussi ce qui garantit la
source unique exigée par la constitution (principe I).

**Independent Test**: ajouter un projet dans la source de contenu, republier, et vérifier qu'il
apparaît dans la liste, a sa page dans les deux langues, figure dans le plan du site et dans le
résumé pour les IA.

**Acceptance Scenarios**:

1. **Given** un nouveau projet décrit dans la source de contenu, **When** le site est republié,
   **Then** le projet apparaît partout où il doit (liste, page détaillée, expériences liées,
   plan du site, résumé IA) sans autre saisie.
2. **Given** un élément dont une traduction manque ou un champ obligatoire est vide, **When**
   le site est construit, **Then** la publication est bloquée avec un message qui nomme
   l'élément et le champ en cause.
3. **Given** un élément marqué comme brouillon, **When** le site est publié, **Then** il
   n'apparaît nulle part sur le site public.
4. **Given** la source de contenu, **When** un autre programme (la future scène 3D) la lit,
   **Then** il obtient les mêmes éléments et identifiants que la version écrite.

Le mode d'édition : le contenu est rédigé dans des fichiers texte versionnés dans le dépôt du
site ; une publication se fait en enregistrant ces fichiers dans le dépôt. Pas d'interface
d'administration dans cette version.

---

### Edge Cases

- Un projet n'a ni visuel ni lien externe : sa page s'affiche correctement avec un visuel par
  défaut.
- Un lien externe d'un projet ne répond plus : le reste de la page fonctionne ; le lien est
  signalé à la vérification avant publication.
- Un visiteur ouvre une adresse qui n'existe pas (ou plus) : une page « introuvable » dans sa
  langue propose l'accueil et la liste des projets.
- L'identifiant d'un élément change : l'ancienne adresse redirige vers la nouvelle.
- Un texte très long (titre de projet, nom d'organisme) : la mise en page reste lisible sur un
  écran de 320 px de large, sans défilement horizontal.
- Un visiteur a activé `prefers-reduced-motion` : aucune animation non essentielle.
- Connexion lente : le texte s'affiche avant les images, qui ne bloquent pas la lecture.

## Requirements *(mandatory)*

### Functional Requirements

**Source de contenu**

- **FR-001**: Le système MUST décrire projets, diplômes, expériences et la présentation de
  Sébastien dans une source de contenu structurée unique, avec, pour chaque élément, un
  identifiant stable indépendant de la langue.
- **FR-002**: Chaque élément MUST porter ses textes dans les deux langues (français et
  anglais) ; les champs non traduisibles (dates, liens, technologies) ne sont saisis qu'une
  fois.
- **FR-003**: Les liens entre éléments (projet ↔ expérience, projet ↔ diplôme) MUST être
  déclarés une seule fois dans la source et apparaître des deux côtés sur le site.
- **FR-004**: La construction du site MUST échouer, avec un message explicite, si un champ
  obligatoire manque, si une traduction manque, si un lien vers un autre élément est cassé ou
  si deux éléments ont le même identifiant.
- **FR-005**: Un élément MUST pouvoir être marqué « brouillon » (exclu du site public) et
  « mis en avant » (affiché en priorité sur l'accueil et en tête de liste).
- **FR-006**: La source de contenu MUST être lisible par un autre programme que la version
  écrite (la future scène 3D), dans un format documenté.

**Pages**

- **FR-007**: Le site MUST proposer, dans chaque langue : une page d'accueil, une liste des
  projets, une page par projet, une page Parcours, une page par diplôme, une page par
  expérience, une page Contact et une page « introuvable ».
- **FR-008**: L'accueil MUST présenter Sébastien (nom, activité, courte présentation, photo ou
  visuel) et les projets mis en avant.
- **FR-009**: La liste des projets MUST permettre de filtrer par catégorie ou technologie ; sans
  JavaScript, le filtre MUST rester utilisable (par exemple via des pages ou ancres par
  catégorie) ou la liste complète MUST rester affichée.
- **FR-010**: Chaque page MUST être entièrement lisible et navigable sans JavaScript.
- **FR-011**: Le site MUST comporter une navigation principale (Accueil, Projets, Parcours,
  Contact, sélecteur de langue) présente sur toutes les pages.
- **FR-012**: Le site MUST prévoir un emplacement visible (sur l'accueil) pour l'accès à la
  future expérience 3D, masqué tant que celle-ci n'existe pas.

**Langues**

- **FR-013**: Chaque page MUST exister dans les deux langues, à des adresses distinctes et
  stables, avec la langue déclarée et un lien vers l'autre version.
- **FR-014**: Le sélecteur de langue MUST conduire à la même page dans l'autre langue.
- **FR-015**: La racine du site MUST orienter vers la langue préférée du navigateur (français
  ou anglais, anglais par défaut) sans empêcher l'indexation des deux versions.

**Référencement et IA**

- **FR-016**: Chaque page MUST avoir un titre et une description uniques, une adresse
  canonique, et des balises d'aperçu pour le partage (titre, description, image).
- **FR-017**: Chaque page d'élément MUST contenir des données structurées valides décrivant
  l'élément et le relier à la personne Sébastien.
- **FR-018**: Le site MUST publier un plan du site listant toutes les pages publiques dans les
  deux langues, et un fichier d'instructions pour les robots qui y renvoie.
- **FR-019**: Le site MUST publier un résumé destiné aux agents IA (`llms.txt`) qui présente
  Sébastien, liste les projets et le parcours avec leurs liens, généré depuis la source de
  contenu.
- **FR-020**: Le HTML MUST être sémantique : un seul titre principal par page, titres
  hiérarchisés, zones de navigation et de contenu identifiées, texte alternatif pour chaque
  image porteuse de sens.

**Performance, hébergement, vie privée**

- **FR-021**: Le site public MUST être servi entièrement en fichiers statiques, sans serveur
  applicatif ni base de données au moment de la visite, contact compris.
- **FR-026**: La page Contact MUST proposer un lien e-mail protégé contre la collecte
  automatique et les liens vers les profils externes définis dans le Profil ; aucun
  formulaire.
- **FR-027**: Tout le contenu MUST être édité dans des fichiers texte versionnés avec le site ;
  chaque publication correspond à un état enregistré de ces fichiers.
- **FR-022**: Les images MUST être servies dans des formats compressés modernes, à des tailles
  adaptées à l'écran, et chargées en différé quand elles sont hors écran.
- **FR-023**: Le site MUST n'effectuer aucune requête vers un domaine tiers au chargement d'une
  page, ne déposer aucun cookie et n'utiliser aucun traceur ; un contenu tiers intégré (vidéo)
  MUST ne se charger qu'après un clic du visiteur.
- **FR-024**: La mise en page MUST s'adapter de 320 px à 2560 px de large et être utilisable
  entièrement au toucher.
- **FR-025**: Les anciennes adresses MUST pouvoir être redirigées vers les nouvelles quand un
  identifiant change.

### Key Entities

- **Personne (Profil)** : Sébastien ; nom, activité, présentation courte et longue (FR/EN),
  photo, localisation, langues parlées, liens vers les profils externes, moyen de contact.
- **Projet** : identifiant, titre, résumé et description (FR/EN), catégorie(s), technologies et
  outils, période, rôle tenu (FR/EN), visuels (avec texte alternatif FR/EN), liens externes
  (démo, code, vidéo), statut brouillon / mis en avant, ordre d'affichage, liens vers
  expériences et diplômes.
- **Diplôme** : identifiant, intitulé (FR/EN), établissement, lieu, date d'obtention (ou
  période), niveau, description et compétences (FR/EN), liens vers projets.
- **Expérience** : identifiant, poste (FR/EN), organisme, lieu, type (emploi, freelance, stage,
  bénévolat…), période (fin optionnelle si en cours), missions et réalisations (FR/EN),
  technologies, liens vers projets.
- **Catégorie / Technologie** : identifiant, libellé (FR/EN) ; sert au filtrage et aux données
  structurées.
- **Page de site** : contenus fixes de l'accueil, du parcours et du contact (FR/EN) qui ne sont
  pas des éléments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visiteur arrivé sur l'accueil atteint la page détaillée d'un projet en 2 clics
  ou moins, sur ordinateur comme sur téléphone.
- **SC-002**: Sur un téléphone de milieu de gamme en 4G, le contenu principal de chaque page
  s'affiche en moins de 2,5 s et la page ne bouge pas pendant le chargement.
- **SC-003**: 100 % des pages publiques existent dans les deux langues, figurent dans le plan du
  site et passent la validation des données structurées sans erreur.
- **SC-004**: Les audits automatisés de performance, accessibilité, bonnes pratiques et
  référencement donnent au moins 90/100 sur chaque page type.
- **SC-005**: Ajouter un projet complet (textes FR/EN, un visuel, des liens) demande moins de
  15 minutes à Sébastien, sans toucher à autre chose que la source de contenu.
- **SC-006**: Aucune requête vers un domaine tiers et aucun cookie lors de la visite d'une page
  quelconque.
- **SC-007**: Toutes les pages restent lisibles et navigables avec JavaScript désactivé.
- **SC-008**: Dans les 3 mois suivant la mise en ligne, une recherche du nom complet de
  Sébastien fait apparaître le portfolio en première page de résultats.

## Assumptions

- Le contenu (textes, visuels, liste des projets, diplômes, expériences) est fourni par
  Sébastien ; cette fonctionnalité livre la structure et des exemples, pas la rédaction finale.
- Pas de blog ni d'articles dans cette version ; la structure ne doit pas l'empêcher plus tard.
- Pas de compte visiteur, de commentaires ni de recherche plein texte dans cette version.
- Le nom de domaine sera choisi plus tard ; il n'influence pas la spécification.
- Les traductions sont faites ou relues par Sébastien (constitution, principe VI).
- La scène 3D isométrique fait l'objet d'une fonctionnalité séparée ; celle-ci ne livre que la
  source de contenu lisible par elle et l'emplacement d'accès sur l'accueil.
- Un CV téléchargeable (PDF) n'est pas exigé ; il pourra être ajouté comme simple fichier lié
  depuis le Parcours.
- Les budgets chiffrés de la constitution (Core Web Vitals, Lighthouse ≥ 90, JS ≤ 50 Ko) font
  foi pour cette fonctionnalité.
