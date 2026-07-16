---
paths:
  - "backend/**/*.java"
  - "backend/**/pom.xml"
---
# Backend Java
- Utiliser Java 25, types explicites et nullité contrôlée.
- Organiser chaque module en `domain`, `application`, `adapter.in`, `adapter.out`.
- Les entités JPA ne franchissent pas les frontières d’API.
- Valider les entrées au bord du système et les invariants dans le domaine.
- Les transactions sont déclarées dans les services applicatifs.
- Utiliser Testcontainers pour PostgreSQL, RabbitMQ et Keycloak lorsque nécessaire.
- Interdire les requêtes N+1 et tout chargement non borné.
