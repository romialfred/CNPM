-- V21__payment_transaction_idempotency.sql
--
-- Rend l'enregistrement d'un encaissement réellement idempotent, et lui donne sa numérotation.
--
-- payment.payment_transaction est en ajout seul (V4/V5) : une écriture financière ne se
-- corrige que par une écriture compensatrice, jamais par mise à jour. L'idempotence ne peut
-- donc pas s'appuyer sur un « upsert » ; elle repose sur l'unicité de la clé d'idempotence.
-- Le même encaissement rejoué (même clé) est reconnu et renvoyé, au lieu de créer un doublon
-- — exactement ce que le TDR attend d'un rapprochement fiable.

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_payment_transaction_idempotency_key
    ON payment.payment_transaction (idempotency_key);

-- Numérotation lisible et unique des transactions (CNPM-PAY-<séquence>).
CREATE SEQUENCE IF NOT EXISTS payment.payment_transaction_number_seq;
