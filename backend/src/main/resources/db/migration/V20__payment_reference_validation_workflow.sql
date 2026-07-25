-- V20__payment_reference_validation_workflow.sql
--
-- Fait de la référence de paiement une clé de rapprochement PAR COTISANT, validée par la
-- CNPM avant toute diffusion (Lot 2 de la refonte du recouvrement).
--
-- La table payment.payment_reference (V1) portait un canal obligatoire et un statut par
-- défaut 'ACTIVE' — deux choix incompatibles avec le workflow du TDR :
--   * la référence est UNIQUE PAR COTISANT, indépendante du canal : le membre choisit son
--     canal (Orange Money / Wave / MTN / virement) au moment de payer, pas à la génération ;
--   * « NTA ne peut diffuser aucune référence sans validation préalable du CNPM » : une
--     référence naît donc NON diffusable et ne devient exploitable qu'après validation.
--
-- Une migration publiée étant immuable, cette évolution passe par une nouvelle migration
-- plutôt que par la réécriture de V1.

-- Canal facultatif : la référence n'est plus liée à un canal.
ALTER TABLE payment.payment_reference ALTER COLUMN channel DROP NOT NULL;

-- Exercice couvert et horodatage de validation.
ALTER TABLE payment.payment_reference ADD COLUMN exercise integer;
ALTER TABLE payment.payment_reference ADD COLUMN approved_at timestamptz;

-- Normalise les lignes héritées (statut 'ACTIVE' du modèle initial) vers l'état non
-- diffusable : aucune n'a été réellement validée par la CNPM, elles ne peuvent donc pas
-- être présentées comme telles.
UPDATE payment.payment_reference
   SET status = 'PENDING_VALIDATION', approved_by = NULL, approved_at = NULL
 WHERE status NOT IN ('VALIDATED', 'REVOKED');

ALTER TABLE payment.payment_reference ALTER COLUMN status SET DEFAULT 'PENDING_VALIDATION';

ALTER TABLE payment.payment_reference
    ADD CONSTRAINT ck_payment_payment_reference_status
    CHECK (status IN ('PENDING_VALIDATION', 'VALIDATED', 'REVOKED'));

-- Cohérence de la validation : une référence en attente n'a pas de valideur, une référence
-- validée en a forcément un. Une référence révoquée peut avoir été validée auparavant ou non.
ALTER TABLE payment.payment_reference
    ADD CONSTRAINT ck_payment_payment_reference_approval
    CHECK ((status = 'PENDING_VALIDATION' AND approved_by IS NULL AND approved_at IS NULL)
        OR (status = 'VALIDATED' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
        OR (status = 'REVOKED'));

COMMENT ON COLUMN payment.payment_reference.channel IS
    'Canal indicatif éventuel ; la référence n''est pas liée à un canal (choix au paiement).';
COMMENT ON COLUMN payment.payment_reference.exercise IS
    'Exercice de cotisation couvert par la référence.';
COMMENT ON COLUMN payment.payment_reference.status IS
    'PENDING_VALIDATION (non diffusable), VALIDATED (diffusable) ou REVOKED.';
COMMENT ON COLUMN payment.payment_reference.approved_at IS
    'Horodatage de la validation CNPM.';

-- Numérotation lisible et unique des références (CNPM-COT-<exercice>-<séquence>).
CREATE SEQUENCE IF NOT EXISTS payment.payment_reference_number_seq;

-- Une valeur de référence est globalement unique : c'est la clé lue au rapprochement.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_payment_reference_value
    ON payment.payment_reference (reference_value);

-- Un seul jeu de référence vivant par cotisant et par exercice : la révocation libère la place.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_payment_reference_membership_exercise
    ON payment.payment_reference (membership_id, exercise)
    WHERE status <> 'REVOKED';
