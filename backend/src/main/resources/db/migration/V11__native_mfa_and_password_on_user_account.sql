-- V11__native_mfa_and_password_on_user_account.sql
--
-- Refonte du second facteur en 2FA NATIF applicatif (AUTH-DEC-020) : l'application
-- détient désormais le secret TOTP et, à terme, le mot de passe — Keycloak n'est plus
-- requis pour le second facteur. On étend iam.user_account en conséquence.
--
-- Le secret TOTP n'est JAMAIS stocké en clair : mfa_secret_encrypted contient un chiffré
-- AES-GCM (MfaCryptoService). mfa_recovery_code_hashes conserve des empreintes bcrypt de
-- codes de secours mono-usage, jamais les codes eux-mêmes. mfa_last_accepted_step borne le
-- rejeu d'un même pas TOTP.
--
-- keycloak_subject devient facultatif : un compte natif (mot de passe applicatif) peut
-- exister sans sujet Keycloak. La contrainte d'unicité tolère plusieurs NULL (sémantique
-- PostgreSQL standard), donc aucune régression sur les comptes fédérés existants.

ALTER TABLE iam.user_account
    ALTER COLUMN keycloak_subject DROP NOT NULL;

ALTER TABLE iam.user_account
    ADD COLUMN password_hash varchar(255),
    ADD COLUMN mfa_enabled boolean DEFAULT false NOT NULL,
    ADD COLUMN mfa_secret_encrypted varchar(512),
    ADD COLUMN mfa_recovery_code_hashes text,
    ADD COLUMN mfa_last_accepted_step bigint,
    ADD COLUMN mfa_enrolled_at timestamptz;

COMMENT ON COLUMN iam.user_account.password_hash IS
    'Empreinte du mot de passe applicatif (bcrypt/argon2) ; NULL pour un compte fédéré.';
COMMENT ON COLUMN iam.user_account.mfa_enabled IS
    'Second facteur TOTP actif et vérifié.';
COMMENT ON COLUMN iam.user_account.mfa_secret_encrypted IS
    'Secret TOTP chiffré (AES-GCM) ; jamais le secret en clair.';
COMMENT ON COLUMN iam.user_account.mfa_recovery_code_hashes IS
    'Empreintes bcrypt des codes de secours mono-usage, séparées par des retours ligne.';
COMMENT ON COLUMN iam.user_account.mfa_last_accepted_step IS
    'Dernier pas TOTP accepté ; borne le rejeu d''un même code.';
COMMENT ON COLUMN iam.user_account.mfa_enrolled_at IS
    'Horodatage d''activation du second facteur.';
