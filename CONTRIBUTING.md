# Contribution au projet CNPM

## Branches et pull requests
- Une branche par user story, correction ou migration.
- Toute pull request référence les exigences, décisions, permissions et cas de recette concernés.
- Deux revues sont requises pour les changements financiers, sécurité, IAM, données et migrations.
- Une migration, un contrat OpenAPI/AsyncAPI ou une permission sensible exige une revue spécialisée.

## Commits
Utiliser un format explicite, par exemple :

```text
feat(payment): PAY-003 rapprocher un paiement
fix(member): MEM-014 corriger le filtre par groupement
```

## Definition of Done minimale
- code compilé et linté ;
- tests unitaires et d’intégration réussis ;
- permissions, audit, erreurs et idempotence vérifiés ;
- migration Flyway fournie si nécessaire ;
- contrat API et documentation mis à jour ;
- traçabilité exigence → story → test mise à jour ;
- preuve visuelle, axe et responsive pour une interface ;
- aucune donnée réelle, secret ou vulnérabilité critique introduite.

## Actifs et contenus
Ne pas ajouter un logo, portrait, partenaire, signature, cachet, QR code ou photographie comme actif officiel sans validation écrite et traçable.
