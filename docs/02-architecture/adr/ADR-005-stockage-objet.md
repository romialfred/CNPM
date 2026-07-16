# ADR - Documents en stockage objet

- **Statut** : Proposée
- **Date** : 2026-07-15

## Contexte
La plateforme traite des données institutionnelles et financières et doit rester exploitable, auditable et réversible.

## Décision
Conserver les fichiers dans un stockage compatible S3 et leurs métadonnées dans PostgreSQL.

## Justification
Améliore la scalabilité, la réversibilité, le chiffrement et la conservation des versions.

## Conséquences
- Les équipes doivent appliquer cette décision dans le code, les tests et l’exploitation.
- Toute exception requiert un nouvel ADR approuvé.
