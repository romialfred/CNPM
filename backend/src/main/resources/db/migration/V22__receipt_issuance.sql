-- V22__receipt_issuance.sql
--
-- Rend le reçu officiel émissible sans dépendre encore de la GED (Lot 0).
--
-- receipt.receipt est en ajout seul (V4/V5) : un reçu ne se modifie ni ne s'efface — une
-- correction passera par un reçu remplaçant (supersedes_receipt_id). C'est exactement le
-- régime attendu d'un document comptable officiel.
--
-- Le PDF archivé (document_id) relève de la GED, qui n'est pas encore branchée : la colonne
-- devient donc facultative. Le reçu reste néanmoins pleinement vérifiable par son jeton, dont
-- seule l'empreinte est stockée — le jeton lui-même n'est révélé qu'à l'émission.

ALTER TABLE receipt.receipt ALTER COLUMN document_id DROP NOT NULL;

-- Numéro officiel unique, jeton de vérification unique, et au plus un reçu émis par
-- encaissement (l'émission est ainsi idempotente).
CREATE UNIQUE INDEX IF NOT EXISTS uq_receipt_receipt_number
    ON receipt.receipt (receipt_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_receipt_receipt_verification_token_hash
    ON receipt.receipt (verification_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS uq_receipt_receipt_transaction_issued
    ON receipt.receipt (payment_transaction_id) WHERE status = 'ISSUED';

-- Numérotation lisible et unique des reçus (CNPM-REC-<séquence>).
CREATE SEQUENCE IF NOT EXISTS receipt.receipt_number_seq;
