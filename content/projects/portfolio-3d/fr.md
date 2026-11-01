## Contexte

Un portfolio doit à la fois donner envie et être bien référencé. Plutôt que de choisir, celui-ci a deux versions construites à partir du même contenu :

- **une scène 3D isométrique** : une pièce à explorer, où chaque objet (projet, diplôme, expérience) ouvre un panneau d'informations ;
- **une version écrite**, en HTML statique : lisible même sans JavaScript, et pensée pour les moteurs de recherche et les agents IA.

## Fonctionnalités

- **Une pièce à explorer** : on déplace la vue, on zoome, et on touche un objet pour en savoir plus
- **Un seul contenu, en deux langues** : français et anglais, avec un thème clair ou sombre
- **Une liste au clavier** qui pilote la scène, et un retour à la version écrite à tout moment
- **Sans traceur ni cookie**

## Sous le capot

- **Astro et TypeScript** pour le site et la version écrite
- **Three.js** pour la scène 3D ; la pièce et les objets sont modélisés dans **Blender**
- **YAML et Markdown** pour le contenu : chaque élément est décrit une fois, et il alimente les pages, le sitemap, `llms.txt` et la scène
- **Spec Kit** pour spécifier chaque évolution avant de la coder
