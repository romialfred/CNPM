# ADR - Monolithe modulaire comme architecture initiale

- **Statut** : Acceptée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Adopter un déploiement applicatif principal unique, structuré en modules métier fortement isolés.

## Justification
Le PoC et la taille initiale ne justifient pas la complexité opérationnelle des microservices. Les frontières et événements permettent une extraction future.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
