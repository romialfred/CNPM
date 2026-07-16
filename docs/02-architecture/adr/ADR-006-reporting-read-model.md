# ADR - Modèle de lecture décisionnel

- **Statut** : Proposée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Servir les rapports lourds depuis une réplique ou un schéma de lecture alimenté de manière contrôlée.

## Justification
Préserve la performance transactionnelle et permet des agrégations reproductibles.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
