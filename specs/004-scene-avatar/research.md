# Research: Avatar low-poly dans la scène 3D

## 1. Construire la figurine

- **Decision**: la figurine est construite par du code dans `tower_room.py`, avec le `Builder` des autres
  objets : boîtes, cylindres et ellipsoïdes à facettes, sans texture, une couleur par matériau. Tête
  volontairement grosse.
- **Rationale**: même style et même chemin que tout le reste, modèle régénérable, couleurs réglables sans
  retoucher un maillage à la main. Un objet sans texture pèse quelques dizaines de Ko au plus (les objets
  actuels font 5 à 17 Ko).
- **Alternatives considered**: génération par IA depuis la photo (résultat lourd, style différent de la
  pièce, à nettoyer à la main) ; sculpture manuelle dans Blender (non régénérable).

## 2. Ce qui fait la ressemblance

- **Decision**: traits repris de `content/profile-photo.webp` :
  - cheveux châtains courts, volume sur le dessus, côtés plus courts ;
  - barbe courte et pleine, plus sombre que la peau, qui suit la mâchoire, et moustache ;
  - lunettes rectangulaires sombres ;
  - peau claire ;
  - t-shirt rouge brique ; pantalon sombre (non visible sur la photo, choix neutre).
- **Rationale**: à la vue de départ sur téléphone, la tête ne fait qu'une vingtaine de pixels (pièce
  d'environ 6 unités de large à l'écran, tête d'environ 0,35 unité). Seuls les grands traits se lisent :
  on exagère donc les lunettes, la barbe et la masse de cheveux plutôt que d'ajouter du détail.
- **Contrôle**: les rendus à valider incluent la vue de la scène à sa taille réelle, pas seulement un gros
  plan (SC-001).

## 3. Animer le salut

- **Decision**: pas de squelette ni de clip. Le bras est un nœud nommé `avatar.arm`, centré sur l'épaule,
  dont le code fait varier la rotation avec une courbe pure (`wave.ts`) : monter, deux battements, redescendre,
  2 s au plus, retour exact à 0. Le bras est rigide et déjà plié, comme celui d'une figurine.
- **Rationale**: un seul nœud à bouger, aucun code d'animation de three.js en plus, et une courbe testable sans
  navigateur. Le modèle à pièces rigides va avec le style.
- **Vérifié (01/11)**: essai Blender 5.2 + `gltfpack` avec les options de `optimize-models.mjs` : `avatar.arm`,
  son pivot et ses enfants (une pièce par matériau) restent en place dans le fichier compressé. Trois nœuds
  intermédiaires sont ajoutés par `gltfpack`, sans effet sur le mouvement.
- **Alternatives considered**: `AnimationMixer` et clip Blender (plus de code chargé, inutile pour un seul
  geste) ; squelette (bien plus lourd à produire et à afficher).

## 4. Dessiner le salut sans rendu continu

- **Decision**: même mécanisme que le fondu jour / nuit de `scene3d.ts` : une boucle `requestAnimationFrame` qui
  ne vit que le temps du geste et appelle `stage.requestRender()`. À la fin, plus aucune demande d'image.
  Pendant un geste, un nouveau survol ne relance rien.
- **Rationale**: FR-010 et SC-005. Le contrôle existe déjà : `__scene.frames()` ne doit plus bouger au repos.

## 5. Éclairer la figurine et son ombre

