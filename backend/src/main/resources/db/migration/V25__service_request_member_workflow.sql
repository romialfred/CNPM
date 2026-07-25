-- V25__service_request_member_workflow.sql
--
-- Espace membre — « Mes requêtes ». Les tables service.request / service.request_message
-- existent depuis V1 ; cette migration ajoute ce qui manque pour que le cotisant crée et
-- suive ses requêtes depuis le portail, sans nouvelle table.
--
-- 1) Une séquence de numérotation lisible et stable pour le numéro de requête, sur le même
--    patron que les autres numéros métier (préfixe + compteur zéro-paddé côté service).
-- 2) Une clé d'idempotence sur la création : rejouer la même soumission ne crée pas un
--    doublon (règle « clé d'idempotence pour les créations sensibles »). La colonne est
--    nullable pour ne pas contraindre les créations back-office existantes.

CREATE SEQUENCE IF NOT EXISTS service.request_number_seq;

ALTER TABLE service.request ADD COLUMN IF NOT EXISTS idempotency_key varchar(160);

COMMENT ON COLUMN service.request.idempotency_key IS
    'Clé d''idempotence de la création (portail membre) ; NULL hors création idempotente.';

-- Unicité partielle : deux créations différentes n'ont jamais la même clé, mais les lignes
-- sans clé (back-office) ne sont pas contraintes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_request_idempotency_key
    ON service.request (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
