-- V10__allow_guarded_outbox_delivery_updates.sql
--
-- V4 rendait toute la ligne integration.outbox_event immuable. Cette protection
-- empêchait toutefois le publisher transactionnel de planifier une nouvelle
-- tentative puis de marquer un événement comme publié. L'enveloppe métier reste
-- strictement append-only ; seuls les trois champs techniques de livraison
-- (status, available_at, published_at) peuvent évoluer avant publication.
--
-- Le vocabulaire complet des statuts de reprise n'étant pas encore contractuel,
-- cette migration n'en invente pas. PUBLISHED est le seul état terminal imposé
-- par la présence de published_at.

-- Le verrou précède le contrôle : aucun producteur ne peut insérer une ligne
-- incohérente entre l'inspection de l'historique et l'installation des gardes.
LOCK TABLE integration.outbox_event IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
      SELECT 1
      FROM integration.outbox_event
      WHERE (status = 'PUBLISHED' AND published_at IS NULL)
         OR (published_at IS NOT NULL AND status <> 'PUBLISHED')
  ) THEN
    RAISE EXCEPTION 'Cannot install outbox delivery guard: existing publication metadata is inconsistent';
  END IF;
END;
$$;

ALTER TABLE integration.outbox_event
  ADD CONSTRAINT ck_outbox_event_publication_metadata
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL));

DROP TRIGGER trg_append_only_integration_outbox_event ON integration.outbox_event;

CREATE OR REPLACE FUNCTION integration.guard_outbox_event_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Table %.% is append-only; DELETE is forbidden', TG_TABLE_SCHEMA, TG_TABLE_NAME;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.aggregate_type IS DISTINCT FROM OLD.aggregate_type
      OR NEW.aggregate_id IS DISTINCT FROM OLD.aggregate_id
      OR NEW.event_type IS DISTINCT FROM OLD.event_type
      OR NEW.payload IS DISTINCT FROM OLD.payload THEN
    RAISE EXCEPTION 'Table %.% is append-only; the event envelope is immutable', TG_TABLE_SCHEMA, TG_TABLE_NAME;
  END IF;

  IF OLD.published_at IS NOT NULL
      AND (NEW.status IS DISTINCT FROM OLD.status
          OR NEW.available_at IS DISTINCT FROM OLD.available_at
          OR NEW.published_at IS DISTINCT FROM OLD.published_at) THEN
    RAISE EXCEPTION 'Published outbox event % is terminal and immutable', OLD.id;
  END IF;

  IF OLD.status = 'PUBLISHED' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Published outbox event % cannot leave terminal status', OLD.id;
  END IF;

  IF NEW.status = 'PUBLISHED' AND NEW.published_at IS NULL THEN
    RAISE EXCEPTION 'Outbox event % in PUBLISHED status requires published_at', OLD.id;
  END IF;

  IF NEW.published_at IS NOT NULL AND NEW.status <> 'PUBLISHED' THEN
    RAISE EXCEPTION 'Outbox event % with published_at must be in PUBLISHED status', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_append_only_integration_outbox_event
BEFORE UPDATE OR DELETE ON integration.outbox_event
FOR EACH ROW EXECUTE FUNCTION integration.guard_outbox_event_delivery();
