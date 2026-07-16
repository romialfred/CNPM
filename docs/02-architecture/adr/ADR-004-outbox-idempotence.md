# ADR - Outbox transactionnelle et idempotence

- **Statut** : Acceptée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Enregistrer l’événement dans la même transaction que le changement métier, puis publier de façon asynchrone.

## Justification
Évite les événements perdus et les doubles effets sur les paiements et notifications.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
