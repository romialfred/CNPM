# Exigences de sécurité

## Identité et authentification
- OIDC Authorization Code avec PKCE pour Web et mobile.
- 2FA obligatoire pour tous les rôles sensibles ; WebAuthn privilégié, TOTP accepté.
- Step-up authentication avant export complet, annulation financière, réinitialisation 2FA et attribution de rôle privilégié.
- Sessions courtes pour les profils privilégiés, révocation centralisée et rotation des jetons.

## Autorisation
- RBAC côté backend, complété par le périmètre organisationnel ou groupement.
- Refus par défaut ; aucune confiance dans les paramètres envoyés par le client.
- Séparation des tâches appliquée au niveau métier et testée.
- Revues d’accès trimestrielles et immédiates lors d’un départ ou changement de fonction.

## Données
- TLS 1.2 minimum, TLS 1.3 privilégié.
- Chiffrement au repos pour volumes, sauvegardes, stockage objet et secrets.
- Classification des données et masquage dans les interfaces, journaux et exports.
- Données de production interdites en développement et test sans anonymisation irréversible.

## Application
- Validation de schéma, limitation de taille, encodage de sortie et requêtes paramétrées.
- Protection CSRF lorsque les cookies sont utilisés, CSP restrictive, CORS explicite et en-têtes de sécurité.
- Téléversements contrôlés : taille, MIME, extension, signature, quarantaine et antivirus.
- Limitation de débit, anti-bruteforce et détection d’anomalies.

## Chaîne logicielle
- SBOM, dépendances verrouillées, analyse SAST/SCA, scans d’images et DAST avant production.
- Signature des artefacts et traçabilité de build.
- Aucune image `latest` en production.

## Audit et réponse
- Audit immuable, horodaté, corrélé et exportable.
- Alertes sur attribution de rôle, échec 2FA, export massif, dérogation, annulation et restauration.
- Procédure d’incident testée au moins annuellement.
