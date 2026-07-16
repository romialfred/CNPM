# Conventions PostgreSQL

## Nommage
- schémas, tables, colonnes et contraintes en `snake_case` anglais ;
- clé primaire `id` de type UUID ;
- clés étrangères nommées `<entity>_id` ;
- horodatages `created_at`, `updated_at`, dates métier explicites ;
- contraintes `pk_`, `fk_`, `uq_`, `ck_` et index `idx_`.

## Types
- `numeric(19,2)` pour les montants ;
- `char(3)` pour ISO 4217 ;
- `timestamptz` pour tout événement temporel ;
- `date` pour les dates civiles sans heure ;
- `inet` pour les adresses IP ;
- `jsonb` uniquement pour métadonnées validées ;
- `text` plutôt que longueur arbitraire pour contenu long.

## Requêtes
- requêtes paramétrées ;
- pagination bornée ;
- index justifié par un cas d’usage ;
- `EXPLAIN (ANALYZE, BUFFERS)` sur les requêtes critiques ;
- aucune logique financière masquée dans une requête ad hoc non testée.

## Migrations
- migrations Flyway immuables ;
- changement compatible en plusieurs étapes pour les colonnes obligatoires ;
- création d’index lourds avec stratégie adaptée à la production ;
- script de contrôle et plan de retour opérationnel pour chaque migration risquée.
