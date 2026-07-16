# Conventions API

- Préfixe `/v1`; HTTPS obligatoire.
- JSON UTF-8, dates RFC 3339 UTC, montants sous forme décimale chaîne + code ISO 4217.
- Pagination `page`/`size`, taille maximale 100; filtres explicitement documentés.
- `X-Correlation-Id` propagé de bout en bout.
- `Idempotency-Key` obligatoire pour créations sensibles, paiements, callbacks et exports.
- Contrôle OIDC et permissions serveur; le frontend n’est jamais une frontière de sécurité.
- Erreurs `application/problem+json` avec code stable.
- Compatibilité descendante dans une version; rupture via nouvelle version et calendrier de dépréciation.
- Limitation de débit par client, utilisateur et endpoint; seuils validés au cadrage.
