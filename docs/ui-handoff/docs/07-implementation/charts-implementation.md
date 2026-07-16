# Implémentation des graphiques ECharts

## Thème

Enregistrer `design-tokens/echarts-theme.json` sous le nom `cnpm` et l’utiliser sur toutes les visualisations.

## Wrapper

Créer un composant `CnpmChart` qui gère :

- titre, sous-titre, unité et source ;
- taille responsive ;
- état chargement/vide/erreur ;
- désactivation animation pour tests et réduction mouvement ;
- résumé accessible ;
- table alternative ;
- export si autorisé ;
- resize observer ;
- nettoyage de l’instance.

## Données

Les dates sont ordonnées et les valeurs numériques non formatées dans la série. Les formatters ne contiennent pas de logique métier.

## Tests

- snapshot des options normalisées ;
- test du résumé/table alternative ;
- capture visuelle avec animation `false` ;
- test de redimensionnement ;
- vérification de l’unité et de la période.
