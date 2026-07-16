-- V4__protect_append_only_tables.sql
CREATE OR REPLACE FUNCTION audit.reject_update_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table %.% is append-only; use a compensating record', TG_TABLE_SCHEMA, TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER trg_append_only_member_membership_status_history
BEFORE UPDATE OR DELETE ON member.membership_status_history
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_enrollment_enrollment_review
BEFORE UPDATE OR DELETE ON enrollment.enrollment_review
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_enrollment_enrollment_decision
BEFORE UPDATE OR DELETE ON enrollment.enrollment_decision
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_contribution_adjustment
BEFORE UPDATE OR DELETE ON contribution.adjustment
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_payment_payment_transaction
BEFORE UPDATE OR DELETE ON payment.payment_transaction
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_payment_payment_allocation
BEFORE UPDATE OR DELETE ON payment.payment_allocation
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_payment_provider_event
BEFORE UPDATE OR DELETE ON payment.provider_event
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_payment_bank_statement_line
BEFORE UPDATE OR DELETE ON payment.bank_statement_line
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_receipt_receipt
BEFORE UPDATE OR DELETE ON receipt.receipt
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_recovery_recovery_action
BEFORE UPDATE OR DELETE ON recovery.recovery_action
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_incentive_bonus_line
BEFORE UPDATE OR DELETE ON incentive.bonus_line
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_service_request_message
BEFORE UPDATE OR DELETE ON service.request_message
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_document_document_version
BEFORE UPDATE OR DELETE ON document.document_version
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_notification_delivery_attempt
BEFORE UPDATE OR DELETE ON notification.delivery_attempt
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_integration_outbox_event
BEFORE UPDATE OR DELETE ON integration.outbox_event
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_integration_webhook_delivery
BEFORE UPDATE OR DELETE ON integration.webhook_delivery
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_audit_audit_event
BEFORE UPDATE OR DELETE ON audit.audit_event
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_audit_security_event
BEFORE UPDATE OR DELETE ON audit.security_event
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();

CREATE TRIGGER trg_append_only_audit_data_export
BEFORE UPDATE OR DELETE ON audit.data_export
FOR EACH ROW EXECUTE FUNCTION audit.reject_update_delete();
