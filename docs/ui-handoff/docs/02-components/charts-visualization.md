# Graphiques et visualisation de données

## Principes

- Commencer par la question métier, pas par le type de graphique.
- Afficher période, unité, source et date d’actualisation.
- Limiter la précision : FCFA sans décimales, taux à une décimale sauf besoin métier.
- Préférer barres pour comparaison, lignes pour évolution, donut pour composition simple de 2 à 5 catégories.
- Interdire les graphiques 3D.
- Utiliser le thème `design-tokens/echarts-theme.json`.

## Interaction

- Tooltip au clavier si le composant le permet.
- Légende cliquable seulement si l’état masqué reste compréhensible.
- Export image/CSV selon habilitation.
- Tableau ou résumé alternatif accessible.

## Zones dynamiques dans les tests visuels

Masquer les animations, horodatages « il y a… », curseurs et données aléatoires. Les fixtures sont figées pour les baselines.
