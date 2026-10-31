## Contexte

Apprendre l'IA, c'est souvent choisir entre des vidéos trop générales et une documentation trop technique. LessonFolk part d'une autre idée : l'IA elle-même est un très bon professeur, à condition de lui donner un vrai programme.

LessonFolk est une collection de cours d'IA libres, pensés pour être enseignés *par* une IA. On connecte son assistant (Claude, ChatGPT, Cursor…) à LessonFolk, on dit « on commence », et il mène la leçon en conversation : il explique, pose des questions, s'adapte au niveau et enregistre la progression.

## Fonctionnement

- **Un site et un serveur MCP** (Model Context Protocol, le standard qui permet aux assistants IA d'utiliser des outils) : l'assistant y trouve les cours et les consignes du tuteur, et y enregistre la progression
- **Un parcours personnalisé** : le tuteur demande le niveau et les centres d'intérêt, recommande un parcours, puis enseigne une courte leçon à la fois, avec des questions de vérification et des révisions ciblées
- **15 cours en 4 thèmes** : comprendre l'IA, utiliser les outils d'IA, construire avec l'IA, l'IA et la société ; des fondamentaux jusqu'au RAG et aux agents
- **En ligne ou chez soi** : sur lessonfolk.com avec un compte GitHub ou Google, ou sur son ordinateur avec Docker, sans aucune donnée envoyée
- **Un plugin Claude Code** qui connecte LessonFolk en une commande

## Démarche

Projet libre : le code est sous licence MIT, les cours sous CC BY 4.0. Écrire un cours ne demande aucune ligne de code : on ouvre son agent IA dans le dépôt, on dit « crée un cours sur… », et il interroge l'auteur, propose un plan, rédige les leçons avec lui et les vérifie.

Côté technique : un tableau de bord Astro, un serveur MCP en TypeScript, la progression dans PostgreSQL, une connexion OAuth, des tests automatisés et des versions régulières (1.6.2 fin octobre 2026).

## Et ensuite

Des **projets** pour mettre en pratique : un sujet, quelques étapes, et le tuteur en coach qui donne des indices plutôt que la solution.
