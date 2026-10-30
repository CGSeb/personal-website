<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Principles defined (first ratification):
  I. Une seule source de contenu, deux expériences
  II. Version écrite d'abord : indexable et lisible par les IA
  III. 3D fluide sur appareils modestes, mobile compris
  IV. Hébergement léger
  V. Vie privée par défaut
  VI. Bilingue français / anglais
- Added sections: Contraintes techniques et budgets de performance, Flux de travail et
  contrôles qualité, Gouvernance
- Removed sections: none
- Deferred TODOs: none. The stack is intentionally not fixed here; it will be chosen during
  /speckit-plan against these constraints. The numeric budgets are initial values and may be
  amended (MINOR or PATCH bump depending on scope).
-->

# Constitution du portfolio personnel

## Principes fondamentaux

### I. Une seule source de contenu, deux expériences

Le site propose deux expériences : une scène 3D isométrique, vue de haut, où l'on découvre les
projets, diplômes et expériences en interagissant avec le décor ; et une version écrite
classique de portfolio.

- Projets, diplômes et expériences MUST être décrits une seule fois, dans une source de contenu
  structurée commune, que les deux expériences lisent.
- Aucun contenu ne MUST exister dans une seule des deux expériences, sauf les éléments purement
  décoratifs de la scène 3D.
- Chaque objet interactif de la scène 3D qui présente un contenu MUST pointer vers la page
  correspondante de la version écrite.

Raison : deux copies du même contenu divergent toujours ; une source unique garde les deux
expériences à jour sans double saisie.

### II. Version écrite d'abord : indexable et lisible par les IA

- La version écrite MUST être servie en HTML complet, généré à la construction ou côté serveur,
  et rester entièrement lisible sans JavaScript.
- Chaque projet, diplôme et expérience MUST avoir sa propre URL stable, un titre et une
  description uniques, et des données structurées (JSON-LD schema.org : `Person`,
  `CreativeWork`, `EducationalOccupationalCredential`, etc.).
- Le site MUST publier un `sitemap.xml`, un `robots.txt` et un `llms.txt` qui résume le contenu
  pour les agents IA.
- Le HTML MUST être sémantique (titres hiérarchisés, `main`, `nav`, `article`, textes
  alternatifs), ce qui sert à la fois le référencement, les IA et l'accessibilité.
- La scène 3D est une amélioration progressive : elle ne MUST jamais être le seul chemin vers
  un contenu.

Raison : les moteurs de recherche et les IA lisent du texte, pas une scène WebGL ; la
version écrite est ce qui fait trouver le portfolio.

### III. 3D fluide sur appareils modestes, mobile compris

- La scène 3D MUST viser 60 i/s sur un ordinateur courant et au moins 30 i/s stables sur un
  téléphone Android de milieu de gamme de moins de 4 ans.
