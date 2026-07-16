# ADR - PostgreSQL comme source de vérité

- **Statut** : Acceptée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Utiliser PostgreSQL comme unique SGBD relationnel de production pour toutes les données métier, financières, d’audit et de configuration.

## Justification
Les transactions ACID, contraintes, réplication et PITR répondent au niveau d’intégrité requis.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
