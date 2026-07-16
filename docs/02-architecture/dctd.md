# Dossier de conception technique détaillée (DCTD)

**Version 1.0 - 15 juillet 2026 - Baseline à valider**

## 1. Objet et portée

Le présent dossier transforme les spécifications fonctionnelles de la plateforme CNPM en décisions d’architecture, contrats techniques, modèle de données, sécurité, exploitation et règles d’exécution pour les équipes et Claude Code. Il ne modifie pas les besoins métier; les points non déterminés sont consignés dans le registre des décisions ouvertes.

## 2. Architecture cible

- Monolithe modulaire Spring Boot, architecture hexagonale et API-first.
- Portail/back-office Angular et application Flutter.
- PostgreSQL comme source de vérité; stockage objet pour les fichiers.
- Keycloak pour identité et 2FA; Flowable pour les processus longs.
- RabbitMQ et outbox pour l’asynchrone; Valkey uniquement comme cache technique.
- Observabilité OpenTelemetry et déploiement conteneurisé.

## 3. Principes non négociables

1. Souveraineté du CNPM sur la relation membre, la validation, la confirmation et les reçus.
2. Immutabilité des écritures financières validées.
3. Idempotence de tous les flux financiers et callbacks.
4. Refus par défaut et séparation des tâches.
5. Traçabilité exigence → story → API/donnée → test.
6. Réversibilité testée et formats ouverts.
7. Design sobre, sans cadres colorés décoratifs.

## 4. Modules

| Code | Module | Exigences | Frontière principale |
|---|---|---:|---|
| ADM | Administration et paramétrage | 5 | Administration |
| MEM | Membres et entreprises | 8 | Membres |
| ENR | Enrôlement et adhésion | 8 | Enrôlement |
| COT | Cotisations et échéanciers | 8 | Cotisations |
| PAY | Paiements et rapprochement | 8 | Paiements |
| REC | Reçus et attestations | 6 | Reçus |
| REL | Recouvrement et relances | 8 | Recouvrement |
| PRT | Portail et application membre | 10 | Portail membre |
| REQ | Requêtes et réclamations | 8 | Services membres |
| GRP | Groupements professionnels | 6 | Groupements |
| PRI | Primes et partage de revenus | 7 | Primes |
| GED | Gestion électronique des documents | 6 | GED |
| EVT | Événements et formations | 4 | Événements |
| BI | Décisionnel et reporting | 8 | Décisionnel |
| SEC | Sécurité et identité | 5 | Sécurité |
| AUD | Audit et conformité | 5 | Audit |
| INT | Intégrations et interopérabilité | 6 | Intégrations |
| DB | PostgreSQL et données | 16 | Données |
| TEC | Architecture technique et exploitation | 12 | Technique |

## 5. Stack technologique

| Couche | Choix | Justification |
|---|---|---|
| Architecture | Monolithe modulaire, architecture hexagonale, API-first | Réduction de la complexité initiale, frontières de domaine testables, extraction ultérieure possible. |
| Backend | Java 25 LTS, Spring Boot 4.1.x, Maven | Robustesse transactionnelle, sécurité et écosystème mature. |
| Web | Angular 22.x, TypeScript strict, Angular Material/CDK | Back-office et portail institutionnel structurés, PWA et accessibilité. |
| Mobile | Flutter 3.44.x, Dart | Socle Android/iOS commun, synchronisation et faible connectivité. |
| Base de données | PostgreSQL 18.x, Flyway, PgBouncer | Source de vérité ACID, intégrité forte, migrations versionnées. |
| IAM | Keycloak 26.7.x, OIDC/OAuth 2.0, WebAuthn/TOTP | SSO, 2FA, fédération et contrôle centralisé. |
| Workflow | Flowable 8.0.x, BPMN 2.0/DMN | Processus de validation longs, règles versionnées et compatibilité Spring Boot 4. |
| Messagerie | RabbitMQ 4.x | Traitements asynchrones, reprises et files d’erreurs. |
| Cache | Valkey 9.1.x | Cache, limitation de débit et verrous courts non métier. |
| GED | Stockage objet compatible S3 + antivirus | Documents chiffrés, versionnés, portables et vérifiés. |
| Reporting | JasperReports, Apache POI, Apache ECharts, Apache Superset | PDF/Excel officiels, tableaux opérationnels et BI avancée. |
| Observabilité | OpenTelemetry, Prometheus, Grafana, Loki, Tempo | Métriques, journaux, traces et alertes corrélées. |
| CI/CD | GitLab CI/CD, SonarQube, Trivy, OWASP ZAP | Qualité, sécurité de la chaîne logicielle et déploiements contrôlés. |
| Conteneurs | Docker/OCI, Kubernetes ou RKE2 | Portabilité, haute disponibilité et indépendance d’hébergement. |

