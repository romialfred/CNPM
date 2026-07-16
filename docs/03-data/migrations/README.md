# Migrations Flyway — emplacement canonique

Les migrations exécutables se trouvent exclusivement dans :

```text
backend/src/main/resources/db/migration/
```

Ce dossier documentaire ne doit pas contenir de copie des scripts SQL afin d’éviter les divergences. Toute nouvelle migration est créée dans le dossier backend, puis référencée dans le modèle de données et la traçabilité.
