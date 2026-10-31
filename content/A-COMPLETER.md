# Contenu réel : ce qu'il reste à compléter

Tout le contenu actuel est provisoire. On le remplace étape par étape, dans cet ordre : le
profil d'abord (il sert partout : en-tête, SEO, JSON-LD, `llms.txt`), puis le parcours, puis
les projets, qui renvoient vers le parcours.

Chaque texte s'écrit en **français et en anglais**. Tu peux me donner seulement le français :
je propose l'anglais et tu relis.

Ce fichier n'est pas lu par le site ; on le supprime quand tout est coché.

## Étape 1 — Profil (`profile.yaml`, `profile-photo.webp`)

- [x] Nom affiché : « Sébastien » seul, ou prénom et nom ?
- [x] Intitulé du poste (`jobTitle`), court : aujourd'hui « Développeur »
- [x] Accroche (`headline`), une ligne sous ton nom : aujourd'hui « Développeur et créateur de projets numériques »
- [x] Résumé (`summary`), 2 ou 3 phrases : qui tu es, ce que tu fais, pour qui
- [x] Photo de profil (portrait carré de préférence, au moins 800 × 800 px) et sa description
- [x] Localisation : « France », une ville, une région ? Disponible à distance ?
- [x] Langues parlées et niveau : aujourd'hui français (maternelle), anglais (courant)
- [x] Adresse e-mail de contact (aujourd'hui `contact@example.com`)
- [x] Profils en ligne : GitHub (`CGSeb`), LinkedIn, YouTube, X, Mastodon, autre ?

## Étape 2 — Textes des pages (`pages/`)

Chaque page a un titre, une description pour Google (50 à 160 caractères) et un texte
d'introduction.

- [x] Accueil (`pages/home/`) : le paragraphe de bienvenue
- [x] Parcours (`pages/career/`) : l'introduction de la page
- [x] Contact (`pages/contact/`) : l'invitation à écrire (quels sujets : missions, emploi, collaboration ?)

## Étape 3 — Expériences (`experience/`)

Aujourd'hui deux exemples inventés : « Développeur indépendant » (depuis 01/2025) et
« Développeur web » dans un « Studio (à préciser) » (09/2020 – 12/2024). Pour **chaque**
expérience réelle :

- [x] Poste
- [x] Entreprise (et son site, facultatif)
- [x] Lieu
- [x] Type : salarié, indépendant, stage, alternance, bénévolat…
- [x] Dates de début et de fin (mois et année ; pas de fin si en cours)
- [x] Technologies et outils utilisés
- [x] Description : missions, réalisations, résultats chiffrés si possible

## Étape 4 — Diplômes (`education/`)

Aujourd'hui un exemple : « Master en informatique », « Université (à préciser) », 2018 – 2020.
Pour chaque diplôme ou formation :

- [x] Intitulé exact
- [x] Établissement (et son site, facultatif) et lieu
- [x] Dates, obtenu ou non, niveau (Bac+2, Bac+5…)
- [x] Description : spécialité, matières, projet ou mémoire marquant

## Étape 5 — Projets (`projects/`)

Aujourd'hui trois projets : LessonFolk, Portfolio 3D isométrique, Vidéos d'ambiance longues.
D'abord la liste : lesquels garder, lesquels ajouter. Puis pour chaque projet :

- [x] Titre et résumé (une phrase, 50 à 160 caractères)
- [x] Ton rôle
- [x] Dates (et fin si terminé)
- [x] Catégories et technologies
- [x] Description : contexte, démarche, résultats
- [x] Image de couverture et galerie (captures, rendus), avec une description de chaque image
- [x] Liens : démo, code, vidéo, article (aujourd'hui `example.com` et une vidéo YouTube de test)
- [x] Expérience ou diplôme lié
- [x] À la une sur l'accueil (et objet dédié dans la scène 3D) ?

## Étape 6 — Listes (`categories.yaml`, `technologies.yaml`)

- [x] Catégories de projets : aujourd'hui Web, Éducation, Vidéo
- [x] Technologies : complétées au fil des étapes 3 à 5

## Étape 7 — Vérification

- [ ] Plus aucun « (Texte provisoire) », « (Provisoire) », « à préciser », `example.com`
- [ ] `npm run build`, `npm test`, `npm run check:seo`, `npm run check:links`
- [ ] Relecture des pages FR et EN et de la scène 3D

Ensuite : la passe graphique et design sur tout le site, scène 3D comprise.
