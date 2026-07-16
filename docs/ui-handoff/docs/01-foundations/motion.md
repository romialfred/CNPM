# Mouvement et transitions

## Principes

Le mouvement explique un changement d’état ; il ne décore pas l’interface.

- Hover/focus : 120 ms.
- Ouverture d’un panneau : 180 ms.
- Transition d’étape : 180–260 ms.
- Aucune animation de KPI au chargement si elle retarde la lecture.
- Les graphiques peuvent s’animer une fois, mais les tests visuels désactivent les animations.

## Réduction du mouvement

Respecter `prefers-reduced-motion`. Désactiver transitions non essentielles, parallaxe, défilement animé et boucles.

## Chargement

- Utiliser skeleton pour une structure connue.
- Utiliser spinner seulement pour une action localisée et brève.
- Pour un traitement long, afficher progression, étape et possibilité de quitter sans perdre l’état.
