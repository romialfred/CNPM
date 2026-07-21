# Runbook d’exploitation

## Authentification native (AUTH-DEC-020)

Connexion de bout en bout via l’application, sans Keycloak (le 2FA est natif : TOTP RFC 6238,
enrôlement forcé à la première connexion). À utiliser pour brancher un compte réel.

### Variables d’environnement du backend

| Variable | Rôle | Notes |
| --- | --- | --- |
| `APP_JWT_SECRET` | Clé HMAC du jeton applicatif (HS256). | Obligatoire hors profil `dev`/`test`/`local` (fail-closed). ≥ 32 octets. Ne jamais committer. |
| `MFA_ENCRYPTION_KEY` | Clé AES-GCM chiffrant le secret TOTP en base. | Obligatoire hors profil `dev`/`test`/`local` (fail-closed). Ne jamais committer. |
| `DATABASE_URL` / `DATABASE_USER` / `DATABASE_PASSWORD` | Accès PostgreSQL (Flyway migre au démarrage). | Défaut `jdbc:postgresql://localhost:5432/cnpm`. |
| `CNPM_BOOTSTRAP_ADMIN_EMAIL` | Amorce un super-admin natif si le compte est absent. | Idempotent ; sans ces variables l’amorçage se désactive. |
| `CNPM_BOOTSTRAP_ADMIN_PASSWORD` | Mot de passe du compte amorcé (bcrypt en base). | Fourni au démarrage uniquement, jamais dans le dépôt ni les logs. |
| `CNPM_BOOTSTRAP_ADMIN_NAME` / `CNPM_BOOTSTRAP_ADMIN_ROLE` | Libellé et rôle du compte amorcé. | Défauts : « Super administrateur » / `SUPER_ADMIN_TECH`. |

### Propriétés Spring

- `cnpm.security.native-jwt.enabled=true` : le resource-server valide le jeton natif HS256
  (`NativeJwtDecoderConfig`) ; l’auto-configuration `issuer-uri` de Keycloak se retire.
- **Laisser `cnpm.security.jwt.expected-audiences` non défini** en mode natif : sinon
  `JwtValidationConfig` publie un second `JwtDecoder` (issuer Keycloak) et le contexte échoue.

### Procédure

1. Démarrer PostgreSQL et créer la base `cnpm` (Flyway applique les migrations, dont
   `V11__native_mfa_and_password_on_user_account.sql`, au premier démarrage).
2. Exporter les variables ci-dessus (au minimum `APP_JWT_SECRET`, `MFA_ENCRYPTION_KEY`,
   `CNPM_BOOTSTRAP_ADMIN_EMAIL`, `CNPM_BOOTSTRAP_ADMIN_PASSWORD`) puis lancer le backend avec
   `-Dcnpm.security.native-jwt.enabled=true`. Le compte super-admin est amorcé s’il est absent.
3. Basculer le web en mode HTTP : dans `web/public/runtime-config.js`, mettre `dataMode: 'http'`
   et `baseUrl` vers le préfixe d’API du backend (`/v1` derrière un proxy, sinon l’URL absolue).
4. Ouvrir l’application, se connecter avec l’e-mail et le mot de passe amorcés.

### Comportement attendu du parcours

- `POST /auth/login` : identifiants valides + 2FA non enrôlé → `428 MFA_ENROLLMENT_REQUIRED`
  (+ `challenge`) → l’UI ouvre l’enrôlement forcé. Identifiants valides + 2FA déjà enrôlé →
  `428 MFA_REQUIRED`. Mauvais identifiants → `401 INVALID_CREDENTIALS` (message neutre).
  Compte sans rôle → `403 NO_ROLE_ASSIGNED`.
- Enrôlement : `POST /auth/mfa/enroll/start` rend `manualKey` + `otpAuthUri` (QR scannable par
  Microsoft/Google Authenticator) ; `POST /auth/mfa/enroll/confirm` valide le code, renvoie le
  jeton applicatif et les codes de secours à usage unique.
- Connexions suivantes : `POST /auth/mfa/verify` valide le code et renvoie le jeton applicatif.
- Le jeton est détenu en mémoire (`NativeSessionStore`), injecté par l’intercepteur Bearer, et
  purgé à la déconnexion. Le 2FA est obligatoire pour tous ; seul le super-admin peut le désactiver.

## Incidents courants
- callback de paiement en échec : vérifier signature, idempotence, file d’erreur et rejouer via l’outil contrôlé ;
- rapprochement bloqué : analyser doublon, montant, référence et règle de score ;
- reçu non émis : vérifier confirmation, outbox, stockage objet et signature ;
- file RabbitMQ en croissance : mesurer consommateurs, poison messages et dépendance externe ;
- réplication PostgreSQL en retard : contrôler WAL, réseau, stockage et requêtes longues ;
- Keycloak indisponible : appliquer le runbook IAM et interdire tout contournement local.

Chaque action de production doit être nominative, datée, approuvée lorsque sensible et liée à un ticket.