## 6. Données et PostgreSQL

Le modèle comprend **17 schémas**, **73 tables**, **807 colonnes**, **57 clés étrangères** et **287 index décrits**.

Le jeu Flyway de référence est composé de `V1__create_schemas_and_tables.sql`, `V2__add_constraints_and_indexes.sql`, `V3__seed_roles_permissions_and_references.sql` et `V4__protect_append_only_tables.sql`. Il est répliqué dans le squelette backend. Les règles de sauvegarde, PITR, réplication et restauration sont définies dans le dossier d’exploitation.

## 7. API et événements

Le contrat OpenAPI comporte **77 opérations** et le contrat AsyncAPI **10 événements de domaine**. Les contrats précèdent l’implémentation et sont soumis aux tests contractuels.

## 8. Sécurité

Le modèle initial comprend **20 rôles**, **66 permissions** et **8 règles de séparation des tâches**. 2FA, step-up, journalisation et revue d’accès sont obligatoires pour les opérations sensibles.

## 9. UX/UI

Le design system utilise des surfaces blanches, une grille claire, des séparateurs fins et une typographie hiérarchisée. Les grandes cartes colorées, dégradés et ombres lourdes sont interdits. Les maquettes Figma restent à produire/valider avant implémentation définitive.

## 10. DevSecOps et exploitation

Les environnements sont local, développement, test, staging, préproduction, production et PRA. La CI/CD exécute compilation, tests, contrôles contractuels, SAST/SCA, secret scanning, scan d’images, DAST ciblé, SBOM et approbations.

## 11. Tests et recette

Le catalogue initial contient **361 cas de test minimum** : deux scénarios par exigence, un scénario critique supplémentaire pour les 53 exigences financières, de sécurité, de données et d’intégration, et un scénario dédié pour chacune des 20 règles métier transversales. Les tests critiques bloquent la livraison en cas d’échec.

## 12. Claude Code

Le fichier racine `CLAUDE.md` reste concis; les règles spécialisées sont dans `.claude/rules/`, les procédures dans `.claude/skills/`, les revues dans `.claude/agents/` et les garde-fous exécutables dans `.claude/hooks/`.

## 13. Décisions ouvertes

| ID | Sujet | Responsable | Échéance | Impact |
|---|---|---|---|---|
| DEC-001 | Hébergement de production | CNPM + DSI | Avant architecture physique | Élevé |
| DEC-002 | Opérateurs Mobile Money | CNPM Finance | Avant sprint paiement | Critique |
| DEC-003 | Banques et formats de relevé | CNPM Finance | Avant sprint rapprochement | Critique |
| DEC-004 | Prestataires SMS et e-mail | CNPM Communication/DSI | Avant notifications | Moyen |
| DEC-005 | Signature des reçus | CNPM Finance/Juridique | Avant émission officielle | Critique |
| DEC-006 | Durées de conservation | Juridique/DPO | Avant mise en production | Élevé |
| DEC-007 | Interopérabilité INPS | CNPM/INPS | Roadmap Phase 2 | Élevé |
| DEC-008 | Barèmes de cotisation | CNPM Finance | Avant génération d’appels | Critique |
| DEC-009 | Taux de prime et partage | CNPM Direction | Avant module primes | Critique |
| DEC-010 | Distribution mobile | CNPM DSI | Avant bêta mobile | Moyen |
| DEC-011 | SLA de production | CNPM + Prestataire | Contractualisation | Élevé |
| DEC-012 | Périmètre du PoC | Comité de pilotage | Cadrage PoC | Critique |

## 14. Livrables de référence

- `openapi.yaml` et `asyncapi.yaml`
- `schema.sql`, migrations Flyway et dictionnaire de données
- matrice RBAC/SoD
- backlog, traçabilité et catalogue de tests
- processus BPMN
- design system et inventaire écrans
- dossiers sécurité, intégrations, exploitation et réversibilité
- configuration Claude Code et squelettes de code.
