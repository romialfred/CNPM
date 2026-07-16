# Budget de performance UI

## Site public

Objectifs indicatifs au 75e percentile, sous conditions de mesure approuvées :

- LCP < 2,5 s ;
- INP < 200 ms ;
- CLS < 0,1 ;
- JavaScript initial limité et routes lazy-loaded ;
- image hero correctement dimensionnée et priorisée.

## Back-office

- Interaction filtre/table perçue < 300 ms pour données locales ;
- feedback immédiat pour toute action réseau ;
- pagination serveur ;
- export asynchrone au-delà d’un seuil ;
- pas de rechargement complet de page ;
- graphiques rendus seulement lorsqu’ils sont visibles.

## Mobile

- premier écran utilisable rapidement sur réseau lent ;
- cache contrôlé ;
- images compressées ;
- synchronisation en arrière-plan limitée ;
- pas de données massives dans le bundle.

Les budgets sont intégrés au CI lorsque l’infrastructure le permet.