- **Decision**:
  - la figurine est éclairée en temps réel comme les objets placés (`lighting.adopt`, lumière d'appoint comprise), ce
    qui suit le fondu jour / nuit sans rien ajouter ;
  - son ombre est **précalculée** : la figurine est ajoutée à la scène Blender après `_join_room()`, présente pendant
    les deux précalculs, puis retirée avant l'export. Elle projette donc son ombre sur la chaise et le sol, dans
    `room-day` et `room-night`.
- **Rationale**: pas d'ombre en temps réel dans la scène aujourd'hui ; en ajouter une coûterait cher sur téléphone pour un
  seul objet. L'ombre précalculée est plus douce et ne coûte rien à l'affichage.
- **Limite acceptée**: l'ombre du bras ne bouge pas pendant le salut (moins de 2 s, ombre peu visible). Et si la
  figurine ne se charge pas, son ombre reste sur la chaise : discret et sans conséquence.
- **Conséquence**: changer la pose demande un nouveau précalcul (quelques minutes au processeur graphique).
- **Alternatives considered**: tache sombre posée sous la figurine (moins juste, surtout sur la chaise) ; ombre
  temps réel (coût, et `baked.ts` n'en reçoit pas).

## 6. Tourner la chaise

- **Decision**: la chaise passe par une fonction `_chair(b, x, z, rot)` qui reprend les pièces actuelles avec une rotation
  (`rot = π/4` : face vers `+X +Z`, la direction de la caméra). Marqueur `avatar.seat` sur l'assise, même rotation.
- **Rationale**: la caméra regarde toujours depuis `(1, 1, 1)` et ne tourne pas (`enableRotate = false`) : le visage sera
  donc toujours vu sous le même angle.
- **À vérifier sur le rendu**: le dossier ne doit pas traverser le bureau (repère actuel de la chaise : `x = -0,6`,
  `z = -0,95`) ; déplacer la chaise si besoin.

## 7. Ne gêner aucun objet

- **Decision**: la figurine reçoit une forme de sélection comme les autres objets (`objects.ts`), avec le même agrandissement
  au toucher, mais `picking.ts` donne la priorité à tout autre objet touché par le même rayon. Écran principal et figurine sont
  séparés d'environ 0,6 unité à l'écran d'après leurs positions : le cas ne devrait se produire qu'en bordure. Le test e2e
  vérifie chaque objet (SC-006).
- **Alternatives considered**: forme de sélection minuscule (trop difficile à toucher sur téléphone, où la figurine fait
  environ 30 px).

## 8. La bulle

- **Decision**: un élément HTML dans `SceneView.astro`, caché par défaut, placé à la position écran de la tête à chaque
  image (`stage.toScreen`), bloqué à l'intérieur de la scène par un calcul pur (`bubblePosition`). Rôle `dialog`,
  étiqueté par son texte, focus à l'ouverture et retour à l'élément d'origine, comme les panneaux. Module à part
  (`bubble.ts`) plutôt que dans `Panels`, qui ne gère que des éléments du contenu.
- **Exclusion mutuelle**: `panels.events.onChange` ferme la bulle quand un panneau s'ouvre, et l'ouverture de la bulle
  appelle `panels.close()`.
- **Sortie de l'écran (FR-015)**: testée sur l'événement `change` des contrôles, c'est-à-dire quand le visiteur déplace la
  vue, et non à chaque image, pour que le déplacement automatique qui suit l'ouverture depuis la liste ne la ferme pas.
- **Alternatives considered**: sprite de texte dans la 3D (flou, illisible par les lecteurs d'écran, pas de bouton).

## 9. Garder la bulle au changement de langue

- **Decision**: fragment `#bienvenue` (fr) / `#welcome` (en), traduit par `translateHash` comme les autres. À l'arrivée, la
  bulle s'ouvre sans salut, une fois la figurine chargée. Sans figurine, le fragment est ignoré.
- **Rationale**: c'est déjà ainsi qu'un panneau survit au changement de langue (`syncLanguageSwitcher`), et la constitution
  (principe VI) demande de conserver l'objet consulté. Le salut n'est joué qu'à un geste du visiteur.

## 10. Accès au clavier

- **Decision**: la toile n'est pas atteignable au clavier : le parcours des objets est la liste textuelle
  (`scene.canvas` le dit). La figurine y a donc une entrée, en fin de liste : une section cachée rendue par
  `SceneItemList.astro`, révélée quand le modèle est chargé. Cachée, elle n'existe ni sans JavaScript ni sans 3D. Survol et
  focus de l'entrée mettent la figurine en évidence, comme les autres.
- **Rationale**: FR-019 et FR-020, avec le mécanisme existant, sans donnée dans le manifeste ni dans l'export.
- **À surveiller**: `tests/e2e/scene.spec.ts` parcourt `.scene-list button` ; le test devra compter avec cette entrée.

## 11. Le budget

- **Decision**: `check-scene-budget.mjs` donne à `avatar.glb` une ligne sans plafond (poids affiché) ; le total de 3 Mo reste
  bloquant. Aujourd'hui : 1,40 Mo, donc 1,6 Mo de marge.
- **Rationale**: décision de Sébastien : viser léger, mesurer, affiner ensuite. Sans cette ligne, le plafond de 100 Ko par
  défaut pourrait bloquer une première version sans raison.

## 12. Texte de la bulle

- **Decision**: textes de la spec (FR-012), dans `ui.ts`. La version française tutoie (« Navigue »), comme Sébastien l'a
  formulé, alors que l'interface vouvoie (« Déplacez la vue ») : la figurine parle en son nom, ce qui peut se justifier, mais
  à revoir à la relecture.
