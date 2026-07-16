# Backend Java CNPM

Baseline Spring Boot pour le monolithe modulaire CNPM. Ce dossier contient le point d'entrée, la configuration, les types partagés initiaux et les migrations Flyway V1 à V4 ; il ne constitue pas encore l'implémentation complète des modules métier.

## Prérequis

- Java 25 LTS ;
- Maven 3.9 ou version compatible ;
- PostgreSQL 18 pour les tests d'intégration et l'exécution locale.

## Commande de validation

```bash
mvn -f backend/pom.xml clean verify
```

La CI exécute cette commande dans une image Maven/Java 25. Aucun Maven Wrapper incomplet n'est livré : installer Maven localement ou utiliser le conteneur de CI approuvé.

## Règles de démarrage

- lire `../docs/02-architecture/modules.md` et les ADR ;
- maintenir les frontières hexagonales ;
- générer ou implémenter les contrôleurs à partir de l'OpenAPI après revue du contrat ;
- conserver les entités JPA dans les adaptateurs de persistance ;
- faire de `src/main/resources/db/migration/` l'unique source des migrations ;
- tester chaque migration sur PostgreSQL éphémère avec Testcontainers.
