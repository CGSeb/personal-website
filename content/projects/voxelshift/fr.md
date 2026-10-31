## Contexte

Quand on travaille avec Blender, on jongle vite entre plusieurs versions : la stable, une version LTS pour un vieux projet, une version expérimentale pour tester une nouveauté. Chacune a ses réglages et ses extensions, et lancer un long rendu bloque la machine au mauvais moment.

Voxel Shift réunit tout cela dans une seule application de bureau, libre et gratuite, pour Windows et Linux.

## Fonctionnalités

- **Bibliothèque Blender** : installer les versions officielles stables et les builds expérimentales, choisir une version par défaut, garder ses favorites
- **Projets** : rouvrir un projet récent avec la bonne version de Blender, miniatures comprises
- **Migration** : transférer réglages, extensions et anciens add-ons d'une installation à l'autre ; enregistrer des configurations et les réappliquer
- **Planificateur de rendus** : file de rendus d'animation avec heure de départ, progression, temps restant, pause, reprise, nouvel essai et notifications
- **Serveur MCP intégré** : 40 outils pour qu'un assistant IA pilote Blender, les projets et les rendus, avec une interface qui se met à jour en direct

## Démarche

Application Tauri : interface en React et TypeScript, cœur en Rust. Le projet est testé côté interface et côté Rust, publié sous licence GPL-3.0 avec des versions régulières (1.6.0 en octobre 2026) et une feuille de route publique.
