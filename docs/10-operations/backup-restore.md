# Sauvegarde et restauration PostgreSQL

## Stratégie
- Sauvegarde complète régulière et archivage continu des WAL.
- Chiffrement en transit et au repos, copie hors domaine d’administration principal.
- Rétention multi-niveaux à valider avec le CNPM.
- Sauvegarde cohérente du stockage objet et des clés nécessaires.

## Tests
- Restauration technique mensuelle dans un environnement isolé.
- Exercice PITR trimestriel avec validation d’intégrité métier.
- Exercice de restauration complète annuel, incluant documents, IAM et configuration.

## Preuves
Durée, RPO réel, contrôles de cohérence, anomalies et actions correctives sont consignés.
