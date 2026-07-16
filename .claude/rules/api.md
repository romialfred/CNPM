---
paths:
  - "docs/04-api/**/*.yaml"
  - "backend/**/*Controller*.java"
---
# API
- Contract-first : modifier OpenAPI et tests avant ou avec l’implémentation.
- Réponses d’erreur normalisées, sans stack trace ni secret.
- Pagination obligatoire ; limites maximales côté serveur.
- Clé d’idempotence sur paiements, webhooks, exports et créations sensibles.
- Un changement incompatible exige une nouvelle version ou une période de dépréciation.
