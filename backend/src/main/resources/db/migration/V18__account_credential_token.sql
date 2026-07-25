-- V18__account_credential_token.sql
--
-- Jeton d'activation et de réinitialisation de mot de passe.
--
-- Jusqu'ici, un compte créé par l'administration naissait sans mot de passe et aucun
-- parcours ne permettait d'en poser un : le compte ne pouvait donc jamais se connecter.
-- Deux exigences normatives l'imposent : l'étape 18 du processus d'enrôlement
-- (« activation du compte […] et invitation au portail ») et PRT-001, qui exige que le
-- membre « puisse récupérer son accès sans intervention manuelle abusive ».
--
-- Principe : le mot de passe ne transite JAMAIS par un tiers. L'administration ne fait
-- qu'émettre un jeton à usage unique et à durée bornée ; c'est le titulaire du compte qui
-- pose son propre secret. Un administrateur ne connaît donc jamais le mot de passe d'un
-- utilisateur, ce qui préserve la non-répudiation de ses actions.
--
-- Le jeton n'est pas stocké : seule son empreinte SHA-256 l'est. Une fuite de la table ne
-- livre donc aucun jeton utilisable. SHA-256 (et non bcrypt) suffit ici parce que le jeton
-- est un aléa de haute entropie, pas un secret choisi par un humain : il n'existe aucun
-- dictionnaire à opposer.

CREATE TABLE iam.account_credential_token (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    user_id uuid NOT NULL,
    purpose varchar(20) NOT NULL,
    token_hash char(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    CONSTRAINT pk_iam_account_credential_token PRIMARY KEY (id),
    CONSTRAINT fk_iam_account_credential_token_user
        FOREIGN KEY (user_id) REFERENCES iam.user_account (id) ON DELETE CASCADE,
    CONSTRAINT ck_iam_account_credential_token_purpose
        CHECK (purpose IN ('ACTIVATION', 'PASSWORD_RESET')),
    -- Un jeton consommé l'est forcément après avoir été émis : une date antérieure
    -- signalerait une horloge ou une écriture fautive plutôt qu'un usage légitime.
    CONSTRAINT ck_iam_account_credential_token_consumed
        CHECK (consumed_at IS NULL OR consumed_at >= created_at)
);

COMMENT ON TABLE iam.account_credential_token IS
    'Jetons à usage unique d''activation et de réinitialisation de mot de passe.';
COMMENT ON COLUMN iam.account_credential_token.purpose IS
    'ACTIVATION (première connexion) ou PASSWORD_RESET (récupération d''accès).';
COMMENT ON COLUMN iam.account_credential_token.token_hash IS
    'Empreinte SHA-256 hexadécimale du jeton ; le jeton lui-même n''est jamais stocké.';
COMMENT ON COLUMN iam.account_credential_token.expires_at IS
    'Fin de validité ; au-delà, le jeton est refusé même s''il n''a pas servi.';
COMMENT ON COLUMN iam.account_credential_token.consumed_at IS
    'Horodatage d''usage ; un jeton consommé ne peut plus resservir.';

-- La recherche se fait toujours par empreinte : l'unicité protège en plus contre une
-- collision d'émission.
CREATE UNIQUE INDEX IF NOT EXISTS uq_iam_account_credential_token_hash
    ON iam.account_credential_token (token_hash);

-- Sert l'invalidation des jetons antérieurs d'un compte lors d'une nouvelle émission.
CREATE INDEX IF NOT EXISTS idx_iam_account_credential_token_user
    ON iam.account_credential_token (user_id, consumed_at);
