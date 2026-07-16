# CNPM Digital Platform

## Mission
Construire la plateforme Web et mobile du Conseil National du Patronat du Mali conformément aux sources de vérité du dépôt. Ne jamais inventer une règle métier, un taux, une permission, un partenaire, une donnée officielle ou un actif de marque.

## Ordre de lecture
1. `START_HERE.md`
2. `docs/00-governance/source-of-truth.md`
3. `docs/00-governance/open-decisions.md`
4. La user story et ses critères dans `docs/01-product/`
5. Les documents spécialisés concernés : architecture, données, API, sécurité, processus et tests
6. Pour toute interface : `docs/ui-handoff/START_HERE.md`, tokens, catalogue de composants et fiche écran

En cas de contradiction, arrêter la modification, consigner la divergence dans `docs/00-governance/open-decisions.md` et demander un arbitrage.

## Sources normatives principales
- TDR : `docs/00-sources/TDR_NTA_Digitalisation_Cotisations_CNPM.pdf`
- Spécifications : `docs/00-sources/Specifications_Fonctionnelles_CNPM_v1.1.pdf`
- DCTD : `docs/02-architecture/CNPM_DCTD_v1.0.pdf`
- API : `docs/04-api/openapi.yaml` et `docs/04-api/asyncapi.yaml`
- Données : `docs/03-data/data-model.md` et migrations Flyway du backend
- Sécurité : `docs/05-security/`
- Backlog et recette : `docs/01-product/` et `docs/09-testing/`
- UI/UX : `docs/ui-handoff/`
- Vitrine membre R4 : `docs/12-member-showcase/` (addendum de conception à promouvoir dans les contrats canoniques avant implémentation)

## Stack cible
- Backend : Java 25 LTS, Spring Boot 4.1.x, Maven.
- Web : Angular 22.x, TypeScript strict.
- Mobile : Flutter 3.44.x et Dart.
- Données : PostgreSQL 18.x exclusivement, Flyway et PgBouncer.
- IAM : Keycloak, OIDC/OAuth 2.0, TOTP et WebAuthn.
- Asynchrone : RabbitMQ ; cache technique : Valkey.
- Documents : stockage objet compatible S3 avec analyse antivirus.

## Architecture
- Monolithe modulaire et architecture hexagonale.
- Respecter `docs/02-architecture/modules.md` et les ADR acceptés.
- Aucun module ne lit directement les tables privées d’un autre module.
- Aucun contrôleur ne contient de logique métier.
- Les intégrations externes restent derrière des ports et adaptateurs.
- Les événements métier fiables utilisent une outbox transactionnelle.

## PostgreSQL
- Toute évolution de schéma passe par `backend/src/main/resources/db/migration/`.
- Utiliser `numeric(19,2)` pour les montants et `timestamptz` pour les horodatages.
- Ne jamais utiliser `float` ou `double` pour un montant.
- Ne jamais modifier ou supprimer une écriture financière validée ; utiliser une écriture compensatrice.
- Clés techniques UUID, références métier distinctes et uniques.
- JSONB uniquement pour des métadonnées non critiques et schématisées.
- Contraintes PostgreSQL pour toute intégrité connue ; traitements financiers idempotents.

## Sécurité
- Vérifier authentification, permission et périmètre côté backend.
- 2FA obligatoire pour les rôles sensibles.
- Ne jamais journaliser mot de passe, jeton, secret, OTP ou charge bancaire complète.
- Aucune donnée réelle de membre dans les tests, fixtures ou captures.
- Toute action sensible produit un événement d’audit corrélé.
- Respecter RBAC et séparation des tâches dans `docs/05-security/`.

## API
- Le contrat OpenAPI précède l’implémentation.
- Utiliser les erreurs normalisées et un `correlationId`.
- Clé d’idempotence pour créations et callbacks sensibles.
- Paginer les collections, borner les exports et versionner toute rupture.

## UI/UX
- Les tokens et spécifications de `docs/ui-handoff/` sont normatifs.
- Surfaces blanches ou neutres ; aucun grand cadre coloré décoratif, glassmorphism ou ombre lourde.
- Bleu `#273481` principal ; rouge `#E40C20` réservé aux accents, CTA publics et actions critiques.
- Réutiliser les composants du design system ; aucune couleur ou valeur d’espacement arbitraire dans une feature.
- Prévoir chargement, vide, aucun résultat, erreur, accès refusé, succès, hors ligne et synchronisation.
- WCAG 2.2 AA, clavier, focus visible, zoom 200 %, reflow et statut jamais transmis par la couleur seule.
- Les PNG sont directionnels ; les tokens et fiches écran priment.

## Workflow obligatoire
1. Identifier la story, l’écran et les sources applicables.
2. Vérifier décisions ouvertes, règles métier, permissions, données, API, audit, erreurs et tests.
3. Proposer un plan bref avant toute modification structurante.
4. Implémenter par incréments testables avec données déterministes.
5. Mettre à jour code, contrat, migration, documentation et traçabilité dans la même modification.
6. Exécuter les contrôles applicables et signaler honnêtement tout contrôle non exécuté.

## Commandes
- Validation du dépôt : `bash scripts/validate-pack.sh`
- OpenAPI : `bash scripts/validate-openapi.sh`
- Backend : `mvn -f backend/pom.xml clean verify`
- Web : `cd web && npm ci && npm run lint && npm test -- --watch=false && npm run build`
- Mobile : `cd mobile && flutter pub get && flutter analyze && flutter test`
- Infrastructure : `docker compose --env-file .env -f infrastructure/docker/compose.yaml config`

## Interdictions
- Ne pas modifier `docs/00-sources/`.
- Ne pas contourner Flyway, RBAC, 2FA, audit ou validation métier.
- Ne pas ajouter une dépendance sans justification, licence compatible et revue.
- Ne pas utiliser d’image de conteneur `latest` en production.
- Ne pas modifier une baseline visuelle pour masquer un défaut.
- Ne pas déployer, supprimer des données ou lancer une restauration sans approbation humaine explicite.
