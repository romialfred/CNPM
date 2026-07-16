# Règles d’API

- OpenAPI 3.1 et JSON UTF-8.
- Préfixe `/api/v1` et version majeure explicite.
- Ressources au pluriel, identifiants UUID, références métier exposées séparément.
- Pagination par `page`, `size`, `sort`, maximum serveur fixé.
- Filtrage explicite et listes blanches de champs de tri.
- `Idempotency-Key` obligatoire pour créations sensibles et paiements.
- `X-Correlation-Id` accepté et renvoyé ; généré s’il manque.
- Erreurs au format `ProblemDetails` métier.
- Concurrence optimiste via ETag/If-Match pour les agrégats modifiables.
- Webhooks signés, horodatés et protégés contre le rejeu.
- Les permissions sont documentées par `x-required-permission` et contrôlées côté serveur.
