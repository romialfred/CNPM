-- V23__reconciliation_matched_reference.sql
--
-- Donne au cas de rapprochement le lien direct vers la référence appariée, et borne ses états.
--
-- Le rapprochement automatique (Lot 5) lit la référence de paiement dans le libellé d'une ligne
-- de relevé et l'apparie au cotisant. Le cas doit donc porter la référence retrouvée : pour
-- l'afficher à l'agent, et pour créer l'encaissement à la confirmation. La table
-- reconciliation_case existait sans ce lien.
--
-- L'appariement livré ici est EXACT (par référence) : le score vaut 100 et aucun seuil de
-- confiance n'entre en jeu. L'appariement flou par montant — qui, lui, dépend des seuils encore
-- à trancher (FIN-DEC-001) — n'est pas activé ; les lignes sans référence exploitable restent
-- « non rapprochées » pour un traitement manuel.

ALTER TABLE payment.reconciliation_case ADD COLUMN matched_reference_id uuid;

ALTER TABLE payment.reconciliation_case
    ADD CONSTRAINT fk_payment_reconciliation_case_matched_reference
    FOREIGN KEY (matched_reference_id) REFERENCES payment.payment_reference (id) ON DELETE SET NULL;

-- États du cas : proposé (appariement à confirmer), confirmé (encaissement créé), rejeté, ou
-- non rapproché (aucune référence exploitable).
ALTER TABLE payment.reconciliation_case
    ADD CONSTRAINT ck_payment_reconciliation_case_status
    CHECK (status IN ('PROPOSED', 'CONFIRMED', 'REJECTED', 'UNMATCHED'));

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_case_matched_reference
    ON payment.reconciliation_case (matched_reference_id);

COMMENT ON COLUMN payment.reconciliation_case.matched_reference_id IS
    'Référence de paiement appariée par lecture du libellé ; NULL si non rapproché.';
