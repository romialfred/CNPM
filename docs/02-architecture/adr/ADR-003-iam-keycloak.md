# ADR - IAM centralisé avec Keycloak

- **Statut** : Proposée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Centraliser OIDC/OAuth 2.0, 2FA, sessions et fédération dans Keycloak.

## Justification
Évite une implémentation propriétaire de l’authentification et sépare identité et autorisation métier.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