- La scène MUST être utilisable au toucher (déplacement, zoom, sélection d'un objet) et
  s'adapter à l'écran en portrait comme en paysage.
- La 3D MUST se charger après le contenu principal et de façon progressive (scène de base
  d'abord, détails ensuite), avec un indicateur de chargement.
- Le site MUST basculer vers la version écrite, ou le proposer clairement, quand WebGL n'est
  pas disponible, quand la fréquence d'images reste trop basse, ou quand l'utilisateur a activé
  `prefers-reduced-motion` ou le mode économie de données.
- La qualité graphique MUST s'ajuster à l'appareil (résolution de rendu, ombres, effets).

Raison : une belle scène qui saccade ou ne se charge pas sur téléphone fait fuir le visiteur
avant qu'il voie le moindre projet.

### IV. Hébergement léger

- Tout le contenu public MUST pouvoir être servi en fichiers statiques, depuis un hébergement
  statique ou un CDN, sans serveur applicatif ni base de données au moment de la visite.
- Une fonction dynamique (formulaire de contact, par exemple) MUST être optionnelle : si elle
  tombe, le reste du site fonctionne. Elle MUST tourner sur une petite instance (1 vCPU,
  512 Mo de RAM) ou en fonction serverless.
- Les ressources 3D (modèles, textures) MUST être compressées (glTF/GLB avec Draco ou
  Meshopt, textures KTX2 ou WebP/AVIF) et servies avec un cache long.

Raison : un portfolio doit coûter presque rien à héberger et ne pas tomber sous un pic de
visites.

### V. Vie privée par défaut

- Le site MUST n'utiliser aucun traceur tiers, aucun pixel publicitaire et aucun cookie qui
  demanderait un bandeau de consentement.
- Les mesures d'audience, s'il y en a, MUST être sans cookie, agrégées et auto-hébergées ou
  chez un service européen respectueux de la vie privée.
- Les polices, scripts et ressources MUST être servis depuis le domaine du site ; aucun
  contenu tiers intégré (vidéo, carte, réseau social) ne MUST se charger sans action
  explicite du visiteur.
- Les données d'un éventuel formulaire de contact MUST se limiter au strict nécessaire et ne
  jamais être revendues ni partagées.

Raison : un visiteur doit pouvoir parcourir le portfolio sans être pisté, et le site reste
conforme au RGPD sans bandeau.

### VI. Bilingue français / anglais

- Chaque page et chaque élément de contenu MUST exister en français et en anglais, avec le même
  niveau de détail.
- Chaque langue MUST avoir ses propres URL (par exemple `/fr/…` et `/en/…`) avec les balises
  `hreflang` et `lang` correctes.
- Les deux expériences (3D et écrite) MUST proposer un sélecteur de langue qui conserve la page
  ou l'objet consulté.
- Une traduction automatique MUST être relue avant publication.

Raison : le portfolio vise des lecteurs francophones et internationaux, et les moteurs
indexent chaque langue séparément.

## Contraintes techniques et budgets de performance

La stack n'est pas fixée par cette constitution : elle sera choisie pendant `/speckit-plan`,
en respectant les contraintes ci-dessous. Budgets initiaux, mesurés sur mobile en 4G simulée :

- **Version écrite** : LCP < 2,5 s, CLS < 0,1, INP < 200 ms ; score Lighthouse ≥ 90 en
  Performance, Accessibilité, Bonnes pratiques et SEO ; JavaScript ≤ 50 Ko compressé par page.
- **Scène 3D** : ressources nécessaires à la première interaction ≤ 3 Mo compressés ; reste
  chargé à la demande ; scène interactive en moins de 5 s.
- **Compatibilité** : deux dernières versions de Chrome, Firefox, Safari et Edge, sur ordinateur
  et mobile (iOS Safari compris).

Toute fonctionnalité qui dépasse un budget MUST le justifier dans son plan et proposer une
compensation.

## Flux de travail et contrôles qualité

- Chaque fonctionnalité suit le flux Spec Kit : spécification, plan, tâches, réalisation.
- Chaque spécification MUST préciser son effet sur les deux expériences (3D et écrite) et sur
  les deux langues.
- Avant toute mise en production, MUST être vérifiés :
  - les budgets de la version écrite (Lighthouse sur les pages modifiées) ;
  - la fluidité de la scène 3D sur un téléphone de milieu de gamme réel ou émulé ;
  - l'absence de requête vers un domaine tiers non autorisé ;
  - la présence des deux langues et la validité des données structurées et du sitemap.

## Gouvernance

- Cette constitution prime sur les autres pratiques du projet. Chaque plan
  (`/speckit-plan`) MUST contenir une vérification de conformité à ces principes, et toute
  exception MUST y être justifiée.
- Une modification de la constitution passe par `/speckit-constitution`, avec un rapport
  d'impact et une montée de version :
  - MAJOR : suppression ou redéfinition incompatible d'un principe ;
  - MINOR : ajout d'un principe ou d'une section, ou extension notable d'une règle ;
  - PATCH : clarification, formulation, ajustement mineur d'un budget.
- La conformité est revue à chaque plan et avant chaque mise en production.

**Version** : 1.0.0 | **Ratifiée** : 2026-10-30 | **Dernière modification** : 2026-10-30
