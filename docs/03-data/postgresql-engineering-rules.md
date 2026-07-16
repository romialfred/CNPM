# Règles d’ingénierie PostgreSQL

## Modélisation
- Nommer en anglais technique, `snake_case`, schémas par domaine.
- Ne pas utiliser JSONB pour une relation connue ou un montant critique.
- Ajouter `NOT NULL`, `CHECK`, `UNIQUE` et clés étrangères dès que la règle est stable.
- Les valeurs d’état restent contrôlées par le domaine et versionnées.

## Transactions et concurrence
- Transactions courtes au niveau service applicatif.
- Verrouillage optimiste par colonne `version`; verrou explicite seulement sur les agrégats financiers critiques.
- Idempotence garantie par contrainte unique, pas uniquement par recherche applicative.
- Aucun traitement réseau long dans une transaction PostgreSQL.

## Performance
- Requêtes paginées; index motivés par des requêtes réelles.
- Analyse `EXPLAIN (ANALYZE, BUFFERS)` pour les parcours critiques.
- Partitionner les gros journaux par date uniquement après seuils mesurés.
- Reporting lourd sur réplique ou modèle de lecture contrôlé.

## Exploitation
- Sauvegardes chiffrées, archivage WAL et restauration PITR testée.
- Supervision de la taille, réplication, verrous, autovacuum, connexions et requêtes lentes.
- Migrations compatibles rolling deployment lorsqu’une haute disponibilité est exigée.
