# Catalogue des erreurs

| Code | HTTP | Signification |
|---|---:|---|
| `AUTHENTICATION_REQUIRED` | 401 | Authentification absente ou expirée. |
| `MFA_REQUIRED` | 401 | Authentification renforcée requise. |
| `FORBIDDEN` | 403 | Permission ou périmètre insuffisant. |
| `RESOURCE_NOT_FOUND` | 404 | Ressource introuvable. |
| `VALIDATION_ERROR` | 400 | Format ou champ invalide. |
| `BUSINESS_RULE_VIOLATION` | 422 | Règle métier non satisfaite. |
| `STATE_CONFLICT` | 409 | État incompatible avec l’opération. |
| `IDEMPOTENCY_CONFLICT` | 409 | Même clé avec une charge utile différente. |
| `DUPLICATE_PAYMENT` | 409 | Paiement déjà traité. |
| `PAYMENT_NOT_CONFIRMED` | 422 | Confirmation CNPM requise. |
| `RECEIPT_ALREADY_ISSUED` | 409 | Reçu déjà émis. |
| `SOD_VIOLATION` | 403 | Séparation des tâches non respectée. |
| `FILE_REJECTED` | 422 | Fichier invalide ou non sûr. |
| `RATE_LIMITED` | 429 | Limite d’appels dépassée. |
| `DEPENDENCY_UNAVAILABLE` | 503 | Service partenaire indisponible. |
| `INTERNAL_ERROR` | 500 | Erreur interne non détaillée au client. |

Toutes les réponses incluent `correlationId`. Les messages externes ne contiennent ni stack trace, ni secret, ni donnée bancaire complète.
