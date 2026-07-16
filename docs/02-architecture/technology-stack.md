# Baseline technologique

| Couche | Technologie | Justification | Statut |
|---|---|---|---|
| Architecture | Monolithe modulaire, architecture hexagonale, API-first | Réduction de la complexité initiale, frontières de domaine testables, extraction ultérieure possible. | Cible |
| Backend | Java 25 LTS, Spring Boot 4.1.x, Maven | Robustesse transactionnelle, sécurité et écosystème mature. | À figer au cadrage |
| Web | Angular 22.x, TypeScript strict, Angular Material/CDK | Back-office et portail institutionnel structurés, PWA et accessibilité. | À figer au cadrage |
| Mobile | Flutter 3.44.x, Dart | Socle Android/iOS commun, synchronisation et faible connectivité. | À figer au cadrage |
| Base de données | PostgreSQL 18.x, Flyway, PgBouncer | Source de vérité ACID, intégrité forte, migrations versionnées. | Imposé |
| IAM | Keycloak 26.7.x, OIDC/OAuth 2.0, WebAuthn/TOTP | SSO, 2FA, fédération et contrôle centralisé. | À figer au cadrage |
| Workflow | Flowable 8.0.x, BPMN 2.0/DMN | Processus de validation longs, règles versionnées et compatibilité Spring Boot 4. | Proposé |
| Messagerie | RabbitMQ 4.x | Traitements asynchrones, reprises et files d’erreurs. | Proposé |
| Cache | Valkey 9.1.x | Cache, limitation de débit et verrous courts non métier. | Proposé |
| GED | Stockage objet compatible S3 + antivirus | Documents chiffrés, versionnés, portables et vérifiés. | Proposé |
| Reporting | JasperReports, Apache POI, Apache ECharts, Apache Superset | PDF/Excel officiels, tableaux opérationnels et BI avancée. | Proposé |
| Observabilité | OpenTelemetry, Prometheus, Grafana, Loki, Tempo | Métriques, journaux, traces et alertes corrélées. | Proposé |
| CI/CD | GitLab CI/CD, SonarQube, Trivy, OWASP ZAP | Qualité, sécurité de la chaîne logicielle et déploiements contrôlés. | Proposé |
| Conteneurs | Docker/OCI, Kubernetes ou RKE2 | Portabilité, haute disponibilité et indépendance d’hébergement. | À décider |

## Politique de version

Les versions majeures sont figées après un prototype de compatibilité. Les correctifs de sécurité sont intégrés régulièrement. Toute montée de version majeure suit un ADR, un plan de tests de régression et un plan de retour arrière.
