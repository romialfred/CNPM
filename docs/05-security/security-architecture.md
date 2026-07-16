# Architecture de sécurité

## Identité
- Keycloak centralise OIDC/OAuth 2.0, sessions, fédération et MFA.
- TOTP au minimum pour les rôles sensibles; WebAuthn/passkeys privilégiés pour les administrateurs et valideurs financiers.
- Step-up avant export massif, modification de coordonnées de paiement, validation financière et administration IAM.

## Autorisation
- Refus par défaut, RBAC avec périmètre organisation/groupement et attributs contextuels.
- Contrôle côté backend sur chaque cas d’usage; aucun droit implicite lié à un profil technique.
- Revue trimestrielle des comptes sensibles et revue semestrielle de tous les accès.

## Protection des données
- TLS moderne, chiffrement des sauvegardes et du stockage objet.
- Secrets dans un coffre-fort; rotation, double contrôle et accès audité.
- Masquage des données sensibles dans les interfaces, exports et journaux.

## Applications
- Validation des entrées, encodage des sorties, CSP, protection CSRF selon mode d’authentification, CORS restrictif.
- Téléversements isolés, limite de taille, vérification de signature, antivirus et promotion après résultat sûr.
- SBOM, analyse SAST/SCA/secret/container/IaC et tests DAST avant mise en production.

## Audit
- Événements append-only avec identité, action, objet, horodatage, résultat, corrélation et empreintes avant/après.
- Alertes sur élévation de privilège, échec MFA, export massif, modification financière et rejeu de webhook.
