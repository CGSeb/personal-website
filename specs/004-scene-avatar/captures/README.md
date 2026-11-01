# Rendus de la figurine

Rendus pour la validation de la ressemblance (T008). Ils se régénèrent avec :

```bash
blender --background --python assets-src/models/build_models.py -- --only avatar
```

```bash
blender --background --python assets-src/models/render_avatar.py
```

Dans ces rendus, la pièce est `room.blend` avec ses textures précalculées, comme dans la scène. Les objets posés
(écrans, diplômes, fiches) n'y figurent pas. L'ombre de la figurine vient du précalcul.

## La photo et la tête

| Photo | Rendus |
|---|---|
| ![Photo de profil](../../../content/profile-photo.webp) | ![Face, trois-quarts et profil](compare-head.png) |

## Le corps

Face, trois-quarts et angle de la scène :

![Le corps](compare-body.png)

## Dans la pièce

| Téléphone, jour | Téléphone, nuit |
|---|---|
| ![Jour](room-phone-day.png) | ![Nuit](room-phone-night.png) |

Ordinateur, jour et nuit :

![Ordinateur, jour](room-desktop-day.png)

![Ordinateur, nuit](room-desktop-night.png)

## La chaise et le bureau

Dessus, depuis l'est et depuis le sud :

| Dessus | Est | Sud |
|---|---|---|
| ![Dessus](chair-top.png) | ![Est](chair-east.png) | ![Sud](chair-south.png) |

## À la taille réelle d'un téléphone

Environ 58 px par mètre, la tête fait une vingtaine de pixels de large. Le recadrage est à sa taille réelle, puis agrandi
cinq fois sans lissage.

| Jour | Nuit |
|---|---|
| ![Jour](phone-crop-day.png) ![Jour, agrandi](phone-crop-day-x5.png) | ![Nuit](phone-crop-night.png) ![Nuit, agrandi](phone-crop-night-x5.png) |

## Le bras levé

Contrôle du pivot `avatar.arm` à l'épaule (axe et angle : `RAISED` dans `render_avatar.py`) :

![Bras levé](avatar-arm-raised.png)

## Sur le vrai site

Captures du site lui-même, avec un rendu logiciel (SwiftShader).

| Jour | Nuit |
|---|---|
| ![Bulle, jour](site-day-bubble.png) | ![Bulle, nuit](site-night-bubble.png) |
| ![Téléphone, jour](site-phone-day-bubble.png) | ![Téléphone, nuit](site-phone-night-bubble.png) |
| ![Sans la figurine, jour](site-blocked-day.png) | ![Sans la figurine, nuit](site-blocked-night.png) |

La dernière ligne montre la chaise quand `avatar.glb` ne se charge pas (scénario 18).

La main levée pendant le salut :

![Salut](site-wave-raised.png)
