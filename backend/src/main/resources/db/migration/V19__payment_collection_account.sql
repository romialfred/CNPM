-- V19__payment_collection_account.sql
--
-- Comptes d'encaissement de la CNPM (« comptes collecteurs »).
--
-- Le TDR impose que le cotisant paie DEPUIS SON PROPRE COMPTE vers les coordonnées
-- d'encaissement de la CNPM (numéro Orange Money, Wave, MTN, ou compte bancaire), en citant
-- sa référence de paiement. Ces coordonnées n'existaient nulle part dans le modèle : sans
-- elles, aucun parcours de paiement ni aucun rapprochement n'est possible. Cette table les
-- porte, sous le contrôle exclusif de la CNPM.
--
-- Garde-fou du TDR : « NTA ne peut communiquer aucune coordonnée bancaire sans validation
-- préalable du CNPM ». Un compte naît donc en 'DRAFT' et n'est diffusable qu'une fois validé
-- par un SECOND agent (séparation des tâches) : le passage à 'ACTIVE' porte son valideur et
-- sa date. Seul un compte 'ACTIVE' pourra être proposé au paiement.
--
-- Ces coordonnées ne sont pas des secrets : elles ont vocation à être montrées au payeur.
-- Elles ne sont donc pas chiffrées, mais leur diffusion reste gouvernée par la validation.

CREATE TABLE payment.collection_account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamptz DEFAULT now() NOT NULL,
    updated_by uuid,
    version bigint DEFAULT 0 NOT NULL,
    channel varchar(30) NOT NULL,
    label varchar(120) NOT NULL,
    account_holder varchar(160) NOT NULL,
    account_identifier varchar(120) NOT NULL,
    bank_name varchar(120),
    instructions text,
    status varchar(30) DEFAULT 'DRAFT' NOT NULL,
    approved_by uuid,
    approved_at timestamptz,
    CONSTRAINT pk_payment_collection_account PRIMARY KEY (id),
    CONSTRAINT ck_payment_collection_account_channel
        CHECK (channel IN ('ORANGE_MONEY', 'WAVE', 'MTN_MONEY', 'BANK_TRANSFER')),
    CONSTRAINT ck_payment_collection_account_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'DISABLED')),
    -- Un compte validé (ACTIVE ou, plus tard, DISABLED) porte forcément son valideur et sa
    -- date ; un brouillon n'en a aucun. La séparation des tâches se vérifie côté service.
    CONSTRAINT ck_payment_collection_account_approval
        CHECK ((status = 'DRAFT' AND approved_by IS NULL AND approved_at IS NULL)
            OR (status <> 'DRAFT' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)),
    -- Le nom de la banque n'a de sens que pour un virement ; il est exigé dans ce seul cas.
    CONSTRAINT ck_payment_collection_account_bank
        CHECK (channel <> 'BANK_TRANSFER' OR bank_name IS NOT NULL)
);

COMMENT ON TABLE payment.collection_account IS
    'Coordonnées d''encaissement de la CNPM par canal, diffusables après validation à quatre yeux.';
COMMENT ON COLUMN payment.collection_account.channel IS
    'ORANGE_MONEY, WAVE, MTN_MONEY ou BANK_TRANSFER.';
COMMENT ON COLUMN payment.collection_account.label IS
    'Libellé lisible du compte (ex. « Compte principal CNPM »).';
COMMENT ON COLUMN payment.collection_account.account_holder IS
    'Titulaire déclaré du compte d''encaissement.';
COMMENT ON COLUMN payment.collection_account.account_identifier IS
    'Numéro Mobile Money ou IBAN/numéro de compte présenté au payeur.';
COMMENT ON COLUMN payment.collection_account.bank_name IS
    'Banque, pour le seul canal BANK_TRANSFER.';
COMMENT ON COLUMN payment.collection_account.instructions IS
    'Consignes de paiement facultatives affichées au cotisant.';
COMMENT ON COLUMN payment.collection_account.status IS
    'DRAFT (non diffusable), ACTIVE (diffusable), DISABLED (retiré).';
COMMENT ON COLUMN payment.collection_account.approved_by IS
    'Second agent ayant validé la diffusion ; distinct du créateur.';
COMMENT ON COLUMN payment.collection_account.approved_at IS
    'Horodatage de la validation CNPM.';

-- Interdit d'enregistrer deux fois le même numéro sur le même canal : garantit
-- l'idempotence métier de la création et évite les doublons de coordonnées.
CREATE UNIQUE INDEX uq_payment_collection_account_channel_identifier
    ON payment.collection_account (channel, account_identifier);

-- Sert la sélection des comptes diffusables d'un canal au moment du paiement.
CREATE INDEX idx_payment_collection_account_channel_status
    ON payment.collection_account (channel, status);
