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

### Base de données locale (poste de développement)

Le projet pointe par défaut sur `jdbc:postgresql://localhost:5432/CNPM_DB` avec l’utilisateur
`app_user` (PostgreSQL 18, administré via PGAdmin). Le rôle applicatif doit pouvoir se connecter
**et** créer les 17 schémas métier (Flyway). À exécuter une fois, en superutilisateur `postgres`
dans PGAdmin (Query Tool) — remplacer le mot de passe par le vôtre :

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'change-me';
  ELSE
    ALTER ROLE app_user WITH LOGIN PASSWORD 'change-me';
  END IF;
END $$;
ALTER DATABASE "CNPM_DB" OWNER TO app_user;   -- permet à Flyway de créer les schémas
```

### Procédure

1. Vérifier que PostgreSQL tourne (5432) et que la base `CNPM_DB` existe ; appliquer le bloc SQL
   ci-dessus pour garantir l’accès de `app_user`. Flyway applique ensuite les migrations (dont
   `V11__native_mfa_and_password_on_user_account.sql`) au premier démarrage.
2. Renseigner les secrets et l’amorçage dans le lanceur local **non versionné**
   `run-backend-local.ps1` (`DATABASE_PASSWORD`, `APP_JWT_SECRET`, `MFA_ENCRYPTION_KEY`,
   `CNPM_BOOTSTRAP_ADMIN_EMAIL/PASSWORD`, `RABBITMQ_DEFAULT_USER/PASS`). RabbitMQ n’est pas requis
   pour tester le login : sa santé restera `DOWN` sans bloquer les endpoints `/auth/**`.
3. Lancer : `powershell -ExecutionPolicy Bypass -File .\run-backend-local.ps1`. Le script
   construit le jar au besoin puis démarre le backend avec `-Dcnpm.security.native-jwt.enabled=true`.
   Le super-admin natif est amorcé s’il est absent.
4. Basculer le web en mode HTTP : dans `web/public/runtime-config.js`, mettre `dataMode: 'http'`
   et `baseUrl` vers le préfixe d’API du backend (`/v1` derrière un proxy, sinon l’URL absolue).
5. Ouvrir l’application, se connecter avec l’e-mail et le mot de passe amorcés.

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
