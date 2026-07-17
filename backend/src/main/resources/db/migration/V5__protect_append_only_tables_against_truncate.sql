-- V5__protect_append_only_tables_against_truncate.sql
--
-- V4 protège les tables append-only par des triggers `BEFORE UPDATE OR DELETE`
-- de niveau ligne. PostgreSQL ne déclenche aucun trigger de niveau ligne sur un
-- TRUNCATE : la protection des écritures financières validées était donc
-- contournable par `TRUNCATE payment.payment_transaction`, qui vidait la table
-- sans lever d'exception.
--
-- Un TRUNCATE ne peut être intercepté que par un trigger `BEFORE TRUNCATE ...
-- FOR EACH STATEMENT`. V4 étant appliquée, elle est immuable : la correction
-- passe par cette nouvelle migration.
--
-- Périmètre : les 19 tables marquées « Append-only = Oui » dans
-- docs/03-data/data-dictionary.csv, identiques à celles protégées par V4.

CREATE OR REPLACE FUNCTION audit.reject_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table %.% is append-only; TRUNCATE is forbidden, use a compensating record', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_truncate_guard_member_membership_status_history
BEFORE TRUNCATE ON member.membership_status_history
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_enrollment_enrollment_review
BEFORE TRUNCATE ON enrollment.enrollment_review
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_enrollment_enrollment_decision
BEFORE TRUNCATE ON enrollment.enrollment_decision
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_contribution_adjustment
BEFORE TRUNCATE ON contribution.adjustment
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_payment_payment_transaction
BEFORE TRUNCATE ON payment.payment_transaction
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_payment_payment_allocation
BEFORE TRUNCATE ON payment.payment_allocation
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_payment_provider_event
BEFORE TRUNCATE ON payment.provider_event
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_payment_bank_statement_line
BEFORE TRUNCATE ON payment.bank_statement_line
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_receipt_receipt
BEFORE TRUNCATE ON receipt.receipt
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_recovery_recovery_action
BEFORE TRUNCATE ON recovery.recovery_action
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_incentive_bonus_line
BEFORE TRUNCATE ON incentive.bonus_line
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_service_request_message
BEFORE TRUNCATE ON service.request_message
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_document_document_version
BEFORE TRUNCATE ON document.document_version
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_notification_delivery_attempt
BEFORE TRUNCATE ON notification.delivery_attempt
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_integration_outbox_event
BEFORE TRUNCATE ON integration.outbox_event
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_integration_webhook_delivery
BEFORE TRUNCATE ON integration.webhook_delivery
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_audit_audit_event
BEFORE TRUNCATE ON audit.audit_event
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_audit_security_event
BEFORE TRUNCATE ON audit.security_event
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();

CREATE TRIGGER trg_truncate_guard_audit_data_export
BEFORE TRUNCATE ON audit.data_export
FOR EACH STATEMENT EXECUTE FUNCTION audit.reject_truncate();
