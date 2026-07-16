# Plan d’exécution recommandé

## R0 — Fondations techniques et qualité

- Confirmer la stack cible et exécuter le backend sous Java 25/Maven 3.9.
- Conserver le socle Angular validé sous Node 24.15.0 ; finaliser Flutter, générer les runners natifs et `pubspec.lock`.
- Mettre en place CI/CD, contrôles de dépendances, SBOM et analyse de secrets.
- Démarrer PostgreSQL/Flyway, Keycloak, RabbitMQ, Valkey et stockage objet local.
- Poser l’architecture modulaire, l’audit, l’observabilité et les données synthétiques.
- Utiliser les tokens, Playwright et axe-core ; ajouter Storybook seulement après validation d’une version compatible Angular 22/TypeScript 6.
- Implémenter `AUTH-001`, `PUB-001`, `PUB-006` et `BO-002` comme écrans pilotes.

## R1 — Référentiel membres et enrôlement

- Membres, entreprises, contacts, groupements et documents.
- Enrôlement, validation, historique et habilitations.
- Portail membre : profil, documents et préférences.

## R2 — Cotisations, paiements et reçus

- Barèmes validés, appels, échéanciers et régularisations.
- Mobile Money, virements, caisse, rapprochement et anomalies.
- Confirmation CNPM, reçus officiels, QR de vérification et archivage.

## R3 — Recouvrement, requêtes et primes

- Campagnes multicanales, relances, affectation des agents et suivi.
- Requêtes, réclamations, SLA, pièces jointes et notifications.
- Primes de mobilisation et partage de revenus après validation des taux.

## R4 — Vitrines publiques et services membres

- Promouvoir `docs/12-member-showcase/api-addendum.yaml` dans l’OpenAPI canonique selon `promotion-checklist.md`.
- Ajouter migrations, permissions, événements, traçabilité et tests du module vitrine.
- Site public CNPM, annuaire et fiche publique.
- Éditeur de vitrine membre, aperçu, modération, publication et analytics.
- Actualités, événements, formations et services aux membres.

## R5 — Décisionnel, mobile et déploiement élargi

- Tableaux de bord, exports et alertes décisionnelles.
- Parcours mobiles prioritaires et faible connectivité.
- Migration des données, PoC, recette, performance, sécurité et PRA.

## Règle de planification

Chaque lot part des stories approuvées, ferme les décisions bloquantes, définit ses preuves de recette et met à jour contrats, migrations, documentation et traçabilité dans la même pull request.
