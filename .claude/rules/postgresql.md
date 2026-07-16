---
paths:
  - "backend/src/main/resources/db/migration/**/*.sql"
  - "docs/03-data/**/*.md"
  - "backend/**/*Repository*.java"
---
# PostgreSQL
- Utiliser les schémas et conventions du dictionnaire de données.
- Une migration publiée est immuable ; corriger par une nouvelle migration.
- Ajouter contraintes, index et commentaires de colonnes avec le changement métier.
- Utiliser `numeric`, `timestamptz`, UUID et clés étrangères.
- Les requêtes critiques doivent être couvertes par `EXPLAIN (ANALYZE, BUFFERS)` en environnement de test.
- Ne jamais utiliser JSONB pour masquer un modèle relationnel connu.
