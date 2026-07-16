# Stratégie de tests

## Pyramide
- Tests de domaine rapides pour les règles et invariants.
- Tests d’intégration avec PostgreSQL réel via Testcontainers.
- Tests contractuels OpenAPI et partenaires simulés.
- Tests E2E ciblés sur les parcours critiques.
- Tests manuels de recette, accessibilité et exploitation.

## Axes obligatoires
Fonctionnel, permissions, SoD, audit, idempotence, concurrence, migration, performance, sécurité, accessibilité, faible connectivité, sauvegarde/restauration et réversibilité.

## Seuils
La couverture de lignes n’est pas un objectif isolé. Les modules paiement, cotisation, reçu, prime, IAM et audit doivent couvrir 100 % des règles critiques et tous les scénarios d’erreur définis.

## Catalogue minimum
La baseline comporte 361 cas de test : 288 scénarios nominaux et de contrôle pour les 144 exigences, 53 scénarios critiques supplémentaires pour les domaines paiement, reçus, primes, sécurité, audit, données et intégrations, et 20 scénarios consacrés aux règles métier transversales. Le catalogue CSV et le classeur de recette utilisent les mêmes identifiants.
