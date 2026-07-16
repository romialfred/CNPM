---
name: security-review
description: Réaliser une revue de sécurité CNPM d’un changement, d’une story ou d’une pull request.
disable-model-invocation: false
---
# Security Review

Examiner le changement selon `docs/05-security/security-requirements.md`, `docs/05-security/threat-model.md`, la matrice RBAC et la séparation des tâches.

Vérifier au minimum : authentification, autorisation côté serveur, 2FA, secrets, journalisation, audit, fichiers, exports, données personnelles, idempotence, entrées externes et dépendances. Classer les constats en bloquants, majeurs et mineurs. Ne corriger aucune décision de sécurité silencieusement.
