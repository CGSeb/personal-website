## Contexte

Un portfolio doit à la fois donner envie et être bien référencé. Plutôt que de choisir, celui-ci a deux versions construites à partir du même contenu :

- **une scène 3D isométrique** : une pièce à explorer, où chaque objet (projet, diplôme, expérience) ouvre un panneau d'informations ;
- **une version écrite**, en HTML statique : rapide, lisible même sans JavaScript, et pensée pour les moteurs de recherche et les agents IA.

## Démarche

- **Spécifié avant d'être codé**, avec Spec Kit : deux spécifications, un plan technique et une liste de tâches pour chacune
- **Un seul contenu, en deux langues** : chaque élément est décrit une fois en YAML et Markdown, validé à la construction ; il alimente les pages, le sitemap, `llms.txt` et l'export que lit la scène
- **La scène** : Three.js, caméra orthographique, rendu à la demande et qualité adaptative ; la pièce et les objets sont modélisés dans Blender avec des emplacements nommés, et un nouveau projet y trouve sa place tout seul
- **Accessible et sobre** : liste au clavier qui pilote la scène, replis vers la version écrite (sans WebGL, mouvements réduits, appareil lent), aucun traceur ni cookie

## Résultats

Lighthouse à 100 sur la scène comme sur la version écrite, moins de 300 Ko avant la première interaction sur la scène, et 250 tests de bout en bout sur ordinateur, iPhone et petit écran, plus une vérification sans JavaScript : la version écrite reste complète et la scène affiche sa liste de liens à la place de la 3D.
